import mongoose from 'mongoose'
import PoProductModel from '../../models/poProduct.model.js'
import EmployeeModel from '../../models/employee.model.js'
import PurchaseOrderModel from '../../models/purchaseOrder.model.js'
import ProductModel from '../../models/product.model.js'
import QueryProductModel from '../../models/queryProduct.model.js'
import DocumentModel from '../../models/document.model.js'
import GroupModel from '../../models/group.model.js'
import PurchaseBillingRequestModel, {
  PURCHASE_BILLING_REQUEST_STATUS,
} from '../../models/purchaseBillingRequest.model.js'
import CustomError from '../../utils/exception.js'
import { FULL_ACCESS_ROLES, statusCodes, errorCodes } from '../../core/common/constant.js'
import { PO_PRODUCT_PROCUREMENT_STATUS } from '../../models/poProduct.model.js'
import {
  transformPathsToSignedUrls,
} from '../document/document.service.js'

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/

const toOid = (v) => {
  if (v == null || v === '') return null
  if (!OBJECT_ID_REGEX.test(String(v))) return null
  return new mongoose.Types.ObjectId(String(v))
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Canonical `status` for API/UI (single key). Payment-raised is reflected here when
 * either `status` or `procurementStatus` indicates it.
 */
export const resolvePoLineStatusKey = (doc) => {
  if (!doc || typeof doc !== 'object') return 'pending'
  const st = String(doc.status || '').trim()
  const pr = String(doc.procurementStatus || '').trim()
  if (st === 'purchased') return 'purchased'
  if (st === 'inventory_received' || st === 'ready_for_dispatchment' || st === 'delivered')
    return st
  if (st === 'finance_approved' || pr === 'finance_approved') {
    return 'finance_approved'
  }
  if (st === 'payment_request_raised' || pr === 'payment_request_raised') {
    return 'payment_request_raised'
  }
  if (st) return st
  return 'pending'
}

const buildEmployeeSnapshot = async (employeeId) => {
  const id = toOid(employeeId)
  if (!id) return null
  const e = await EmployeeModel.findById(id).select('-password').lean()
  return e || null
}

const buildPoLineProductSnapshot = (poLine) => {
  if (!poLine) return null
  return {
    productName: poLine.productName,
    rawProductCode: poLine.rawProductCode,
    lineIndex: poLine.lineIndex,
    poCode: poLine.poCode,
    purchaseOrderId: poLine.purchaseOrderId,
    queryId: poLine.queryId,
    quantity: poLine.quantity,
    unit: poLine.unit,
    hsnNumber: poLine.hsnNumber,
    modelNumber: poLine.modelNumber,
    companyInfo: poLine.companyInfo || {},
    product_id: poLine.product_id,
  }
}

const isFullAccessRole = (role) => {
  if (!role) return false
  return FULL_ACCESS_ROLES.map(String).includes(String(role))
}

const normalizeBillDocumentId = async (attachmentDocumentId) => {
  const id = attachmentDocumentId && String(attachmentDocumentId).trim()
  if (!id) {
    throw new CustomError(
      statusCodes.badRequest,
      'Bill document is required',
      errorCodes.bad_request
    )
  }
  const doc = await DocumentModel.findById(id).lean()
  if (!doc) {
    throw new CustomError(
      statusCodes.badRequest,
      'Attachment document not found',
      errorCodes.bad_request
    )
  }
  return id
}

export async function resolveEffectiveGroupIdForPoProduct(doc) {
  if (!doc) return null
  const pid =
    doc.product_id &&
    typeof doc.product_id === 'object' &&
    doc.product_id._id != null
      ? doc.product_id._id
      : doc.product_id
  if (pid && mongoose.Types.ObjectId.isValid(String(pid))) {
    const p = await ProductModel.findById(pid).select('group').lean()
    if (p?.group) return p.group
  }
  const qid = doc.queryId
  const code = String(doc.rawProductCode || '').trim()
  if (qid && code) {
    const qp = await QueryProductModel.findOne({
      queryId: qid,
      rawProductCode: code,
      isDeleted: false,
    })
      .select('groupId')
      .sort({ lineIndex: 1 })
      .lean()
    if (qp?.groupId) return qp.groupId
  }
  return null
}

async function loadPoProductForAccess(id) {
  const oid = toOid(id)
  if (!oid) return null
  return PoProductModel.findOne({ _id: oid, isDeleted: false }).lean()
}

export async function assertEmployeeCanAccessPoProduct(id, user) {
  const doc = await loadPoProductForAccess(id)
  if (!doc) return null

  const employee = await EmployeeModel.findById(user?.id)
    .select('assigned_groups role branchId')
    .lean()
  if (!employee) return null

  const po = await PurchaseOrderModel.findOne({
    _id: doc.purchaseOrderId,
    isDeleted: false,
  })
    .select('_id')
    .lean()
  if (!po) return null

  const fullAccess = isFullAccessRole(employee.role)
  if (fullAccess) return doc

  if (user?.branchId && doc.branchId && String(doc.branchId) !== String(user.branchId)) {
    return null
  }

  const gids = (employee.assigned_groups || []).map((g) => String(g))
  if (!gids.length) return null

  const eg = await resolveEffectiveGroupIdForPoProduct(doc)
  if (!eg || !gids.includes(String(eg))) return null

  return doc
}

export const buildBaseStages = ({ assignedGroupIds, fullAccess, branchId }) => {
  const stages = []
  stages.push({ $match: { isDeleted: false } })
  stages.push({
    $addFields: {
      procurementStatus: { $ifNull: ['$procurementStatus', 'open'] },
    },
  })
  stages.push({
    $addFields: {
      isPaymentRequestRaised: {
        $or: [
          { $eq: ['$status', 'payment_request_raised'] },
          { $eq: ['$procurementStatus', 'payment_request_raised'] },
        ],
      },
      isFinanceApproved: {
        $or: [
          { $eq: ['$status', 'finance_approved'] },
          { $eq: ['$procurementStatus', 'finance_approved'] },
        ],
      },
    },
  })
  stages.push({
    $lookup: {
      from: 'purchaseorders',
      localField: 'purchaseOrderId',
      foreignField: '_id',
      as: 'poArr',
    },
  })
  stages.push({ $unwind: { path: '$poArr' } })
  stages.push({ $match: { 'poArr.isDeleted': false } })
  stages.push({
    $lookup: {
      from: 'products',
      localField: 'product_id',
      foreignField: '_id',
      as: 'prodArr',
    },
  })
  stages.push({
    $lookup: {
      from: 'query_products',
      let: {
        qid: '$queryId',
        code: '$rawProductCode',
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ['$queryId', '$$qid'] },
                { $eq: ['$rawProductCode', '$$code'] },
                { $eq: ['$isDeleted', false] },
              ],
            },
          },
        },
        { $sort: { lineIndex: 1 } },
        { $limit: 1 },
        { $project: { groupId: 1 } },
      ],
      as: 'qpRows',
    },
  })
  stages.push({
    $addFields: {
      effectiveGroupId: {
        $ifNull: [
          { $arrayElemAt: ['$prodArr.group', 0] },
          { $arrayElemAt: ['$qpRows.groupId', 0] },
        ],
      },
    },
  })

  if (!fullAccess) {
    const bid = toOid(branchId)
    if (bid) {
      stages.push({ $match: { branchId: bid } })
    }
    if (!assignedGroupIds?.length) {
      return null
    }
    stages.push({ $match: { effectiveGroupId: { $in: assignedGroupIds } } })
  }

  return stages
}

export const listPurchaseBucketPoProducts = async (q, user) => {
  const employee = await EmployeeModel.findById(user?.id)
    .select('assigned_groups role branchId')
    .lean()
  if (!employee) {
    return { data: [], total: 0, pendingCount: 0, page: 1, pageSize: 20 }
  }

  const fullAccess = isFullAccessRole(employee.role)
  const page = Math.max(1, parseInt(String(q.page || q.pageNumber || 1), 10) || 1)
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(String(q.pageSize || q.limit || 20), 10) || 20)
  )
  const { search, from, to, status } = q
  const branchId = user?.branchId

  const assignedGroupIds = (employee.assigned_groups || [])
    .map((g) => toOid(g))
    .filter((id) => id != null)

  const base = buildBaseStages({
    assignedGroupIds,
    fullAccess,
    branchId,
  })
  if (!base) {
    return { data: [], total: 0, pendingCount: 0, page, pageSize }
  }

  const stages = [...base]

  if (from || to) {
    const dr = {}
    if (from) {
      const d = new Date(from)
      d.setHours(0, 0, 0, 0)
      dr.$gte = d
    }
    if (to) {
      const d = new Date(to)
      d.setHours(23, 59, 59, 999)
      dr.$lte = d
    }
    stages.push({ $match: { createdAt: dr } })
  }

  if (status && String(status).trim()) {
    const s = String(status).trim()
    if (s === PO_PRODUCT_PROCUREMENT_STATUS.OPEN) {
      stages.push({
        $match: {
          isPaymentRequestRaised: false,
          isFinanceApproved: false,
          isPurchased: false,
        },
      })
    } else if (s === PO_PRODUCT_PROCUREMENT_STATUS.PAYMENT_REQUEST_RAISED) {
      stages.push({
        $match: {
          isPaymentRequestRaised: true,
          isFinanceApproved: false,
          isPurchased: false,
        },
      })
    } else if (s === PO_PRODUCT_PROCUREMENT_STATUS.FINANCE_APPROVED) {
      stages.push({ $match: { isFinanceApproved: true, isPurchased: false } })
    } else if (s === 'purchased') {
      stages.push({ $match: { isPurchased: true } })
    }
  }

  if (search && String(search).trim()) {
    const rx = new RegExp(escapeRegex(String(search).trim()), 'i')
    stages.push({
      $match: {
        $or: [{ productName: rx }, { poCode: rx }, { 'poArr.poCode': rx }],
      },
    })
  }

  const pendingPipeline = [
    ...stages,
    {
      $match: { isPaymentRequestRaised: false, isFinanceApproved: false },
    },
    { $count: 'c' },
  ]
  const pendingRes = await PoProductModel.aggregate(pendingPipeline)
  const pendingCount = pendingRes[0]?.c || 0

  const countPipeline = [...stages, { $count: 'c' }]
  const countRes = await PoProductModel.aggregate(countPipeline)
  const total = countRes[0]?.c || 0

  const listPipeline = [
    ...stages,
    { $sort: { dispatchmentDate: 1, createdAt: -1 } },
    { $skip: (page - 1) * pageSize },
    { $limit: pageSize },
    {
      $addFields: {
        status: {
          $cond: {
            if: '$isPurchased',
            then: 'purchased',
            else: {
              $cond: {
                if: '$isFinanceApproved',
                then: 'finance_approved',
                else: {
                  $cond: {
                    if: '$isPaymentRequestRaised',
                    then: 'payment_request_raised',
                    else: { $ifNull: ['$status', 'pending'] },
                  },
                },
              },
            },
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        productName: 1,
        poCode: 1,
        dispatchmentDate: 1,
        status: 1,
        purchaseOrderId: 1,
        lineIndex: 1,
        quantity: 1,
        unit: 1,
        companyInfo: 1,
        effectiveGroupId: 1,
        createdAt: 1,
      },
    },
  ]
  const data = await PoProductModel.aggregate(listPipeline)

  return { data, total, pendingCount, page, pageSize }
}

/**
 * Rates from `query_products`: match `rawProductCode` (required).
 * If the PO line has a `queryId`, scope to that query first; else any row with that code.
 */
const sanitizeSupplierSnapshot = (sup) => {
  if (!sup || typeof sup !== 'object') return null
  const o = { ...sup }
  delete o.password
  return o
}

const getQueryProductLineRates = async (doc) => {
  const code = String(doc?.rawProductCode || '').trim()
  if (!code) {
    return { queryProductMatch: null, queryLineRates: [], matchNote: 'missing_rawProductCode' }
  }

  const qid = doc?.queryId?._id != null ? doc.queryId._id : doc?.queryId
  const queryOid = qid ? toOid(String(qid)) : null
  const lineNum = doc?.lineIndex
  const lineOk =
    lineNum != null && Number.isFinite(Number(lineNum)) && Number(lineNum) >= 0

  let qp = null
  const baseByCode = { rawProductCode: code, isDeleted: false }

  if (queryOid) {
    const scoped = { ...baseByCode, queryId: queryOid }
    if (lineOk) {
      qp = await QueryProductModel.findOne({
        ...scoped,
        lineIndex: Number(lineNum),
      })
        .populate({ path: 'rates.submittedBy', select: 'name email' })
        .lean()
    }
    if (!qp) {
      qp = await QueryProductModel.findOne(scoped)
        .sort({ lineIndex: 1 })
        .populate({ path: 'rates.submittedBy', select: 'name email' })
        .lean()
    }
  }

  if (!qp) {
    qp = await QueryProductModel.findOne(baseByCode)
      .sort({ updatedAt: -1, lineIndex: 1 })
      .populate({ path: 'rates.submittedBy', select: 'name email' })
      .lean()
  }

  if (!qp) {
    return { queryProductMatch: null, queryLineRates: [], matchNote: 'no_query_product' }
  }

  const rates = Array.isArray(qp.rates) ? qp.rates : []
  const queryLineRates = rates.map((r) => {
    const sup = sanitizeSupplierSnapshot(r?.supplier)
    return {
      _id: r._id,
      rate: typeof r?.rate === 'number' && !Number.isNaN(r.rate) ? r.rate : null,
      unit: (r?.unit && String(r.unit)) || '',
      remark: (r?.remark && String(r.remark)) || '',
      submittedAt: r?.submittedAt || null,
      submittedBy: r.submittedBy
        ? {
            _id: r.submittedBy._id,
            name: r.submittedBy.name || '',
            email: r.submittedBy.email || '',
          }
        : null,
      supplier: sup,
    }
  })

  return {
    queryProductMatch: {
      _id: qp._id,
      queryId: qp.queryId,
      queryCode: qp.queryCode || '',
      lineIndex: qp.lineIndex,
      productName: qp.productName,
      rawProductCode: qp.rawProductCode,
      proBucketStatus: qp.status,
    },
    queryLineRates,
    matchNote: 'ok',
  }
}

const withPoProductPopulates = (q) =>
  q
    .populate('purchaseOrderId', 'poCode status companyInfo')
    .populate('quotationId', 'quotationCode')
    .populate('queryId', 'queryCode')
    .populate('industry_id', 'name')
    .populate('branchId', 'name')
    .populate({
      path: 'product_id',
      select: 'name group sku',
      populate: { path: 'group', select: 'name' },
    })
    .populate('attachmentDocumentId', 'path mimeType originalName')
    .populate('paymentRequestBillDocumentId', 'path mimeType originalName')
    .populate('paymentRequestRaisedBy', 'name email')
    .populate({
      path: 'purchaseBillingRequestId',
      select:
        'uniqueId amount status billDocumentId createdBy createdBySnapshot productSnapshot approvedBy approvedBySnapshot approvedAt statusRemark createdAt updatedAt',
      populate: [
        { path: 'billDocumentId', select: 'path originalName mimeType' },
        { path: 'createdBy', select: 'name email phone role designation' },
        { path: 'approvedBy', select: 'name email phone role designation' },
      ],
    })
    .lean()

export const getPurchaseBucketPoProductById = async (id, user) => {
  const allowed = await assertEmployeeCanAccessPoProduct(id, user)
  if (!allowed) return null

  const doc = await withPoProductPopulates(PoProductModel.findById(allowed._id))
  if (!doc) return null

  const effectiveGroupId = await resolveEffectiveGroupIdForPoProduct(doc)
  let groupName = ''
  if (effectiveGroupId) {
    const g = await GroupModel.findById(effectiveGroupId).select('name').lean()
    groupName = g?.name || ''
  }

  if (doc.attachmentDocumentId && typeof doc.attachmentDocumentId === 'object') {
    const [signed] = await transformPathsToSignedUrls([doc.attachmentDocumentId])
    doc.attachmentDocumentId = signed || doc.attachmentDocumentId
  }
  if (
    doc.paymentRequestBillDocumentId &&
    typeof doc.paymentRequestBillDocumentId === 'object'
  ) {
    const [signed] = await transformPathsToSignedUrls([
      doc.paymentRequestBillDocumentId,
    ])
    doc.paymentRequestBillDocumentId = signed || doc.paymentRequestBillDocumentId
  }

  if (
    doc.purchaseBillingRequestId &&
    typeof doc.purchaseBillingRequestId === 'object' &&
    doc.purchaseBillingRequestId.billDocumentId &&
    typeof doc.purchaseBillingRequestId.billDocumentId === 'object'
  ) {
    const [signed] = await transformPathsToSignedUrls([
      doc.purchaseBillingRequestId.billDocumentId,
    ])
    if (signed) {
      doc.purchaseBillingRequestId = {
        ...doc.purchaseBillingRequestId,
        billDocumentId: signed,
      }
    }
  }

  const { queryProductMatch, queryLineRates, matchNote } =
    await getQueryProductLineRates(doc)

  return {
    ...doc,
    status: resolvePoLineStatusKey(doc),
    effectiveGroupId,
    effectiveGroupName: groupName,
    queryProductMatch,
    queryLineRates,
    queryRatesMatchNote: matchNote,
  }
}

export const raisePurchaseBucketPaymentRequest = async ({
  id,
  amount,
  attachmentDocumentId,
  user,
}) => {
  const allowed = await assertEmployeeCanAccessPoProduct(id, user)
  if (!allowed) {
    throw new CustomError(
      statusCodes.notFound,
      'PO line not found or not allowed',
      errorCodes.not_found
    )
  }
  const currentProcurement =
    allowed.procurementStatus || PO_PRODUCT_PROCUREMENT_STATUS.OPEN
  const lineStatus = String(allowed.status || 'pending')
  if (lineStatus === 'purchased' || resolvePoLineStatusKey(allowed) === 'purchased') {
    throw new CustomError(
      statusCodes.badRequest,
      'This line is already marked as purchased',
      errorCodes.bad_request
    )
  }
  if (
    currentProcurement === PO_PRODUCT_PROCUREMENT_STATUS.FINANCE_APPROVED ||
    lineStatus === 'finance_approved'
  ) {
    throw new CustomError(
      statusCodes.badRequest,
      'This line is already approved by finance',
      errorCodes.bad_request
    )
  }
  if (
    currentProcurement === PO_PRODUCT_PROCUREMENT_STATUS.PAYMENT_REQUEST_RAISED ||
    lineStatus === 'payment_request_raised'
  ) {
    throw new CustomError(
      statusCodes.badRequest,
      'Payment request already raised for this line',
      errorCodes.bad_request
    )
  }

  const amt = Number(amount)
  if (Number.isNaN(amt) || amt <= 0) {
    throw new CustomError(
      statusCodes.badRequest,
      'amount must be a positive number',
      errorCodes.validation_error
    )
  }

  const billId = await normalizeBillDocumentId(attachmentDocumentId)
  const oid = toOid(id)
  const creatorId = toOid(user?.id)
  if (!creatorId) {
    throw new CustomError(
      statusCodes.unauthorized,
      'Invalid user',
      errorCodes.unauthorized
    )
  }

  const employeeSnapshot = await buildEmployeeSnapshot(creatorId)
  if (!employeeSnapshot) {
    throw new CustomError(
      statusCodes.badRequest,
      'Could not load employee profile',
      errorCodes.bad_request
    )
  }

  const productSnapshot = buildPoLineProductSnapshot(allowed)
  const billingRequest = await PurchaseBillingRequestModel.create({
    poProductId: oid,
    purchaseOrderId: allowed.purchaseOrderId || null,
    amount: amt,
    billDocumentId: billId,
    status: PURCHASE_BILLING_REQUEST_STATUS.PENDING,
    createdBy: creatorId,
    createdBySnapshot: employeeSnapshot,
    productSnapshot,
    branchId: allowed.branchId || null,
  })

  try {
    await PoProductModel.findByIdAndUpdate(oid, {
      $set: {
        procurementStatus: PO_PRODUCT_PROCUREMENT_STATUS.PAYMENT_REQUEST_RAISED,
        status: 'payment_request_raised',
        paymentRequestAmount: amt,
        paymentRequestBillDocumentId: billId,
        paymentRequestRaisedAt: new Date(),
        paymentRequestRaisedBy: creatorId,
        purchaseBillingRequestId: billingRequest._id,
      },
    })
  } catch (e) {
    await PurchaseBillingRequestModel.findByIdAndDelete(billingRequest._id)
    throw e
  }

  return getPurchaseBucketPoProductById(String(oid), user)
}

/**
 * Set line `status` to `purchased` when the line is finance-approved (canonical status key).
 */
export const markPurchaseBucketLinePurchased = async ({ id, user }) => {
  const allowed = await assertEmployeeCanAccessPoProduct(id, user)
  if (!allowed) {
    throw new CustomError(
      statusCodes.notFound,
      'PO line not found or not allowed',
      errorCodes.not_found
    )
  }
  if (String(allowed.status || '').trim() === 'purchased') {
    throw new CustomError(
      statusCodes.badRequest,
      'This line is already marked as purchased',
      errorCodes.bad_request
    )
  }
  const key = resolvePoLineStatusKey(allowed)
  if (key !== 'finance_approved') {
    throw new CustomError(
      statusCodes.badRequest,
      'Line must be finance approved before it can be marked as purchased',
      errorCodes.bad_request
    )
  }
  const oid = toOid(id)
  if (!oid) {
    throw new CustomError(
      statusCodes.badRequest,
      'Invalid line id',
      errorCodes.validation_error
    )
  }
  const updated = await PoProductModel.findOneAndUpdate(
    { _id: oid, isDeleted: false },
    { $set: { status: 'purchased' } },
    { new: true }
  )
  if (!updated) {
    throw new CustomError(
      statusCodes.notFound,
      'PO line not found',
      errorCodes.not_found
    )
  }
  return getPurchaseBucketPoProductById(String(oid), user)
}
