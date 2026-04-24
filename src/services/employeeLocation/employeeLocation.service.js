import mongoose from 'mongoose'
import EmployeeLocationModel from '../../models/employeeLocation.model.js'
import EmployeeModel from '../../models/employee.model.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'

export const createEmployeeLocation = async ({
  employeeId,
  latitude,
  longitude,
  city = '',
  locality = '',
  accuracyM = null,
  created_by = null,
}) => {
  const employee = await EmployeeModel.findOne({
    _id: employeeId,
    isDeleted: false,
  }).lean()
  if (!employee) {
    throw new CustomError(
      statusCodes.badRequest,
      'Employee not found',
      errorCodes.not_found
    )
  }

  const doc = await EmployeeLocationModel.create({
    employeeId,
    latitude: Number(latitude),
    longitude: Number(longitude),
    city: String(city || '').trim(),
    locality: String(locality || '').trim(),
    accuracyM: accuracyM == null || accuracyM === '' ? null : Number(accuracyM),
    created_by: created_by || null,
  })

  return doc.toObject()
}

export const listEmployeeLocations = async ({
  pageNumber = 1,
  pageSize = 10,
  employeeId = '',
}) => {
  const page = Math.max(1, parseInt(pageNumber, 10))
  const limit = Math.min(100, Math.max(1, parseInt(pageSize, 10)))
  const skip = (page - 1) * limit

  const filter = {
    isDeleted: false,
    ...(employeeId ? { employeeId } : {}),
  }

  const totalItems = await EmployeeLocationModel.countDocuments(filter)
  const locations = await EmployeeLocationModel.find(filter)
    .populate('employeeId', 'name email role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

  const totalPages = Math.max(1, Math.ceil(totalItems / limit))

  return {
    locations: locations.map((item) => ({
      _id: item._id,
      employeeId: item.employeeId?._id || item.employeeId || null,
      employeeName: item.employeeId?.name || '-',
      employeeEmail: item.employeeId?.email || '',
      employeeRole: item.employeeId?.role || '',
      latitude: item.latitude,
      longitude: item.longitude,
      city: item.city || '',
      locality: item.locality || '',
      accuracyM: item.accuracyM == null ? null : item.accuracyM,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })),
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  }
}

/** Most recent non-deleted row for the employee (by `createdAt`). */
/**
 * All non-deleted employees with their most recent location row (if any).
 */
export const listTeamEmployeesWithLatestLocation = async () => {
  const locCollection = EmployeeLocationModel.collection.name

  const pipeline = [
    { $match: { isDeleted: false } },
    {
      $lookup: {
        from: locCollection,
        let: { empId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$employeeId', '$$empId'] },
                  { $eq: ['$isDeleted', false] },
                ],
              },
            },
          },
          { $sort: { createdAt: -1 } },
          { $limit: 1 },
          {
            $project: {
              latitude: 1,
              longitude: 1,
              city: 1,
              locality: 1,
              createdAt: 1,
            },
          },
        ],
        as: 'lastLoc',
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        role: 1,
        lastLoc: { $arrayElemAt: ['$lastLoc', 0] },
      },
    },
    { $sort: { name: 1 } },
  ]

  const rows = await EmployeeModel.aggregate(pipeline)

  return (rows || []).map((r) => {
    const loc = r.lastLoc
    return {
      employeeId: r._id,
      name: r.name,
      email: r.email,
      role: r.role,
      lastLocation: loc
        ? {
            latitude: loc.latitude,
            longitude: loc.longitude,
            city: loc.city || '',
            locality: loc.locality || '',
            fetchedAt: loc.createdAt,
          }
        : null,
    }
  })
}

/**
 * Location history for one employee: one point per time bucket (default 30 minutes),
 * keeping the latest reading within each bucket. Paginated on the bucketed rows.
 */
export const listEmployeeLocationHistoryBinned = async ({
  employeeId,
  pageNumber = 1,
  pageSize = 10,
  intervalMinutes = 30,
}) => {
  const employee = await EmployeeModel.findOne({
    _id: employeeId,
    isDeleted: false,
  })
    .select('_id')
    .lean()

  if (!employee) {
    throw new CustomError(
      statusCodes.badRequest,
      'Employee not found',
      errorCodes.not_found
    )
  }

  const page = Math.max(1, parseInt(pageNumber, 10))
  const limit = Math.min(100, Math.max(1, parseInt(pageSize, 10)))
  const skip = (page - 1) * limit
  const intervalMs = Math.max(1, parseInt(intervalMinutes, 10)) * 60 * 1000

  const oid = new mongoose.Types.ObjectId(employeeId)

  const pipeline = [
    { $match: { isDeleted: false, employeeId: oid } },
    { $sort: { createdAt: -1 } },
    {
      $addFields: {
        bucket: {
          $floor: { $divide: [{ $toLong: '$createdAt' }, intervalMs] },
        },
      },
    },
    {
      $group: {
        _id: '$bucket',
        doc: { $first: '$$ROOT' },
      },
    },
    { $replaceRoot: { newRoot: '$doc' } },
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        total: [{ $count: 'count' }],
        page: [{ $skip: skip }, { $limit: limit }],
      },
    },
  ]

  const [agg] = await EmployeeLocationModel.aggregate(pipeline)
  const totalItems = agg?.total?.[0]?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalItems / limit))
  const raw = agg?.page || []

  const locations = raw.map((item) => ({
    _id: item._id,
    latitude: item.latitude,
    longitude: item.longitude,
    city: item.city || '',
    locality: item.locality || '',
    accuracyM: item.accuracyM == null ? null : item.accuracyM,
    fetchedAt: item.createdAt,
  }))

  return {
    locations,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      intervalMinutes: parseInt(intervalMinutes, 10),
    },
  }
}

export const getLatestEmployeeLocation = async ({ employeeId }) => {
  if (!employeeId) {
    return null
  }

  const row = await EmployeeLocationModel.findOne({
    isDeleted: false,
    employeeId,
  })
    .sort({ createdAt: -1 })
    .lean()

  if (!row) {
    return null
  }

  return {
    city: row.city || '',
    locality: row.locality || '',
    latitude: row.latitude,
    longitude: row.longitude,
    createdAt: row.createdAt,
  }
}
