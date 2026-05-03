import { statusCodes, Message } from '../../core/common/constant.js'
import { notifyBranchHods } from '../../services/notification/notification.service.js'
import {
  listInventoryBucketSchema,
  inventoryBucketIdParamSchema,
} from '../../validator/inventoryBucket/inventoryBucket.validator.js'
import {
  listInventoryBucketPoProducts,
  getInventoryBucketPoProductById,
  markInventoryReceived,
  markReadyForDispatchment,
} from '../../services/inventoryBucket/inventoryBucket.service.js'

export const listInventoryBucketPoProductsController = async (req, res) => {
  const { error, value } = listInventoryBucketSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }
  const data = await listInventoryBucketPoProducts(value, req.user)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Inventory bucket items retrieved',
    data,
  })
}

export const getInventoryBucketPoProductByIdController = async (req, res) => {
  const { error, value } = inventoryBucketIdParamSchema.validate(
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
  const doc = await getInventoryBucketPoProductById(value.id, req.user)
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

export const markInventoryReceivedController = async (req, res) => {
  const { error, value } = inventoryBucketIdParamSchema.validate(
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
  const before = await getInventoryBucketPoProductById(value.id, req.user)
  const prev = before?.status ? String(before.status) : ''
  const doc = await markInventoryReceived(value.id, req.user)
  if (!doc) {
    return res.status(statusCodes.notFound).json({
      success: false,
      message: 'Item not found',
    })
  }
  const next = String(doc.status || '')
  if (
    doc.branchId &&
    next === 'inventory_received' &&
    prev !== 'inventory_received'
  ) {
    await notifyBranchHods(
      req.app.get('io'),
      doc.branchId,
      'Inventory received',
      `PO ${doc.poCode || '—'} · ${doc.productName || 'Line'} marked inventory received.`,
      { eventType: 'inventory_received', poProductId: String(value.id) }
    )
  }
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Marked as inventory received',
    data: doc,
  })
}

export const markReadyForDispatchmentController = async (req, res) => {
  const { error, value } = inventoryBucketIdParamSchema.validate(
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
  const before = await getInventoryBucketPoProductById(value.id, req.user)
  const prev = before?.status ? String(before.status) : ''
  const doc = await markReadyForDispatchment(value.id, req.user)
  if (!doc) {
    return res.status(statusCodes.notFound).json({
      success: false,
      message: 'Item not found',
    })
  }
  const next = String(doc.status || '')
  if (
    doc.branchId &&
    next === 'ready_for_dispatchment' &&
    prev !== 'ready_for_dispatchment'
  ) {
    await notifyBranchHods(
      req.app.get('io'),
      doc.branchId,
      'Ready for dispatchment',
      `PO ${doc.poCode || '—'} · ${doc.productName || 'Line'} is ready for dispatchment.`,
      {
        eventType: 'ready_for_dispatchment',
        poProductId: String(value.id),
      }
    )
  }
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Marked ready for dispatchment',
    data: doc,
  })
}
