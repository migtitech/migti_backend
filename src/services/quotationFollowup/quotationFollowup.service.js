import mongoose from 'mongoose'
import {
  QUOTATION_FOLLOWUP_STATUS,
  findOneQuotationFollowupLean,
  createQuotationFollowup,
  findQuotationFollowupsByQuotationIds,
  updateOneQuotationFollowup,
  findQuotationFollowups,
  countQuotationFollowups,
  findByIdAndUpdateQuotationFollowup,
} from '../../repository/quotationFollowup.repository.js'
import { findOneIndustrySelectAreaName } from '../../repository/industry.repository.js'
import {
  findEmployeesByZoneRoles,
  findEmployeeSelectZoneFields,
} from '../../repository/employee.repository.js'
import {
  findQuotationsSelectFields,
  quotationExists,
} from '../../repository/quotation.repository.js'
import { findQueryIdsLean } from '../../repository/query.repository.js'
import { distinctPurchaseOrderQuotationIds } from '../../repository/purchaseOrder.repository.js'
import {
  getTerritoryIndustryIdsForUser,
  resolveQueryAccessFilter,
} from '../../core/helpers/queryAccess.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'

const SALES_ZONE_ROLES = ['sales_manager', 'sales_exicutive', 'sales']

const resolveZoneIdFromQuotation = async (quotation = {}) => {
  const industryId = quotation.industry_id
  if (industryId && mongoose.Types.ObjectId.isValid(String(industryId))) {
    const industry = await findOneIndustrySelectAreaName({
      _id: industryId,
      isDeleted: false,
    })
    if (industry?.area) return industry.area
  }

  const areaRaw = quotation.companyInfo?.area
  if (areaRaw && mongoose.Types.ObjectId.isValid(String(areaRaw))) {
    return new mongoose.Types.ObjectId(String(areaRaw))
  }

  return null
}

const resolveCompanyName = (quotation = {}) =>
  String(
    quotation.companyInfo?.name ||
      quotation.companyInfo?.companyName ||
      ''
  ).trim()

/** Create follow-up row when a quotation is created. Idempotent. */
export const createQuotationFollowupEntry = async ({ quotation } = {}) => {
  const quotationId = quotation?._id
  if (!quotationId) return null

  const existing = await findOneQuotationFollowupLean({
    quotationId,
    isDeleted: false,
  })
  if (existing) return existing

  const zoneId = await resolveZoneIdFromQuotation(quotation)
  const followupDate = new Date()
  followupDate.setDate(followupDate.getDate() + 2)

  const entry = await createQuotationFollowup({
    quotationId,
    quotationCode: String(quotation.quotationCode || '').trim(),
    status: String(quotation.status || '').trim(),
    followupStatus: QUOTATION_FOLLOWUP_STATUS.PENDING,
    followup_date: followupDate,
    remark: '',
    zoneId,
    industry_id: quotation.industry_id || null,
    companyName: resolveCompanyName(quotation),
    salesEmployeeId: quotation.created_by || null,
    branchId: quotation.branchId || null,
  })

  return entry
}

/** Same visibility rules as `listQuotations` for zone-scoped sales users. */
const buildQuotationAccessFilter = async ({
  currentUserId = null,
  isFullAccessRole = true,
  branchFilter = {},
  role = '',
}) => {
  if (!currentUserId || isFullAccessRole) return {}

  const territoryIds = await getTerritoryIndustryIdsForUser({
    currentUserId,
    isFullAccessRole: false,
    branchFilter,
  })
  if (territoryIds != null) {
    return { industry_id: { $in: territoryIds } }
  }

  const accessFilter = await resolveQueryAccessFilter({
    currentUserId,
    isFullAccessRole: false,
    role,
    branchFilter,
  })
  const queries = await findQueryIdsLean({
    isDeleted: false,
    ...branchFilter,
    ...accessFilter,
  })
  const queryIds = (queries || []).map((q) => q._id)
  if (!queryIds.length) return { queryId: { $in: [] } }
  return { queryId: { $in: queryIds } }
}

const getPurchaseOrderQuotationIds = async () =>
  distinctPurchaseOrderQuotationIds({
    isDeleted: false,
    quotationId: { $ne: null },
  })

const syncMissingFollowupEntries = async (quotations = []) => {
  if (!quotations.length) return

  const quotationIds = quotations.map((q) => q._id)
  const existing = await findQuotationFollowupsByQuotationIds(quotationIds)
  const existingByQuotationId = new Map(
    existing.map((row) => [String(row.quotationId), row])
  )

  for (const quotation of quotations) {
    const key = String(quotation._id)
    const row = existingByQuotationId.get(key)
    if (!row) {
      await createQuotationFollowupEntry({ quotation })
      continue
    }

    const quotationIndustryId = quotation.industry_id
    if (
      quotationIndustryId &&
      (!row.industry_id ||
        String(row.industry_id) !== String(quotationIndustryId))
    ) {
      const zoneId = await resolveZoneIdFromQuotation(quotation)
      await updateOneQuotationFollowup(
        { _id: row._id },
        {
          $set: {
            industry_id: quotationIndustryId,
            zoneId,
            companyName: resolveCompanyName(quotation),
            quotationCode: String(quotation.quotationCode || '').trim(),
            status: String(quotation.status || '').trim(),
          },
        }
      )
    }
  }
}

const getSalesPersonsForZones = async (zoneIds = [], branchFilter = {}) => {
  const validZoneIds = (Array.isArray(zoneIds) ? zoneIds : [])
    .filter((id) => mongoose.Types.ObjectId.isValid(String(id)))
    .map((id) => new mongoose.Types.ObjectId(String(id)))

  if (!validZoneIds.length) return []

  return findEmployeesByZoneRoles({
    ...branchFilter,
    isDeleted: false,
    role: { $in: SALES_ZONE_ROLES },
    $or: [{ zoneIds: { $in: validZoneIds } }, { zoneId: { $in: validZoneIds } }],
  })
}

const resolveEmployeeZoneIds = (employee = {}) => {
  const zoneIds = Array.isArray(employee.zoneIds) ? employee.zoneIds : []
  const normalizedZoneIds = zoneIds
    .map((id) => (id && typeof id === 'object' && id._id ? id._id : id))
    .filter((id) => mongoose.Types.ObjectId.isValid(String(id)))
    .map((id) => new mongoose.Types.ObjectId(String(id)))
  if (normalizedZoneIds.length) return normalizedZoneIds
  const legacyZoneId = employee.zoneId
  if (legacyZoneId && mongoose.Types.ObjectId.isValid(String(legacyZoneId))) {
    return [new mongoose.Types.ObjectId(String(legacyZoneId))]
  }
  return []
}

export const listQuotationFollowups = async ({
  zoneIds = [],
  followupStatus = '',
  quotationCode = '',
  companyName = '',
  overdue = false,
  pageNumber = 1,
  pageSize = 20,
  branchFilter = {},
  includeZoneSalesPersons = false,
  currentUserId = null,
  isFullAccessRole = true,
  role = '',
} = {}) => {
  const quotationIdsWithPurchaseOrder = await getPurchaseOrderQuotationIds()

  const quotationAccessFilter = await buildQuotationAccessFilter({
    currentUserId,
    isFullAccessRole,
    branchFilter,
    role,
  })

  const eligibleQuotationFilter = {
    isDeleted: false,
    ...branchFilter,
    ...quotationAccessFilter,
    ...(quotationIdsWithPurchaseOrder.length
      ? { _id: { $nin: quotationIdsWithPurchaseOrder } }
      : {}),
  }

  const eligibleQuotations = await findQuotationsSelectFields(
    eligibleQuotationFilter,
    '_id quotationCode status industry_id companyInfo branchId created_by'
  )

  await syncMissingFollowupEntries(eligibleQuotations)

  const eligibleQuotationIds = eligibleQuotations.map((q) => q._id)

  const filter = { isDeleted: false, ...branchFilter }

  if (currentUserId && !isFullAccessRole) {
    filter.quotationId = eligibleQuotationIds.length
      ? { $in: eligibleQuotationIds }
      : { $in: [] }
  } else if (quotationIdsWithPurchaseOrder.length) {
    filter.quotationId = { $nin: quotationIdsWithPurchaseOrder }
  }

  if (followupStatus && String(followupStatus).trim()) {
    const statusVal = String(followupStatus).trim()
    if (statusVal === QUOTATION_FOLLOWUP_STATUS.PENDING) {
      filter.followupCount = 0
      filter.followupStatus = QUOTATION_FOLLOWUP_STATUS.PENDING
    } else if (statusVal === QUOTATION_FOLLOWUP_STATUS.FOLLOWED_UP) {
      filter.followupCount = { $gte: 1 }
    } else if (statusVal === QUOTATION_FOLLOWUP_STATUS.CLOSED) {
      filter.followupStatus = QUOTATION_FOLLOWUP_STATUS.CLOSED
    } else {
      filter.followupStatus = statusVal
    }
  }

  if (quotationCode && String(quotationCode).trim()) {
    filter.quotationCode = { $regex: String(quotationCode).trim(), $options: 'i' }
  }

  if (companyName && String(companyName).trim()) {
    filter.companyName = { $regex: String(companyName).trim(), $options: 'i' }
  }

  if (overdue === true || overdue === 'true') {
    filter.followup_date = { $lt: new Date() }
    filter.followupCount = 0
    filter.followupStatus = QUOTATION_FOLLOWUP_STATUS.PENDING
  }

  const overdueBaseFilter = {
    isDeleted: false,
    ...branchFilter,
    followupCount: 0,
    followupStatus: QUOTATION_FOLLOWUP_STATUS.PENDING,
    followup_date: { $lt: new Date() },
    ...(currentUserId && !isFullAccessRole
      ? {
          quotationId: eligibleQuotationIds.length
            ? { $in: eligibleQuotationIds }
            : { $in: [] },
        }
      : quotationIdsWithPurchaseOrder.length
        ? { quotationId: { $nin: quotationIdsWithPurchaseOrder } }
        : {}),
  }

  const skip = (Number(pageNumber) - 1) * Number(pageSize)
  const [items, total, overdueCount] = await Promise.all([
    findQuotationFollowups(filter, { skip, limit: Number(pageSize) }),
    countQuotationFollowups(filter),
    countQuotationFollowups(overdueBaseFilter),
  ])

  let zoneSalesPersons = []
  if (includeZoneSalesPersons) {
    let salesPersonZoneIds = zoneIds
    if (currentUserId && !isFullAccessRole) {
      const employee = await findEmployeeSelectZoneFields({
        _id: currentUserId,
        isDeleted: false,
      })
      salesPersonZoneIds = resolveEmployeeZoneIds(employee).map(String)
    }
    if (salesPersonZoneIds?.length) {
      zoneSalesPersons = await getSalesPersonsForZones(
        salesPersonZoneIds,
        branchFilter
      )
    }
  }

  return {
    items,
    zoneSalesPersons,
    overdueCount,
    pagination: {
      currentPage: Number(pageNumber),
      totalPages: Math.ceil(total / Number(pageSize)) || 1,
      totalItems: total,
      pageSize: Number(pageSize),
    },
  }
}

export const updateQuotationFollowupRemark = async ({
  followupId,
  remark,
  updatedBy = null,
  branchFilter = {},
  currentUserId = null,
  isFullAccessRole = true,
  role = '',
}) => {
  const trimmedRemark = String(remark || '').trim()
  if (!trimmedRemark) {
    throw new CustomError(
      statusCodes.badRequest,
      'Remark is required',
      errorCodes.bad_request
    )
  }

  const existing = await findOneQuotationFollowupLean({
    _id: followupId,
    isDeleted: false,
    ...branchFilter,
  })

  if (!existing) {
    throw new CustomError(
      statusCodes.notFound,
      'Quotation follow-up not found',
      errorCodes.not_found
    )
  }

  if (currentUserId && !isFullAccessRole) {
    const poQuotationIds = await getPurchaseOrderQuotationIds()
    const quotationAccessFilter = await buildQuotationAccessFilter({
      currentUserId,
      isFullAccessRole: false,
      branchFilter,
      role,
    })
    const canAccess = await quotationExists({
      _id: existing.quotationId,
      isDeleted: false,
      ...branchFilter,
      ...quotationAccessFilter,
      ...(poQuotationIds.length ? { _id: { $nin: poQuotationIds } } : {}),
    })
    if (!canAccess) {
      throw new CustomError(
        statusCodes.notFound,
        'Quotation follow-up not found',
        errorCodes.not_found
      )
    }
  }

  const fromCount = Number(existing.followupCount) || 0
  const fromHistory = Array.isArray(existing.followupHistory)
    ? existing.followupHistory.length
    : 0
  const nextSequence = Math.max(fromCount, fromHistory) + 1

  const historyEntry = {
    sequence: nextSequence,
    remark: trimmedRemark,
    followedUpBy: updatedBy || null,
    followedUpAt: new Date(),
  }

  const updated = await findByIdAndUpdateQuotationFollowup(
    followupId,
    {
      $set: {
        remark: trimmedRemark,
        followupStatus: QUOTATION_FOLLOWUP_STATUS.FOLLOWED_UP,
        followupCount: nextSequence,
      },
      $push: { followupHistory: historyEntry },
    },
    { new: true, runValidators: true }
  )

  return updated
}
