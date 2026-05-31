import { statusCodes, Message } from '../../core/common/constant.js'
import {
  assignLocalProcurementSchema,
  listLocalProcurementsSchema,
  submitLocalProcurementParamSchema,
  submitLocalProcurementBodySchema,
} from '../../validator/localProcurement/localProcurement.validator.js'
import {
  assignLocalProcurement,
  listLocalProcurements,
  listLocalProcurementEmployees,
  submitLocalProcurement,
} from '../../services/localProcurement/localProcurement.service.js'

export const listLocalProcurementEmployeesController = async (req, res) => {
  const data = await listLocalProcurementEmployees()
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Local procurement employees retrieved',
    data,
  })
}

export const assignLocalProcurementController = async (req, res) => {
  const { error, value } = assignLocalProcurementSchema.validate(req.body, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  try {
    const doc = await assignLocalProcurement({
      queryProductId: value.queryProductId,
      employeeId: value.employeeId,
      remark: value.remark,
      assignedBy: req.user?.id || req.user?._id,
      branchIdFromUser: req.user?.branchId || null,
    })
    if (!doc) {
      return res.status(statusCodes.notFound).json({
        success: false,
        message: 'Query product not found',
      })
    }
    return res.status(statusCodes.ok).json({
      success: true,
      message: 'Local procurement assigned',
      data: doc,
    })
  } catch (e) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: e?.message || 'Failed to assign local procurement',
    })
  }
}

export const listLocalProcurementsController = async (req, res) => {
  const { error, value } = listLocalProcurementsSchema.validate(req.query, {
    abortEarly: false,
    convert: true,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const data = await listLocalProcurements(value, req.user)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Local procurements retrieved',
    data,
  })
}

export const submitLocalProcurementController = async (req, res) => {
  const param = submitLocalProcurementParamSchema.validate(
    { id: req.params?.id },
    { abortEarly: false }
  )
  if (param.error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: param.error.details.map((d) => d.message),
    })
  }

  const { error, value } = submitLocalProcurementBodySchema.validate(req.body, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  try {
    const doc = await submitLocalProcurement(param.value.id, value, req.user)
    if (!doc) {
      return res.status(statusCodes.notFound).json({
        success: false,
        message: 'Local procurement not found',
      })
    }
    return res.status(statusCodes.ok).json({
      success: true,
      message: 'Local procurement submitted',
      data: doc,
    })
  } catch (e) {
    const msg = e?.message || 'Failed to submit local procurement'
    const status = msg.includes('your own')
      ? statusCodes.forbidden
      : statusCodes.badRequest
    return res.status(status).json({
      success: false,
      message: msg,
    })
  }
}
