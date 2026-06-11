import mongoose from 'mongoose'
import { assertSubZoneBelongsToArea } from '../subZone/subZone.service.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'
import { getEmployeeIndustryTerritoryFields } from '../../core/helpers/queryAccess.js'
import {
  countIndustries,
  createIndustry,
  findActiveIndustryByGstRegex,
  findActiveIndustryByName,
  findIndustries,
  findIndustryById,
  findIndustryByIdLean,
  findIndustryByIdWithPopulates,
  softDeleteIndustryById,
  updateIndustryById,
} from '../../repository/industry.repository.js'
import {
  findIndustryPurchaseManagersByIndustryId,
  findIndustryPurchaseManagersByIndustryIds,
  insertIndustryPurchaseManagers,
  softDeleteAllIndustryPurchaseManagersByIndustryId,
  softDeleteIndustryPurchaseManagersByIndustryId,
} from '../../repository/industryPurchaseManager.repository.js'
import { softDeleteIndustryBranchesByIndustryId } from '../../repository/industryBranch.repository.js'
import { clearIndustryIdFromQueries } from '../../repository/query.repository.js'
import { clearIndustryIdFromQuotations } from '../../repository/quotation.repository.js'

const normalizeGstNumber = (gst) => (gst || '').trim().toUpperCase()
export const findActiveIndustryByGstNumber = async (gstNumber) => {
  const normalized = normalizeGstNumber(gstNumber)
  if (!normalized) return null
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return findActiveIndustryByGstRegex(new RegExp(`^${escaped}$`, 'i'))
}

export const addIndustry = async (data) => {
  const normalizedGst = normalizeGstNumber(data.gstNumber)
  data.gstNumber = normalizedGst
  const existingByGst = await findActiveIndustryByGstNumber(normalizedGst)
  if (existingByGst) {
    throw new CustomError(
      statusCodes.conflict,
      'Industry already present',
      errorCodes.already_exist
    )
  }

  const branchFilter = data.branchId ? { branchId: data.branchId } : {}
  const existing = await findActiveIndustryByName(data.name, branchFilter)

  if (existing) {
    throw new CustomError(
      statusCodes.conflict,
      'Industry with this name already exists',
      errorCodes.already_exist
    )
  }

  if (!data.area) {
    data.area = null
  }
  if (!data.subZoneId || String(data.subZoneId).trim() === '') {
    data.subZoneId = null
  }
  const branchScope = data.branchId ? { branchId: data.branchId } : {}
  await assertSubZoneBelongsToArea({
    subZoneId: data.subZoneId,
    areaId: data.area,
    branchFilter: branchScope,
  })

  const { purchaseManagers = [], branchId, ...industryPayload } = data
  const industry = await createIndustry({
    ...industryPayload,
    branchId: branchId || null,
  })
  const industryId = industry._id

  if (purchaseManagers && purchaseManagers.length > 0) {
    await insertIndustryPurchaseManagers(
      purchaseManagers.map((pm) => ({
        industryId,
        name: pm.name || '',
        phone: pm.phone || '',
        email: pm.email || '',
        department: pm.department || '',
      }))
    )
  }

  const result = await findIndustryByIdWithPopulates(industryId)
  const managers = await findIndustryPurchaseManagersByIndustryId(industryId)
  return { ...result, purchaseManagers: managers }
}

export const listIndustries = async ({
  pageNumber = 1,
  pageSize = 10,
  search = '',
  category,
  areaIds = '',
  zoneIds = '',
  branchFilter = {},
  currentUserId = null,
  isFullAccessRole = true,
}) => {
  const page = Math.max(1, parseInt(pageNumber))
  const limit = Math.min(1000, Math.max(1, parseInt(pageSize)))
  const skip = (page - 1) * limit

  const filter = { isDeleted: false, ...branchFilter }

  const territoryFields = await getEmployeeIndustryTerritoryFields({
    currentUserId,
    isFullAccessRole,
  })
  if (territoryFields) {
    Object.assign(filter, territoryFields)
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { location: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { purchase_manager_name: { $regex: search, $options: 'i' } },
      { gstNumber: { $regex: search, $options: 'i' } },
    ]
  }
  if (category) {
    filter.category = category
  }
  if (areaIds && String(areaIds).trim()) {
    const selectedAreaIds = String(areaIds)
      .split(',')
      .map((v) => String(v || '').trim())
      .filter(Boolean)
    if (selectedAreaIds.length) {
      const areaObjectIds = selectedAreaIds
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id))
      filter.area = { $in: [...selectedAreaIds, ...areaObjectIds] }
    }
  }
  if (zoneIds && String(zoneIds).trim()) {
    const selectedZoneIds = String(zoneIds)
      .split(',')
      .map((v) => String(v || '').trim())
      .filter(Boolean)
    if (selectedZoneIds.length) {
      const zoneObjectIds = selectedZoneIds
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id))
      filter.area = { $in: [...selectedZoneIds, ...zoneObjectIds] }
    }
  }

  const totalItems = await countIndustries(filter)

  const industries = await findIndustries(filter, skip, limit)

  const industryIds = industries.map((i) => i._id)
  const allManagers = await findIndustryPurchaseManagersByIndustryIds(industryIds)
  const managersByIndustry = allManagers.reduce((acc, m) => {
    const id = m.industryId?.toString?.() ?? m.industryId
    if (!acc[id]) acc[id] = []
    acc[id].push(m)
    return acc
  }, {})
  const industriesWithManagers = industries.map((ind) => ({
    ...ind,
    purchaseManagers: managersByIndustry[ind._id.toString()] || [],
  }))

  const totalPages = Math.ceil(totalItems / limit)

  return {
    industries: industriesWithManagers,
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

export const getIndustryById = async ({
  industryId,
  branchFilter = {},
  currentUserId = null,
  isFullAccessRole = true,
}) => {
  const territoryFields = await getEmployeeIndustryTerritoryFields({
    currentUserId,
    isFullAccessRole,
  })
  const industry = await findIndustryById({
    _id: industryId,
    isDeleted: false,
    ...branchFilter,
    ...(territoryFields || {}),
  })

  if (!industry) {
    throw new CustomError(
      statusCodes.notFound,
      'Industry not found',
      errorCodes.not_found
    )
  }

  const purchaseManagers = await findIndustryPurchaseManagersByIndustryId(
    industryId
  )
  return { ...industry, purchaseManagers }
}

const nullIfEmpty = (v) => (v === '' || v == null ? null : v)

const ALLOWED_UPDATE_FIELDS = [
  'location',
  'address',
  'gstNumber',
  'purchase_manager_name',
  'purchase_manager_phone',
  'branchId',
  'area',
  'subZoneId',
]

export const updateIndustry = async ({
  industryId,
  purchaseManagers,
  branchFilter = {},
  currentUserId = null,
  isFullAccessRole = true,
  ...updateData
}) => {
  const territoryFields = await getEmployeeIndustryTerritoryFields({
    currentUserId,
    isFullAccessRole,
  })
  const industry = await findIndustryByIdLean({
    _id: industryId,
    isDeleted: false,
    ...branchFilter,
    ...(territoryFields || {}),
  })
  if (!industry) {
    throw new CustomError(
      statusCodes.notFound,
      'Industry not found',
      errorCodes.not_found
    )
  }

  const allowedUpdate = {}
  for (const key of ALLOWED_UPDATE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(updateData, key)) {
      if (
        key === 'branchId' &&
        (updateData[key] === '' || updateData[key] == null)
      ) {
        allowedUpdate[key] = null
      } else if (key === 'area' || key === 'subZoneId') {
        allowedUpdate[key] = nullIfEmpty(updateData[key])
      } else if (key === 'gstNumber') {
        allowedUpdate[key] = normalizeGstNumber(updateData[key])
      } else {
        allowedUpdate[key] = updateData[key]
      }
    }
  }

  if (Object.prototype.hasOwnProperty.call(allowedUpdate, 'gstNumber')) {
    const nextGst = allowedUpdate.gstNumber
    const prevGst = normalizeGstNumber(industry.gstNumber)
    if (nextGst && nextGst !== prevGst) {
      const existingByGst = await findActiveIndustryByGstNumber(nextGst)
      if (
        existingByGst &&
        String(existingByGst._id) !== String(industryId)
      ) {
        throw new CustomError(
          statusCodes.conflict,
          'Industry already present',
          errorCodes.already_exist
        )
      }
    }
  }

  if (
    Object.prototype.hasOwnProperty.call(allowedUpdate, 'area') &&
    allowedUpdate.area == null
  ) {
    allowedUpdate.subZoneId = null
  }

  const mergedArea = Object.prototype.hasOwnProperty.call(allowedUpdate, 'area')
    ? allowedUpdate.area
    : industry.area
  const mergedSub = Object.prototype.hasOwnProperty.call(
    allowedUpdate,
    'subZoneId'
  )
    ? allowedUpdate.subZoneId
    : industry.subZoneId
  const mergedBranchId = Object.prototype.hasOwnProperty.call(
    allowedUpdate,
    'branchId'
  )
    ? allowedUpdate.branchId
    : industry.branchId
  const branchScope = mergedBranchId ? { branchId: mergedBranchId } : {}
  await assertSubZoneBelongsToArea({
    subZoneId: mergedSub,
    areaId: mergedArea,
    branchFilter: branchScope,
  })

  if (Array.isArray(purchaseManagers)) {
    await softDeleteIndustryPurchaseManagersByIndustryId(industryId)
    if (purchaseManagers.length > 0) {
      await insertIndustryPurchaseManagers(
        purchaseManagers.map((pm) => ({
          industryId,
          name: pm.name || '',
          phone: pm.phone || '',
          email: pm.email || '',
          department: pm.department || '',
        }))
      )
    }
  }

  const updated = await updateIndustryById(industryId, allowedUpdate, {
    new: true,
    runValidators: true,
  })

  const managers = await findIndustryPurchaseManagersByIndustryId(industryId)
  return { ...updated, purchaseManagers: managers }
}

export const deleteIndustry = async ({
  industryId,
  branchFilter = {},
  currentUserId = null,
  isFullAccessRole = true,
}) => {
  const territoryFields = await getEmployeeIndustryTerritoryFields({
    currentUserId,
    isFullAccessRole,
  })
  const industry = await findIndustryByIdLean({
    _id: industryId,
    isDeleted: false,
    ...branchFilter,
    ...(territoryFields || {}),
  })
  if (!industry) {
    throw new CustomError(
      statusCodes.notFound,
      'Industry not found',
      errorCodes.not_found
    )
  }

  await softDeleteAllIndustryPurchaseManagersByIndustryId(industryId)
  await softDeleteIndustryBranchesByIndustryId(industryId)
  // Keep industry row (soft-delete) to avoid hard dangling references.
  await softDeleteIndustryById(industryId)

  // Detach deleted industry from historical query/quotation rows.
  await clearIndustryIdFromQueries(industryId)
  await clearIndustryIdFromQuotations(industryId)

  return {
    deletedIndustry: {
      id: industry._id,
      name: industry.name,
      deletedAt: new Date().toISOString(),
    },
  }
}
