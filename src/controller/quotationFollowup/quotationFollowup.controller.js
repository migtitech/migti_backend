import { statusCodes } from '../../core/common/constant.js'
import {
  FULL_ACCESS_ROLES,
  BRANCH_BYPASS_ROLES,
} from '../../core/common/constant.js'
import {
  listQuotationFollowups,
  updateQuotationFollowupRemark,
} from '../../services/quotationFollowup/quotationFollowup.service.js'
import {
  listQuotationFollowupSchema,
  updateQuotationFollowupRemarkSchema,
} from '../../validator/quotationFollowup/quotationFollowup.validator.js'

const normalizeRole = (role) =>
  String(role || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')

const isFullAccessRole = (role) =>
  FULL_ACCESS_ROLES.includes(normalizeRole(role))

const resolveBranchFilter = (user = {}) => {
  const role = normalizeRole(user.role)
  if (BRANCH_BYPASS_ROLES.includes(role)) return {}
  if (user.branchId) return { branchId: user.branchId }
  return {}
}

const resolveZoneIdsForUser = (user = {}) => {
  if (isFullAccessRole(user.role)) return []
  const raw = user.zoneIds || (user.zoneId ? [user.zoneId] : [])
  return (Array.isArray(raw) ? raw : []).map((z) => String(z)).filter(Boolean)
}

export const listQuotationFollowupController = async (req, res) => {
  const { error, value } = listQuotationFollowupSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: error.details.map((d) => d.message).join(', '),
    })
  }

  const user = req.user || {}
  const {
    pageNumber,
    pageSize,
    followupStatus,
    quotationCode,
    companyName,
    overdue,
    includeZoneSalesPersons,
  } = value

  const branchFilter = resolveBranchFilter(user)
  const zoneIds = resolveZoneIdsForUser(user)
  const currentUserId = user._id || user.id || null
  const fullAccess = isFullAccessRole(user.role)

  const result = await listQuotationFollowups({
    zoneIds: fullAccess ? [] : zoneIds,
    followupStatus: followupStatus || undefined,
    quotationCode: quotationCode || undefined,
    companyName: companyName || undefined,
    overdue: overdue !== undefined ? overdue : undefined,
    pageNumber: pageNumber ? Number(pageNumber) : 1,
    pageSize: pageSize ? Number(pageSize) : 20,
    branchFilter,
    includeZoneSalesPersons:
      includeZoneSalesPersons === true || includeZoneSalesPersons === 'true',
    currentUserId,
    isFullAccessRole: fullAccess,
    role: user.role || '',
  })

  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Quotation follow-ups fetched',
    data: result,
  })
}

export const updateQuotationFollowupRemarkController = async (req, res) => {
  const { error, value } = updateQuotationFollowupRemarkSchema.validate(
    req.body,
    { abortEarly: false }
  )
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: error.details.map((d) => d.message).join(', '),
    })
  }

  const user = req.user || {}
  const { followupId, remark } = value

  const branchFilter = resolveBranchFilter(user)

  const entry = await updateQuotationFollowupRemark({
    followupId,
    remark,
    updatedBy: user._id || user.id || null,
    branchFilter,
    currentUserId: user._id || user.id || null,
    isFullAccessRole: isFullAccessRole(user.role),
    role: user.role || '',
  })

  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Follow-up remark updated',
    data: entry,
  })
}
