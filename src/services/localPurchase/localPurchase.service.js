import mongoose from 'mongoose'
import LocalPurchaseModel, {
  LOCAL_PURCHASE_STATUS,
} from '../../models/localPurchase.model.js'
import QueryProductModel from '../../models/queryProduct.model.js'
import DocumentModel from '../../models/document.model.js'
import EmployeeModel from '../../models/employee.model.js'
import { loadPoProductForAccess } from '../purchaseBucket/purchaseBucket.service.js'
import { transformPathsToSignedUrls } from '../document/document.service.js'

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/
const LOCAL_PURCHASE_ROLE = 'localpurchase'

const toOid = (v) => {
  if (v == null || v === '') return null
  if (!OBJECT_ID_REGEX.test(String(v))) return null
  return new mongoose.Types.ObjectId(String(v))
}

const buildPoProductSnapshot = (poLine) => {
  if (!poLine || typeof poLine !== 'object') return {}
  const queryId =
    poLine.queryId && typeof poLine.queryId === 'object'
      ? poLine.queryId._id || poLine.queryId
      : poLine.queryId
  const queryCode =
    poLine.queryCode ||
    (poLine.queryId && typeof poLine.queryId === 'object'
      ? poLine.queryId.queryCode || ''
      : '')
  const purchaseOrderId =
    poLine.purchaseOrderId && typeof poLine.purchaseOrderId === 'object'
      ? poLine.purchaseOrderId._id || poLine.purchaseOrderId
      : poLine.purchaseOrderId
  const productId =
    poLine.product_id && typeof poLine.product_id === 'object'
      ? poLine.product_id._id || poLine.product_id
      : poLine.product_id

  return {
    productName: poLine.productName || '',
    rawProductCode: poLine.rawProductCode || '',
    lineIndex: poLine.lineIndex ?? null,
    poCode: poLine.poCode || '',
    purchaseOrderId,
    queryId,
    queryCode: queryCode || '',
    quantity: poLine.quantity ?? null,
    unit: poLine.unit || '',
    hsnNumber: poLine.hsnNumber || '',
    modelNumber: poLine.modelNumber || '',
    gstPercentage: poLine.gstPercentage ?? null,
    description: poLine.description || '',
    remark: poLine.remark || '',
    priority: poLine.priority || '',
    targetRate: poLine.targetRate ?? null,
    dispatchmentDate: poLine.dispatchmentDate || null,
    companyInfo: poLine.companyInfo || {},
    product_id: productId,
    status: poLine.status || '',
    procurementStatus: poLine.procurementStatus || '',
    paymentRequestAmount: poLine.paymentRequestAmount ?? null,
  }
}

const fetchImagesForPoLine = async (poLine) => {
  if (!poLine || typeof poLine !== 'object') return []

  const code = String(poLine.rawProductCode || '').trim()
  let images = []

  if (code) {
    const qid =
      poLine.queryId && typeof poLine.queryId === 'object'
        ? poLine.queryId._id || poLine.queryId
        : poLine.queryId
    const queryOid = toOid(qid)
    const lineNum = poLine.lineIndex
    const lineOk =
      lineNum != null &&
      Number.isFinite(Number(lineNum)) &&
      Number(lineNum) >= 0

    let qp = null
    const baseByCode = { rawProductCode: code, isDeleted: false }

    if (queryOid) {
      const scoped = { ...baseByCode, queryId: queryOid }
      if (lineOk) {
        qp = await QueryProductModel.findOne({
          ...scoped,
          lineIndex: Number(lineNum),
        })
          .populate('images', 'path mimeType originalName name')
          .lean()
      }
      if (!qp) {
        qp = await QueryProductModel.findOne(scoped)
          .sort({ lineIndex: 1 })
          .populate('images', 'path mimeType originalName name')
          .lean()
      }
    }

    if (!qp) {
      qp = await QueryProductModel.findOne(baseByCode)
        .sort({ updatedAt: -1, lineIndex: 1 })
        .populate('images', 'path mimeType originalName name')
        .lean()
    }

    if (qp && Array.isArray(qp.images) && qp.images.length) {
      images = await transformPathsToSignedUrls(qp.images)
    }
  }

  const attachmentId =
    poLine.attachmentDocumentId &&
    typeof poLine.attachmentDocumentId === 'object'
      ? poLine.attachmentDocumentId._id || poLine.attachmentDocumentId
      : poLine.attachmentDocumentId
  const attOid = toOid(attachmentId)
  if (attOid) {
    const doc = await DocumentModel.findById(attOid).lean()
    if (doc) {
      const [signed] = await transformPathsToSignedUrls([doc])
      if (signed) images.push(signed)
    }
  }

  return images
}

const signDocumentEntry = async (entry) => {
  if (!entry || typeof entry !== 'object') return entry
  if (!entry.path) return entry
  const [signed] = await transformPathsToSignedUrls([entry])
  return {
    ...entry,
    path: signed?.path || entry.path,
  }
}

const withSignedSubmissionDocs = async (row) => {
  if (!row) return row
  const next = { ...row }
  if (next.bill) {
    next.bill = await signDocumentEntry(next.bill)
  }
  if (Array.isArray(next.productImages) && next.productImages.length) {
    next.productImages = await Promise.all(
      next.productImages.map((item) => signDocumentEntry(item))
    )
  }
  return next
}

export const getLocalPurchaseById = async (id, user = null) => {
  const oid = toOid(id)
  if (!oid) return null

  const filter = { _id: oid, isDeleted: false }
  const userRole = String(user?.role || '').toLowerCase()
  if (userRole === LOCAL_PURCHASE_ROLE) {
    const uid = toOid(user?.id || user?._id)
    if (!uid) return null
    filter.employeeId = uid
  }

  const row = await LocalPurchaseModel.findOne(filter)
    .populate('employeeId', 'name email phone role designation companyEmail')
    .populate('assignedBy', 'name email phone role designation companyEmail')
    .lean()
  if (!row) return null

  const poLine = await loadPoProductForAccess(String(row.poProductId))
  const queryImages = await fetchImagesForPoLine(poLine)

  return withSignedSubmissionDocs({
    ...row,
    productImagesFromQuery: queryImages,
  })
}

export const listLocalPurchaseEmployees = async () => {
  const rows = await EmployeeModel.find({
    isDeleted: false,
    role: new RegExp(`^${LOCAL_PURCHASE_ROLE}$`, 'i'),
  })
    .select('name email companyEmail phone role designation branchId')
    .sort({ name: 1 })
    .lean()

  return rows.map((row) => ({
    ...row,
    employeeId: row._id,
  }))
}

export const assignLocalPurchase = async ({
  poProductId,
  employeeId,
  remark = '',
  supplier = '',
  locationLink = '',
  assignedBy,
  branchIdFromUser = null,
}) => {
  const poOid = toOid(poProductId)
  const employeeOid = toOid(employeeId)
  if (!poOid) throw new Error('Invalid PO product id')
  if (!employeeOid) throw new Error('Invalid employee id')

  const employee = await EmployeeModel.findOne({
    _id: employeeOid,
    isDeleted: false,
  }).lean()
  if (!employee) throw new Error('Employee not found')
  if (String(employee.role || '').toLowerCase() !== LOCAL_PURCHASE_ROLE) {
    throw new Error('Selected employee must have the local purchase role')
  }

  const poLine = await loadPoProductForAccess(String(poOid))
  if (!poLine) return null

  const branchId =
    employee.branchId || branchIdFromUser || poLine.branchId || null

  const doc = await LocalPurchaseModel.create({
    poProductId: poOid,
    poCode: poLine.poCode || '',
    queryCode: poLine.queryCode || '',
    productSnapshot: buildPoProductSnapshot(poLine),
    employeeId: employeeOid,
    assignedBy: toOid(assignedBy),
    assignmentRemark: String(remark || '').trim(),
    supplier: String(supplier || '').trim(),
    remark: String(remark || '').trim(),
    locationLink: String(locationLink || '').trim(),
    status: LOCAL_PURCHASE_STATUS.PENDING,
    branchId,
  })

  const populated = await LocalPurchaseModel.findById(doc._id)
    .populate('employeeId', 'name email phone role designation')
    .populate('assignedBy', 'name email phone role designation')
    .lean()

  return populated
}

export const listLocalPurchases = async (q = {}, user = null) => {
  const page = Math.max(
    1,
    parseInt(String(q.page || q.pageNumber || 1), 10) || 1
  )
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(String(q.pageSize || q.limit || 20), 10) || 20)
  )

  const filter = { isDeleted: false }

  const poProductOid = toOid(q.poProductId)
  if (poProductOid) filter.poProductId = poProductOid

  const statusRaw =
    q.status != null && q.status !== '' ? String(q.status).trim() : ''
  if (statusRaw && Object.values(LOCAL_PURCHASE_STATUS).includes(statusRaw)) {
    filter.status = statusRaw
  }

  const userRole = String(user?.role || '').toLowerCase()
  if (userRole === LOCAL_PURCHASE_ROLE) {
    const uid = toOid(user?.id || user?._id)
    if (!uid) {
      return {
        data: [],
        total: 0,
        page,
        pageSize,
        totalPages: 1,
      }
    }
    filter.employeeId = uid
  } else {
    const employeeFilter = toOid(q.employeeId || q.assignedTo)
    if (employeeFilter) filter.employeeId = employeeFilter
  }

  const [total, data] = await Promise.all([
    LocalPurchaseModel.countDocuments(filter),
    LocalPurchaseModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate('employeeId', 'name email phone role designation companyEmail')
      .populate('assignedBy', 'name email phone role designation companyEmail')
      .populate('submittedBy', 'name email phone role designation companyEmail')
      .lean(),
  ])

  const signedRows = await Promise.all(
    (data || []).map((row) => withSignedSubmissionDocs(row))
  )

  return {
    data: signedRows,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize) || 1),
  }
}

const buildDocumentEntry = (docOid, docRow, uploadedAt, uploadedBy) => ({
  documentId: docOid,
  path: docRow?.path || '',
  name: docRow?.originalName || docRow?.name || '',
  mimeType: docRow?.mimeType || docRow?.mimetype || '',
  uploadedAt,
  uploadedBy,
})

const assertLocalPurchaseEmployeeAccess = (existing, user) => {
  const userRole = String(user?.role || '').toLowerCase()
  const uid = toOid(user?.id || user?._id)
  if (userRole === LOCAL_PURCHASE_ROLE) {
    if (!uid || String(existing.employeeId) !== String(uid)) {
      throw new Error('You can only update your own assignments')
    }
  }
  return uid
}

const resolveBillAndProductImages = async (payload, uid) => {
  const billOid = toOid(payload.billDocumentId)
  const productImageInputs = Array.isArray(payload.productImages)
    ? payload.productImages
    : []
  const productImageOids = [
    ...new Set(
      productImageInputs
        .map((item) => toOid(item?.documentId))
        .filter(Boolean)
        .map(String)
    ),
  ].map((idStr) => new mongoose.Types.ObjectId(idStr))

  const allDocIds = [...(billOid ? [billOid] : []), ...productImageOids]
  const docs =
    allDocIds.length > 0
      ? await DocumentModel.find({ _id: { $in: allDocIds } }).lean()
      : []
  const docById = new Map(docs.map((d) => [String(d._id), d]))

  const uploadedAt = new Date()

  let bill = null
  if (billOid) {
    const billRow = docById.get(String(billOid))
    if (!billRow) throw new Error('Bill document not found')
    bill = buildDocumentEntry(billOid, billRow, uploadedAt, uid)
  }

  const productImages = productImageOids.map((docOid) => {
    const found = docById.get(String(docOid))
    if (!found) throw new Error('One or more product images were not found')
    return buildDocumentEntry(docOid, found, uploadedAt, uid)
  })

  return {
    bill,
    productImages,
    hasBill: !!billOid,
    hasImages: productImageOids.length > 0,
  }
}

export const submitLocalPurchase = async (id, payload, user = null) => {
  const oid = toOid(id)
  if (!oid) throw new Error('Invalid id')

  const existing = await LocalPurchaseModel.findOne({
    _id: oid,
    isDeleted: false,
  }).lean()
  if (!existing) return null

  const uid = assertLocalPurchaseEmployeeAccess(existing, user)

  if (existing.status === LOCAL_PURCHASE_STATUS.SUBMITTED) {
    throw new Error('This assignment has already been submitted')
  }

  const submittedAt = new Date()
  const submissionRemark = String(payload.remark || '').trim()
  const { bill, productImages } = await resolveBillAndProductImages(
    payload,
    uid
  )

  const updateSet = {
    productImages,
    submissionRemark,
    submittedAt,
    submittedBy: uid,
    status: LOCAL_PURCHASE_STATUS.SUBMITTED,
  }
  if (bill) updateSet.bill = bill

  const doc = await LocalPurchaseModel.findOneAndUpdate(
    { _id: oid, isDeleted: false },
    {
      $set: updateSet,
    },
    { new: true }
  )
    .populate('employeeId', 'name email phone role designation companyEmail')
    .populate('assignedBy', 'name email phone role designation companyEmail')
    .populate('submittedBy', 'name email phone role designation companyEmail')
    .lean()

  const poLine = await loadPoProductForAccess(String(doc.poProductId))
  const queryImages = await fetchImagesForPoLine(poLine)

  return withSignedSubmissionDocs({
    ...doc,
    productImagesFromQuery: queryImages,
  })
}

export const updateLocalPurchaseAttachments = async (
  id,
  payload,
  user = null
) => {
  const oid = toOid(id)
  if (!oid) throw new Error('Invalid id')

  const existing = await LocalPurchaseModel.findOne({
    _id: oid,
    isDeleted: false,
  }).lean()
  if (!existing) return null

  const uid = assertLocalPurchaseEmployeeAccess(existing, user)

  if (existing.status !== LOCAL_PURCHASE_STATUS.SUBMITTED) {
    throw new Error('Attachments can only be updated after submission')
  }

  const { bill, productImages, hasBill, hasImages } =
    await resolveBillAndProductImages(payload, uid)

  if (!hasBill && !hasImages) {
    throw new Error('Provide a bill and/or product images to update')
  }

  const updateSet = {}
  if (hasBill) updateSet.bill = bill
  if (hasImages) updateSet.productImages = productImages

  const doc = await LocalPurchaseModel.findOneAndUpdate(
    { _id: oid, isDeleted: false },
    { $set: updateSet },
    { new: true }
  )
    .populate('employeeId', 'name email phone role designation companyEmail')
    .populate('assignedBy', 'name email phone role designation companyEmail')
    .populate('submittedBy', 'name email phone role designation companyEmail')
    .lean()

  const poLine = await loadPoProductForAccess(String(doc.poProductId))
  const queryImages = await fetchImagesForPoLine(poLine)

  return withSignedSubmissionDocs({
    ...doc,
    productImagesFromQuery: queryImages,
  })
}
