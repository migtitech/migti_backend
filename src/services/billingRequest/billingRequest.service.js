import mongoose from 'mongoose'
import BillingRequestModel, {
  BILLING_REQUEST_STATUS,
} from '../../models/billingRequest.model.js'
import PoProductModel from '../../models/poProduct.model.js'
import EmployeeModel from '../../models/employee.model.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'
import {
  upsertRateMasterEntries,
  RATE_MASTER_TYPE,
} from '../rateMaster/rateMaster.service.js'

export const listBillingRequests = async ({
  pageNumber = 1,
  pageSize = 20,
  status,
  poCode,
  dateFrom,
  dateTo,
} = {}) => {
  const page = Math.max(1, parseInt(pageNumber, 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20))
  const skip = (page - 1) * limit

  const filter = {}
  if (status) filter.status = status
  if (poCode) filter.poCode = { $regex: poCode, $options: 'i' }
  if (dateFrom || dateTo) {
    filter.createdAt = {}
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom)
    if (dateTo) {
      const end = new Date(dateTo)
      end.setHours(23, 59, 59, 999)
      filter.createdAt.$lte = end
    }
  }

  const [rows, total] = await Promise.all([
    BillingRequestModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    BillingRequestModel.countDocuments(filter),
  ])

  return {
    rows,
    pagination: {
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      totalItems: total,
      itemsPerPage: limit,
    },
  }
}

export const getBillingRequestById = async (id) => {
  const oid = toOid(id)
  if (!oid) {
    throw new CustomError(statusCodes.badRequest, 'Invalid id', errorCodes.bad_request)
  }
  const doc = await BillingRequestModel.findById(oid).lean()
  if (!doc) {
    throw new CustomError(statusCodes.notFound, 'Billing request not found', errorCodes.not_found)
  }
  return doc
}

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/

const toOid = (v) => {
  if (v == null || v === '') return null
  const s = String(v).trim()
  if (!OBJECT_ID_REGEX.test(s)) return null
  return new mongoose.Types.ObjectId(s)
}

export const hodProductAction = async ({ billingRequestId, productId, action, remark, user }) => {
  const brOid = toOid(billingRequestId)
  const pOid = toOid(productId)
  if (!brOid || !pOid) {
    throw new CustomError(statusCodes.badRequest, 'Invalid id', errorCodes.bad_request)
  }
  if (!['approved', 'rejected'].includes(action)) {
    throw new CustomError(statusCodes.badRequest, 'action must be approved or rejected', errorCodes.bad_request)
  }

  const doc = await BillingRequestModel.findById(brOid)
  if (!doc) {
    throw new CustomError(statusCodes.notFound, 'Billing request not found', errorCodes.not_found)
  }

  const product = doc.products.id(pOid)
  if (!product) {
    throw new CustomError(statusCodes.notFound, 'Product not found', errorCodes.not_found)
  }

  const reviewerId = toOid(user?.id)
  const reviewerSnapshot = reviewerId ? await buildEmployeeSnapshot(reviewerId) : null
  const now = new Date()

  product.hodStatus = action
  product.hodRemark = remark ? String(remark).trim().slice(0, 2000) : ''
  product.hodReviewedBy = reviewerId || null
  product.hodReviewedBySnapshot = reviewerSnapshot
  product.hodReviewedAt = now

  // If all products are approved → set billing request to hod_approved
  // Rejection only affects the product's hodStatus, not the billing request status
  if (action === 'approved') {
    const allApproved = doc.products.every((p) => p.hodStatus === 'approved')
    if (allApproved) {
      doc.status = BILLING_REQUEST_STATUS.HOD_APPROVED
      doc.reviewedBy = reviewerId || null
      doc.reviewedBySnapshot = reviewerSnapshot
      doc.reviewedAt = now
    }
  }

  await doc.save()
  return doc.toObject()
}

export const financeApproveBillingRequest = async ({ id, financeRemark, paidAmount, paymentProofDocId, user }) => {
  const oid = toOid(id)
  if (!oid) {
    throw new CustomError(statusCodes.badRequest, 'Invalid id', errorCodes.bad_request)
  }

  const doc = await BillingRequestModel.findById(oid).lean()
  if (!doc) {
    throw new CustomError(statusCodes.notFound, 'Billing request not found', errorCodes.not_found)
  }

  const approverId = toOid(user?.id)
  const financeApprovedBySnapshot = approverId
    ? await buildEmployeeSnapshot(approverId)
    : null

  const updated = await BillingRequestModel.findByIdAndUpdate(
    oid,
    {
      $set: {
        status: BILLING_REQUEST_STATUS.FINANCE_APPROVED,
        financeRemark: financeRemark ? String(financeRemark).trim().slice(0, 2000) : '',
        paidAmount: paidAmount != null ? Number(paidAmount) : null,
        paymentProofDocId: toOid(paymentProofDocId) || null,
        financeApprovedBy: approverId || null,
        financeApprovedBySnapshot,
        financeApprovedAt: new Date(),
      },
    },
    { new: true }
  ).lean()

  return updated
}

export const markProductPurchased = async ({ billingRequestId, productId }) => {
  const brOid = toOid(billingRequestId)
  const pOid = toOid(productId)
  if (!brOid || !pOid) {
    throw new CustomError(statusCodes.badRequest, 'Invalid id', errorCodes.bad_request)
  }

  const doc = await BillingRequestModel.findById(brOid)
  if (!doc) {
    throw new CustomError(statusCodes.notFound, 'Billing request not found', errorCodes.not_found)
  }

  if (doc.status !== BILLING_REQUEST_STATUS.FINANCE_APPROVED) {
    throw new CustomError(statusCodes.badRequest, 'Billing request must be finance approved before marking purchased', errorCodes.bad_request)
  }

  const product = doc.products.id(pOid)
  if (!product) {
    throw new CustomError(statusCodes.notFound, 'Product not found', errorCodes.not_found)
  }

  if (product.isPurchased) {
    throw new CustomError(statusCodes.badRequest, 'Product is already marked as purchased', errorCodes.bad_request)
  }

  product.isPurchased = true
  product.purchasedAt = new Date()

  await doc.save()

  // Update po_products status → purchased
  if (product.poProductId) {
    await PoProductModel.updateOne(
      { _id: product.poProductId },
      { $set: { status: 'purchased' } }
    )
  }

  return doc.toObject()
}

export const resubmitProduct = async ({ billingRequestId, productId, billDocId, productImageDocId, amount, remark }) => {
  const brOid = toOid(billingRequestId)
  const pOid = toOid(productId)
  if (!brOid || !pOid) {
    throw new CustomError(statusCodes.badRequest, 'Invalid id', errorCodes.bad_request)
  }
  if (!toOid(billDocId)) {
    throw new CustomError(statusCodes.badRequest, 'billDocId is required', errorCodes.bad_request)
  }

  const doc = await BillingRequestModel.findById(brOid)
  if (!doc) {
    throw new CustomError(statusCodes.notFound, 'Billing request not found', errorCodes.not_found)
  }

  const product = doc.products.id(pOid)
  if (!product) {
    throw new CustomError(statusCodes.notFound, 'Product not found', errorCodes.not_found)
  }

  if (product.hodStatus !== 'rejected') {
    throw new CustomError(statusCodes.badRequest, 'Only rejected products can be resubmitted', errorCodes.bad_request)
  }

  product.billDocId = toOid(billDocId)
  if (toOid(productImageDocId)) product.productImageDocId = toOid(productImageDocId)
  if (amount != null && !Number.isNaN(Number(amount))) product.amount = Number(amount)
  if (remark != null) product.remark = String(remark).trim().slice(0, 2000)

  product.hodStatus = null
  product.hodRemark = ''
  product.hodReviewedBy = null
  product.hodReviewedBySnapshot = null
  product.hodReviewedAt = null

  doc.status = BILLING_REQUEST_STATUS.HOD_APPROVAL_PENDING

  await doc.save()
  return doc.toObject()
}

const buildEmployeeSnapshot = async (employeeId) => {
  const id = toOid(employeeId)
  if (!id) return null
  const e = await EmployeeModel.findById(id).select('-password').lean()
  return e || null
}

/**
 * Create a single BillingRequest document for a batch of PO products,
 * then set each po_product.status = 'hod_approval_pending'.
 */
export const createBillingRequest = async ({ products, user }) => {
  if (!Array.isArray(products) || products.length === 0) {
    throw new CustomError(
      statusCodes.badRequest,
      'At least one product is required',
      errorCodes.bad_request
    )
  }

  const creatorId = toOid(user?.id)
  if (!creatorId) {
    throw new CustomError(
      statusCodes.unauthorized,
      'Invalid user',
      errorCodes.unauthorized
    )
  }

  // Load all po_products in one query
  const poProductOids = products.map((p) => toOid(p.poProductId)).filter(Boolean)
  if (poProductOids.length !== products.length) {
    throw new CustomError(
      statusCodes.badRequest,
      'One or more invalid poProductId values',
      errorCodes.bad_request
    )
  }

  const poProductDocs = await PoProductModel.find({
    _id: { $in: poProductOids },
    isDeleted: false,
  }).lean()

  if (poProductDocs.length !== poProductOids.length) {
    throw new CustomError(
      statusCodes.badRequest,
      'One or more PO products not found',
      errorCodes.not_found
    )
  }

  const poProductMap = Object.fromEntries(
    poProductDocs.map((d) => [String(d._id), d])
  )

  // Build product entries for the billing request doc
  const productEntries = products.map((p) => {
    const doc = poProductMap[String(toOid(p.poProductId))]
    const supplierSnapshot =
      p.supplierSnapshot && typeof p.supplierSnapshot === 'object'
        ? { ...p.supplierSnapshot, password: undefined }
        : null

    const firstImageId =
      toOid(p.productImageDocId) ||
      (Array.isArray(p.productImageDocIds) ? toOid(p.productImageDocIds[0]) : null) ||
      null

    return {
      poProductId: toOid(p.poProductId),
      rawProductCode: doc.rawProductCode || '',
      productName: doc.productName || '',
      quantity: doc.quantity ?? null,
      unit: doc.unit || '',
      amount: Number(p.amount),
      productImageDocId: firstImageId,
      billDocId: toOid(p.billDocId) || null,
      supplierSnapshot,
      remark: p.remark ? String(p.remark).trim().slice(0, 2000) : '',
    }
  })

  // Unique poCodes from all products
  const uniquePoCodes = [
    ...new Set(poProductDocs.map((d) => d.poCode).filter(Boolean)),
  ]
  const poCodeStr = uniquePoCodes.join(', ')

  // Branch from first product
  const branchId = toOid(poProductDocs[0]?.branchId)

  const createdBySnapshot = await buildEmployeeSnapshot(creatorId)

  // Generate a unique code (retry up to 5 times on collision)
  let billingRequestCode = ''
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = BillingRequestModel.generateCode()
    const exists = await BillingRequestModel.findOne({
      billingRequestCode: candidate,
    }).lean()
    if (!exists) {
      billingRequestCode = candidate
      break
    }
  }
  if (!billingRequestCode) {
    billingRequestCode = `BR-${Date.now()}`
  }

  // Create the billing request doc
  const billingRequest = await BillingRequestModel.create({
    billingRequestCode,
    poCode: poCodeStr,
    products: productEntries,
    status: BILLING_REQUEST_STATUS.HOD_APPROVAL_PENDING,
    createdBy: creatorId,
    createdBySnapshot,
    branchId: branchId || null,
  })

  // Update all included po_products status → hod_approval_pending
  await PoProductModel.updateMany(
    { _id: { $in: poProductOids }, isDeleted: false },
    {
      $set: {
        status: 'hod_approval_pending',
        billingRequestId: billingRequest._id,
      },
    }
  )

  // Capture billed amounts into Rate_master (deduped by billingRequestCode + productCode).
  try {
    await upsertRateMasterEntries({
      type: RATE_MASTER_TYPE.BILLING,
      sourceCode: billingRequestCode,
      sourceId: billingRequest._id,
      branchId: branchId || null,
      items: productEntries
        .filter((p) => String(p?.rawProductCode || '').trim())
        .map((p) => ({
          productCode: p.rawProductCode,
          rate: p.amount,
          unit: p.unit,
          supplierSnapshot: p.supplierSnapshot || null,
          snapshot: {
            billingRequestId: String(billingRequest._id || ''),
            billingRequestCode,
            poCode: poCodeStr,
            poProductId: String(p.poProductId || ''),
            rawProductCode: p.rawProductCode || '',
            productName: p.productName || '',
            quantity: p.quantity ?? null,
            unit: p.unit || '',
            amount: p.amount ?? null,
            supplierSnapshot: p.supplierSnapshot || null,
          },
        })),
    })
  } catch (err) {
    console.error(
      '[billingRequest] rate_master sync failed:',
      err?.message || err
    )
  }

  return billingRequest
}
