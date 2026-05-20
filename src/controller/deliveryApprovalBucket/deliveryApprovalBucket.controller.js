import { statusCodes, Message, FULL_ACCESS_ROLES } from '../../core/common/constant.js'
import {
  listDeliveryApprovalBucketSchema,
  deliveryApprovalBucketIdParamSchema,
  updatePoProductEnrichmentSchema,
  createPoProductSchema,
} from '../../validator/deliveryApprovalBucket/deliveryApprovalBucket.validator.js'
import {
  listDeliveryApprovalQueuePoProducts,
  getDeliveryApprovalPoProductById,
  getPoProductBucketById,
  approveDeliveryByHod,
  updatePoProductEnrichment,
  createPoProduct,
  getPoCodeSuggestions,
} from '../../services/deliveryApprovalBucket/deliveryApprovalBucket.service.js'

const normalizeRole = (role) =>
  String(role || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')

const isDeliveryApprovalActor = (user) => {
  const r = normalizeRole(user?.role)
  return FULL_ACCESS_ROLES.some((x) => normalizeRole(x) === r)
}

export const listDeliveryApprovalQueuePoProductsController = async (
  req,
  res
) => {
  if (!isDeliveryApprovalActor(req.user)) {
    return res.status(statusCodes.forbidden).json({
      success: false,
      message: 'Only HOD or administrators can access delivery approval',
    })
  }

  const { error, value } = listDeliveryApprovalBucketSchema.validate(
    req.query,
    { abortEarly: false }
  )
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }
  const data = await listDeliveryApprovalQueuePoProducts(value, req.user)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Delivery approval queue retrieved',
    data,
  })
}

export const getDeliveryApprovalPoProductByIdController = async (req, res) => {
  if (!isDeliveryApprovalActor(req.user)) {
    return res.status(statusCodes.forbidden).json({
      success: false,
      message: 'Only HOD or administrators can access delivery approval',
    })
  }

  const { error, value } = deliveryApprovalBucketIdParamSchema.validate(
    { id: req.params?.id },
    { abortEarly: false }
  )
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }
  const doc = await getDeliveryApprovalPoProductById(value.id, req.user)
  if (!doc) {
    return res.status(statusCodes.notFound).json({
      success: false,
      message: 'Item not found',
    })
  }
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Item retrieved',
    data: doc,
  })
}

export const getPoProductBucketByIdController = async (req, res) => {
  const { error, value } = deliveryApprovalBucketIdParamSchema.validate(
    { id: req.params?.id },
    { abortEarly: false }
  )
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }
  const doc = await getPoProductBucketById(value.id, req.user)
  if (!doc) {
    return res.status(statusCodes.notFound).json({
      success: false,
      message: 'Item not found',
    })
  }
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Item retrieved',
    data: doc,
  })
}

export const updatePoProductEnrichmentController = async (req, res) => {
  const paramCheck = deliveryApprovalBucketIdParamSchema.validate(
    { id: req.params?.id },
    { abortEarly: false }
  )
  if (paramCheck.error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: paramCheck.error.details.map((d) => d.message),
    })
  }

  const { error, value } = updatePoProductEnrichmentSchema.validate(req.body, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const doc = await updatePoProductEnrichment(paramCheck.value.id, value)
  if (!doc) {
    return res.status(statusCodes.notFound).json({
      success: false,
      message: 'Item not found',
    })
  }
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'PO product updated',
    data: doc,
  })
}

export const poCodeSuggestionsController = async (req, res) => {
  const search = String(req.query?.search || '').trim()
  const suggestions = await getPoCodeSuggestions(search)
  return res.status(statusCodes.ok).json({ success: true, data: suggestions })
}

export const createPoProductController = async (req, res) => {
  const { error, value } = createPoProductSchema.validate(req.body, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }
  const doc = await createPoProduct(value)
  if (!doc) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: 'Failed to create PO product',
    })
  }
  return res.status(statusCodes.created).json({
    success: true,
    message: 'PO product created',
    data: doc,
  })
}

export const approveDeliveryByHodController = async (req, res) => {
  if (!isDeliveryApprovalActor(req.user)) {
    return res.status(statusCodes.forbidden).json({
      success: false,
      message: 'Only HOD or administrators can access delivery approval',
    })
  }

  const { error, value } = deliveryApprovalBucketIdParamSchema.validate(
    { id: req.params?.id },
    { abortEarly: false }
  )
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }
  const doc = await approveDeliveryByHod(value.id, req.user)
  if (!doc) {
    return res.status(statusCodes.notFound).json({
      success: false,
      message: 'Item not found',
    })
  }
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Delivery approved by HOD',
    data: doc,
  })
}
