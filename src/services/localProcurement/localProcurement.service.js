import mongoose from 'mongoose'
import LocalProcurementModel, {
  LOCAL_PROCUREMENT_STATUS,
} from '../../models/localProcurement.model.js'
import QueryProductModel from '../../models/queryProduct.model.js'
import EmployeeModel from '../../models/employee.model.js'
import DocumentModel from '../../models/document.model.js'
import { transformPathsToSignedUrls } from '../document/document.service.js'

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/
const LOCAL_PROCUREMENT_ROLE = 'localprocurement'

const toOid = (v) => {
  if (v == null || v === '') return null
  if (!OBJECT_ID_REGEX.test(String(v))) return null
  return new mongoose.Types.ObjectId(String(v))
}

const createdAtRangeFilter = (from, to) => {
  const range = {}
  if (from != null && String(from).trim() !== '') {
    const d = new Date(from)
    if (!Number.isNaN(d.getTime())) {
      d.setHours(0, 0, 0, 0)
      range.$gte = d
    }
  }
  if (to != null && String(to).trim() !== '') {
    const d = new Date(to)
    if (!Number.isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999)
      range.$lte = d
    }
  }
  return Object.keys(range).length ? { createdAt: range } : {}
}

const buildProductSnapshot = (doc, images = []) => ({
  productName: doc?.productName || '',
  quantity: doc?.quantity ?? null,
  unit: doc?.unit || '',
  hsnNumber: doc?.hsnNumber || '',
  modelNumber: doc?.modelNumber || '',
  gstPercentage: doc?.gstPercentage ?? null,
  remark: doc?.remark || '',
  description: doc?.description || '',
  rawProductCode: doc?.rawProductCode || '',
  queryCode: doc?.queryCode || '',
  lineIndex: doc?.lineIndex ?? null,
  groupName:
    doc?.groupId && typeof doc.groupId === 'object'
      ? doc.groupId.name || ''
      : '',
  categoryName:
    doc?.categoryId && typeof doc.categoryId === 'object'
      ? doc.categoryId.name || ''
      : '',
  variants: Array.isArray(doc?.variants) ? doc.variants : [],
  images: Array.isArray(images) ? images : [],
})

const signImageObjects = async (images) => {
  if (!Array.isArray(images) || !images.length) return images
  const paths = images.map((img) =>
    typeof img === 'object' && img?.path ? img : { path: img }
  )
  const signed = await transformPathsToSignedUrls(paths)
  return images.map((img, i) => ({
    ...(typeof img === 'object' ? img : {}),
    path: signed[i]?.path || signed[i] || img?.path || img,
  }))
}

const withSignedImages = async (row) => {
  if (!row) return row
  let next = { ...row }
  if (row.productSnapshot?.images?.length) {
    const images = await signImageObjects(row.productSnapshot.images)
    next = {
      ...next,
      productSnapshot: { ...row.productSnapshot, images },
    }
  }
  if (row.images?.length) {
    next.images = await signImageObjects(row.images)
  }
  return next
}

export const listLocalProcurementEmployees = async () => {
  const rows = await EmployeeModel.find({
    isDeleted: false,
    role: new RegExp(`^${LOCAL_PROCUREMENT_ROLE}$`, 'i'),
  })
    .select('name email companyEmail phone role designation branchId')
    .sort({ name: 1 })
    .lean()

  return rows.map((row) => ({
    ...row,
    employeeId: row._id,
  }))
}

export const assignLocalProcurement = async ({
  queryProductId,
  employeeId,
  remark = '',
  assignedBy,
  branchIdFromUser = null,
}) => {
  const qpOid = toOid(queryProductId)
  const employeeOid = toOid(employeeId)
  if (!qpOid) throw new Error('Invalid query product id')
  if (!employeeOid) throw new Error('Invalid employee id')

  const employee = await EmployeeModel.findOne({
    _id: employeeOid,
    isDeleted: false,
  }).lean()
  if (!employee) throw new Error('Employee not found')
  if (String(employee.role || '').toLowerCase() !== LOCAL_PROCUREMENT_ROLE) {
    throw new Error('Selected employee must have the local procurement role')
  }

  const queryProduct = await QueryProductModel.findOne({
    _id: qpOid,
    isDeleted: false,
  })
    .populate('groupId', 'name')
    .populate('categoryId', 'name')
    .populate('images', 'name path mimetype _id')
    .lean()

  if (!queryProduct) return null

  let images = Array.isArray(queryProduct.images) ? queryProduct.images : []
  if (images.length) {
    images = await transformPathsToSignedUrls(images)
  }

  const branchId =
    employee.branchId || branchIdFromUser || queryProduct.branchId || null

  const doc = await LocalProcurementModel.create({
    queryProductId: qpOid,
    queryCode: queryProduct.queryCode || '',
    productSnapshot: buildProductSnapshot(queryProduct, images),
    employeeId: employeeOid,
    assignedBy: toOid(assignedBy),
    assignmentRemark: String(remark || '').trim(),
    status: LOCAL_PROCUREMENT_STATUS.PENDING,
    branchId,
  })

  const populated = await LocalProcurementModel.findById(doc._id)
    .populate('employeeId', 'name email phone role designation')
    .populate('assignedBy', 'name email phone role designation')
    .lean()

  return withSignedImages(populated)
}

export const listLocalProcurements = async (q = {}, user = null) => {
  const page = Math.max(
    1,
    parseInt(String(q.page || q.pageNumber || 1), 10) || 1
  )
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(String(q.pageSize || q.limit || 20), 10) || 20)
  )

  const statusRaw =
    q.status != null && q.status !== '' ? String(q.status).trim() : ''
  const filter = {
    isDeleted: false,
    ...(statusRaw &&
    Object.values(LOCAL_PROCUREMENT_STATUS).includes(statusRaw)
      ? { status: statusRaw }
      : {}),
    ...createdAtRangeFilter(q.from, q.to),
  }

  const userRole = String(user?.role || '').toLowerCase()
  if (userRole === LOCAL_PROCUREMENT_ROLE) {
    const uid = toOid(user?.id || user?._id)
    if (uid) filter.employeeId = uid
  } else {
    const employeeFilter = toOid(q.employeeId || q.assignedTo)
    if (employeeFilter) filter.employeeId = employeeFilter
  }

  const [total, rawRows] = await Promise.all([
    LocalProcurementModel.countDocuments(filter),
    LocalProcurementModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate('employeeId', 'name email phone role designation')
      .populate('assignedBy', 'name email phone role designation')
      .lean(),
  ])

  const data = await Promise.all(rawRows.map(withSignedImages))

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize) || 1),
  }
}

export const submitLocalProcurement = async (id, payload, user = null) => {
  const oid = toOid(id)
  if (!oid) throw new Error('Invalid id')

  const existing = await LocalProcurementModel.findOne({
    _id: oid,
    isDeleted: false,
  }).lean()
  if (!existing) return null

  const userRole = String(user?.role || '').toLowerCase()
  const uid = toOid(user?.id || user?._id)
  if (userRole === LOCAL_PROCUREMENT_ROLE) {
    if (!uid || String(existing.employeeId) !== String(uid)) {
      throw new Error('You can only submit your own assignments')
    }
  }

  if (existing.status === LOCAL_PROCUREMENT_STATUS.SUBMITTED) {
    throw new Error('This assignment has already been submitted')
  }

  const rate = Number(payload.rate)
  if (!Number.isFinite(rate) || rate < 0) {
    throw new Error('Rate must be a valid number ≥ 0')
  }

  const priceRaw = payload.price
  const price =
    priceRaw != null && priceRaw !== '' && Number.isFinite(Number(priceRaw))
      ? Number(priceRaw)
      : rate

  const supplier = String(payload.supplier || '').trim()
  if (!supplier) {
    throw new Error('Supplier is required')
  }

  const unit = String(payload.unit || '').trim()
  const remark = String(payload.remark || '').trim()
  const submittedAt = new Date()

  const imageInputs = Array.isArray(payload.images) ? payload.images : []
  const documentIds = [
    ...new Set(
      imageInputs
        .map((item) => toOid(item?.documentId))
        .filter(Boolean)
        .map(String)
    ),
  ].map((id) => new mongoose.Types.ObjectId(id))

  const docs =
    documentIds.length > 0
      ? await DocumentModel.find({ _id: { $in: documentIds } }).lean()
      : []
  const docById = new Map(docs.map((d) => [String(d._id), d]))

  const imageEntries = documentIds.map((docOid) => {
    const found = docById.get(String(docOid))
    return {
      documentId: docOid,
      path: found?.path || '',
      name: found?.originalName || '',
      mimeType: found?.mimeType || '',
      uploadedAt: submittedAt,
      uploadedBy: uid,
    }
  })

  const rateEntry = {
    supplier,
    price,
    rate,
    unit,
    remark,
    submittedAt,
    submittedBy: uid,
  }

  const update = {
    $set: {
      supplier,
      rate,
      unit,
      remark,
      status: LOCAL_PROCUREMENT_STATUS.SUBMITTED,
    },
    $push: { rates: rateEntry },
  }
  if (imageEntries.length) {
    update.$push.images = { $each: imageEntries }
  }

  const doc = await LocalProcurementModel.findOneAndUpdate(
    { _id: oid, isDeleted: false },
    update,
    { new: true }
  )
    .populate('employeeId', 'name email phone role designation')
    .populate('assignedBy', 'name email phone role designation')
    .lean()

  return withSignedImages(doc)
}
