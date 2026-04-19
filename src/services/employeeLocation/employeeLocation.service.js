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
  const employee = await EmployeeModel.findOne({ _id: employeeId, isDeleted: false }).lean()
  if (!employee) {
    throw new CustomError(statusCodes.badRequest, 'Employee not found', errorCodes.not_found)
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

export const listEmployeeLocations = async ({ pageNumber = 1, pageSize = 10, employeeId = '' }) => {
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
