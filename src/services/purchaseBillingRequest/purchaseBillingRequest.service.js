import mongoose from 'mongoose'
import PurchaseOrderModel from '../../models/purchaseOrder.model.js'
import PoProductModel, {
  PO_PRODUCT_PROCUREMENT_STATUS,
} from '../../models/poProduct.model.js'
import EmployeeModel from '../../models/employee.model.js'
import DocumentModel from '../../models/document.model.js'
import PurchaseBillingRequestModel, {
  PURCHASE_BILLING_REQUEST_STATUS,
} from '../../models/purchaseBillingRequest.model.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'
import { toDisplayPath } from '../document/document.service.js'

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/

const toOid = (v) => {
  if (v == null || v === '') return null
  if (!OBJECT_ID_REGEX.test(String(v))) return null
  return new mongoose.Types.ObjectId(String(v))
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const isImageDocumentRecord = (doc) => {
  if (!doc || typeof doc !== 'object') return false
  const mime = doc.mimeType != null ? String(doc.mimeType) : ''
  if (mime && /^image\//i.test(mime)) return true
  const path = doc.path != null ? String(doc.path) : ''
  return path ? /\.(jpe?g|png|gif|webp|bmp)$/i.test(path) : false
}

const resolveOptionalProofDocumentId = async (raw) => {
  if (raw == null || raw === '') return null
  const id = String(raw).trim()
  if (!OBJECT_ID_REGEX.test(id)) {
    throw new CustomError(
      statusCodes.badRequest,
      'Invalid proof document id',
      errorCodes.validation_error
    )
  }
  const doc = await DocumentModel.findById(id).lean()
  if (!doc) {
    throw new CustomError(
      statusCodes.badRequest,
      'Proof document not found',
      errorCodes.bad_request
    )
  }
  if (!isImageDocumentRecord(doc)) {
    throw new CustomError(
      statusCodes.badRequest,
      'Payment proof must be an image file',
      errorCodes.bad_request
    )
  }
  return id
}

const startOfUtcDay = (yyyyMmDd) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(yyyyMmDd || '').trim())
  if (!m) return null
  return new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00.000Z`)
}

const endOfUtcDay = (yyyyMmDd) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(yyyyMmDd || '').trim())
  if (!m) return null
  return new Date(`${m[1]}-${m[2]}-${m[3]}T23:59:59.999Z`)
}

const buildEmployeeSnapshot = async (employeeId) => {
  const id = toOid(employeeId)
  if (!id) return null
  const e = await EmployeeModel.findById(id).select('-password').lean()
  return e || null
}

const applyCreatedAtRange = (filter, dateFrom, dateTo) => {
  const fromD =
    dateFrom && String(dateFrom).trim() ? startOfUtcDay(dateFrom) : null
  const toD = dateTo && String(dateTo).trim() ? endOfUtcDay(dateTo) : null
  if (fromD && toD && fromD > toD) {
    throw new CustomError(
      statusCodes.badRequest,
      'dateFrom must be on or before dateTo',
      errorCodes.bad_request
    )
  }
  if (!fromD && !toD) return
  const createdAt = {}
  if (fromD) createdAt.$gte = fromD
  if (toD) createdAt.$lte = toD
  filter.createdAt = createdAt
}

const shapeRow = (doc, billUrl = null) => {
  const po =
    doc.purchaseOrderId && typeof doc.purchaseOrderId === 'object'
      ? doc.purchaseOrderId
      : null
  const createdBy =
    doc.createdBy && typeof doc.createdBy === 'object' ? doc.createdBy : null
  const productSnap =
    doc.productSnapshot && typeof doc.productSnapshot === 'object'
      ? doc.productSnapshot
      : null
  const poCode = (po && po.poCode) || (productSnap && productSnap.poCode) || ''
  return {
    _id: doc._id,
    uniqueId: doc.uniqueId || '',
    amount: Number(doc.amount) || 0,
    status: doc.status || PURCHASE_BILLING_REQUEST_STATUS.PENDING,
    statusRemark: String(doc.statusRemark || ''),
    branchId: doc.branchId || null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    purchaseOrderId: po?._id || doc.purchaseOrderId || null,
    poCode: String(poCode || '').toUpperCase(),
    companyName: productSnap?.companyInfo?.name || po?.companyInfo?.name || '—',
    productName: productSnap?.productName || '—',
    lineIndex: productSnap?.lineIndex != null ? productSnap.lineIndex : '—',
    createdByName: createdBy?.name || '—',
    createdByEmail: createdBy?.email || '',
    billDocument: billUrl
      ? {
          url: billUrl,
          originalName:
            (doc.billDocumentId &&
              typeof doc.billDocumentId === 'object' &&
              doc.billDocumentId.originalName) ||
            '',
        }
      : null,
  }
}

export const listPurchaseBillingRequests = async ({
  pageNumber = 1,
  pageSize = 20,
  poCode = '',
  dateFrom = '',
  dateTo = '',
  status = '',
}) => {
  const page = Math.max(1, parseInt(pageNumber, 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20))
  const skip = (page - 1) * limit

  const base = { isDeleted: false }
  const statusTrim = status != null ? String(status).trim().toLowerCase() : ''
  if (
    statusTrim === PURCHASE_BILLING_REQUEST_STATUS.PENDING ||
    statusTrim === PURCHASE_BILLING_REQUEST_STATUS.APPROVED ||
    statusTrim === PURCHASE_BILLING_REQUEST_STATUS.REJECTED
  ) {
    base.status = statusTrim
  }
  applyCreatedAtRange(base, dateFrom, dateTo)

  const q = (poCode && String(poCode).trim()) || ''
  if (q) {
    const term = escapeRegex(q.trim())
    const re = new RegExp(term, 'i')
    const matchingPoIds = await PurchaseOrderModel.find({
      isDeleted: false,
      poCode: re,
    })
      .select('_id')
      .lean()
    const idList = (matchingPoIds || []).map((p) => p._id)
    base.$or = [
      { purchaseOrderId: { $in: idList } },
      { 'productSnapshot.poCode': re },
    ]
  }

  const [totalItems, raw] = await Promise.all([
    PurchaseBillingRequestModel.countDocuments(base),
    PurchaseBillingRequestModel.find(base)
      .populate('purchaseOrderId', 'poCode companyInfo')
      .populate('createdBy', 'name email')
      .populate('billDocumentId', 'path originalName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ])

  const rows = await Promise.all(
    raw.map(async (doc) => {
      let url = null
      const att = doc.billDocumentId
      if (att && typeof att === 'object' && att.path) {
        url = await toDisplayPath(att.path)
      }
      return shapeRow({ ...doc }, url)
    })
  )

  const totalPages = Math.max(1, Math.ceil(totalItems / limit))
  return {
    rows,
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

export const getPurchaseBillingRequestById = async (id) => {
  if (!id || !OBJECT_ID_REGEX.test(String(id))) {
    throw new CustomError(
      statusCodes.badRequest,
      'Invalid billing request id',
      errorCodes.bad_request
    )
  }
  const doc = await PurchaseBillingRequestModel.findOne({
    _id: id,
    isDeleted: false,
  })
    .populate('purchaseOrderId', 'poCode companyInfo')
    .populate({
      path: 'poProductId',
      select: 'productName lineIndex companyInfo attachmentDocumentId',
      populate: {
        path: 'attachmentDocumentId',
        select: 'path originalName mimeType',
      },
    })
    .populate('createdBy', 'name email phone role')
    .populate('approvedBy', 'name email phone role')
    .populate('billDocumentId', 'path originalName mimeType')
    .populate('proofDocumentId', 'path originalName mimeType')
    .lean()

  if (!doc) {
    throw new CustomError(
      statusCodes.notFound,
      'Billing request not found',
      errorCodes.not_found
    )
  }

  let billUrl = null
  let originalName = ''
  if (doc.billDocumentId && doc.billDocumentId.path) {
    billUrl = await toDisplayPath(doc.billDocumentId.path)
    originalName = doc.billDocumentId.originalName || ''
  }

  let proofUrl = null
  let proofOriginalName = ''
  let proofMime = ''
  if (doc.proofDocumentId && doc.proofDocumentId.path) {
    proofUrl = await toDisplayPath(doc.proofDocumentId.path)
    proofOriginalName = doc.proofDocumentId.originalName || ''
    proofMime = doc.proofDocumentId.mimeType || ''
  }

  const line = shapeRow(
    {
      ...doc,
      billDocumentId: doc.billDocumentId
        ? { path: doc.billDocumentId.path, originalName }
        : null,
    },
    billUrl
  )

  let poProductResolved = doc.poProductId || null
  if (
    poProductResolved?.attachmentDocumentId &&
    typeof poProductResolved.attachmentDocumentId === 'object' &&
    poProductResolved.attachmentDocumentId.path
  ) {
    const signedPath = await toDisplayPath(
      poProductResolved.attachmentDocumentId.path
    )
    poProductResolved = {
      ...poProductResolved,
      attachmentDocumentId: {
        ...poProductResolved.attachmentDocumentId,
        path: signedPath,
      },
    }
  }

  return {
    ...line,
    productSnapshot: doc.productSnapshot || null,
    createdBySnapshot: doc.createdBySnapshot || null,
    approvedBy: doc.approvedBy || null,
    approvedBySnapshot: doc.approvedBySnapshot || null,
    approvedAt: doc.approvedAt || null,
    poProductId: poProductResolved,
    billDocument: billUrl
      ? {
          url: billUrl,
          originalName,
          mimeType: doc.billDocumentId?.mimeType || '',
        }
      : null,
    proofDocument: proofUrl
      ? {
          url: proofUrl,
          originalName: proofOriginalName,
          mimeType: proofMime,
        }
      : null,
  }
}

export const updatePurchaseBillingRequestProof = async (id, proofDocumentId) => {
  if (!id || !OBJECT_ID_REGEX.test(String(id))) {
    throw new CustomError(
      statusCodes.badRequest,
      'Invalid billing request id',
      errorCodes.bad_request
    )
  }
  const resolved = await resolveOptionalProofDocumentId(proofDocumentId)

  const existing = await PurchaseBillingRequestModel.findOne({
    _id: id,
    isDeleted: false,
  }).lean()
  if (!existing) {
    throw new CustomError(
      statusCodes.notFound,
      'Billing request not found',
      errorCodes.not_found
    )
  }

  await PurchaseBillingRequestModel.findByIdAndUpdate(id, {
    $set: { proofDocumentId: resolved },
  })

  return getPurchaseBillingRequestById(id)
}

export const updatePurchaseBillingRequestRemark = async (id, statusRemark) => {
  if (!id || !OBJECT_ID_REGEX.test(String(id))) {
    throw new CustomError(
      statusCodes.badRequest,
      'Invalid billing request id',
      errorCodes.bad_request
    )
  }
  const next = String(statusRemark ?? '').trim()
  const doc = await PurchaseBillingRequestModel.findOneAndUpdate(
    {
      _id: id,
      isDeleted: false,
      status: PURCHASE_BILLING_REQUEST_STATUS.PENDING,
    },
    { $set: { statusRemark: next } },
    { new: true }
  )
    .populate('purchaseOrderId', 'poCode companyInfo')
    .populate('createdBy', 'name email')
    .populate('billDocumentId', 'path originalName')
    .lean()

  if (!doc) {
    throw new CustomError(
      statusCodes.badRequest,
      'Request not found or not pending; remark can only be saved for pending items',
      errorCodes.bad_request
    )
  }

  let url = null
  if (doc.billDocumentId && doc.billDocumentId.path) {
    url = await toDisplayPath(doc.billDocumentId.path)
  }
  return shapeRow(doc, url)
}

export const approvePurchaseBillingRequest = async (id, statusRemark, user) => {
  if (!id || !OBJECT_ID_REGEX.test(String(id))) {
    throw new CustomError(
      statusCodes.badRequest,
      'Invalid billing request id',
      errorCodes.bad_request
    )
  }
  const userId = user?.id || user?._id
  const approverId = toOid(userId)
  if (!approverId) {
    throw new CustomError(
      statusCodes.unauthorized,
      'Invalid user',
      errorCodes.unauthorized
    )
  }
  const existing = await PurchaseBillingRequestModel.findOne({
    _id: id,
    isDeleted: false,
  }).lean()
  if (!existing) {
    throw new CustomError(
      statusCodes.notFound,
      'Billing request not found',
      errorCodes.not_found
    )
  }
  if (existing.status !== PURCHASE_BILLING_REQUEST_STATUS.PENDING) {
    throw new CustomError(
      statusCodes.badRequest,
      'This billing request is not pending',
      errorCodes.bad_request
    )
  }
  const proofRef = existing.proofDocumentId
  const proofId =
    proofRef && typeof proofRef === 'object' && proofRef._id != null
      ? proofRef._id
      : proofRef
  const proofOid = toOid(proofId)
  if (!proofOid) {
    throw new CustomError(
      statusCodes.badRequest,
      'Upload payment proof before approving this billing request',
      errorCodes.bad_request
    )
  }
  const proofDoc = await DocumentModel.findById(proofOid).lean()
  if (!proofDoc || !isImageDocumentRecord(proofDoc)) {
    throw new CustomError(
      statusCodes.badRequest,
      'Payment proof must be an image file before approval',
      errorCodes.bad_request
    )
  }
  const remarkInput = statusRemark
  const mergedRemark =
    remarkInput != null && String(remarkInput).length
      ? String(remarkInput).trim()
      : String(existing.statusRemark || '').trim()

  const approverSnapshot = await buildEmployeeSnapshot(approverId)
  const poProductId = toOid(existing.poProductId)
  const doc = await PurchaseBillingRequestModel.findByIdAndUpdate(
    id,
    {
      $set: {
        status: PURCHASE_BILLING_REQUEST_STATUS.APPROVED,
        approvedBy: approverId,
        approvedAt: new Date(),
        approvedBySnapshot: approverSnapshot,
        statusRemark: mergedRemark,
      },
    },
    { new: true }
  )
    .populate('purchaseOrderId', 'poCode companyInfo')
    .populate('createdBy', 'name email')
    .populate('approvedBy', 'name email')
    .populate('billDocumentId', 'path originalName')
    .lean()

  if (poProductId) {
    const lineUpdate = await PoProductModel.updateOne(
      { _id: poProductId, isDeleted: false },
      {
        $set: {
          status: 'finance_approved',
          procurementStatus: PO_PRODUCT_PROCUREMENT_STATUS.FINANCE_APPROVED,
        },
      }
    )
    if (lineUpdate.matchedCount === 0) {
      await PurchaseBillingRequestModel.findByIdAndUpdate(id, {
        $set: {
          status: PURCHASE_BILLING_REQUEST_STATUS.PENDING,
          approvedBy: null,
          approvedAt: null,
          approvedBySnapshot: null,
          statusRemark: existing.statusRemark,
        },
      })
      throw new CustomError(
        statusCodes.notFound,
        'Linked PO product line not found; approval was reverted',
        errorCodes.not_found
      )
    }
  }

  let url = null
  if (doc.billDocumentId && doc.billDocumentId.path) {
    url = await toDisplayPath(doc.billDocumentId.path)
  }
  return shapeRow(doc, url)
}
