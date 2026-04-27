import { Message, statusCodes } from '../../core/common/constant.js'
import { BRANCH_BYPASS_ROLES } from '../../core/common/constant.js'
import { getBranchFilter } from '../../core/helpers/branchFilter.js'
import { appendPoPaymentLedgerSchema } from '../../validator/poPayment/poPayment.validator.js'
import { appendPoPaymentLedger } from '../../services/purchaseOrder/purchaseOrder.service.js'

const normalizeRole = (role) =>
  String(role || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
const isBackOfficeRole = (role) => {
  const normalized = normalizeRole(role)
  if (
    ['back_office_exicutive', 'back_office_executive', 'boe'].includes(
      normalized
    )
  )
    return true
  return normalized.replace(/_/g, '').includes('backoffice')
}
const hasOwnershipBypass = (role) => {
  const normalized = normalizeRole(role)
  if (BRANCH_BYPASS_ROLES.includes(normalized)) return true
  return isBackOfficeRole(normalized)
}
const resolvePoBranchFilter = (req, options = {}) => {
  if (isBackOfficeRole(req?.user?.role)) return {}
  return getBranchFilter(req, options)
}

export const appendPoPaymentLedgerController = async (req, res) => {
  const { error, value } = appendPoPaymentLedgerSchema.validate(
    { ...req.body, ...req.query },
    { abortEarly: false }
  )
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const body = { ...value }
  const fromQuery = req.query.purchaseOrderId
  if (!body.purchaseOrderId && fromQuery) body.purchaseOrderId = fromQuery

  const branchFilter = resolvePoBranchFilter(req, { allowQueryBranchId: true })
  const currentUserId = req.user?.id || req.user?._id
  const isFullAccessRole = hasOwnershipBypass(req.user?.role)
  const result = await appendPoPaymentLedger({
    ...body,
    branchFilter,
    currentUserId: currentUserId || null,
    isFullAccessRole: !!isFullAccessRole,
  })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Payment recorded',
    data: result,
  })
}
