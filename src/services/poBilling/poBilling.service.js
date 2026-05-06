import mongoose from 'mongoose'
import PoEntryModel from '../../models/poEntry.model.js'
import BillingEntryModel from '../../models/billingEntry.model.js'
import DocumentModel from '../../models/document.model.js'
import IndustryModel from '../../models/industry.model.js'
import EmployeeModel from '../../models/employee.model.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'
import { toDisplayPath } from '../document/document.service.js'
import { getTerritoryIndustryIdsForUser } from '../../core/helpers/queryAccess.js'

const normalizeAttachmentDocumentId = async (attachmentDocumentId) => {
  const id = attachmentDocumentId && String(attachmentDocumentId).trim()
  if (!id) return null
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

const getRangeFromPeriod = (period = 'all') => {
  const now = new Date()
  const end = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      23,
      59,
      59,
      999
    )
  )
  let start = null
  if (period === 'daily') {
    start = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        0,
        0,
        0,
        0
      )
    )
  } else if (period === 'weekly') {
    start = new Date(end)
    start.setUTCDate(start.getUTCDate() - 6)
    start.setUTCHours(0, 0, 0, 0)
  } else if (period === 'monthly') {
    start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0)
    )
  }
  return { start, end }
}

const buildDateFilter = ({ period = 'all', dateFrom = '', dateTo = '' }) => {
  let fromD =
    dateFrom && String(dateFrom).trim() ? startOfUtcDay(dateFrom) : null
  let toD = dateTo && String(dateTo).trim() ? endOfUtcDay(dateTo) : null
  if (!fromD && !toD && period && period !== 'all') {
    const range = getRangeFromPeriod(period)
    fromD = range.start
    toD = range.end
  }

  if (fromD && toD && fromD > toD) {
    throw new CustomError(
      statusCodes.badRequest,
      'dateFrom must be on or before dateTo',
      errorCodes.bad_request
    )
  }

  if (!fromD && !toD) return {}

  const createdAt = {}
  if (fromD) createdAt.$gte = fromD
  if (toD) createdAt.$lte = toD
  return { entryDate: createdAt }
}

/**
 * Pick a sales employee for PO/Billing from the client's zone/subzone (no manual selection).
 * - Client has subZoneId: match employee.subZoneId.
 * - Else client has area: match employee.zoneId or zoneIds containing that area.
 */
const resolveSalespersonIdForIndustry = async ({
  companyId,
  branchId = null,
}) => {
  if (!companyId || !mongoose.Types.ObjectId.isValid(String(companyId))) {
    throw new CustomError(
      statusCodes.badRequest,
      'Invalid company',
      errorCodes.bad_request
    )
  }
  const industryFilter = {
    _id: new mongoose.Types.ObjectId(String(companyId)),
    isDeleted: false,
  }
  if (branchId && mongoose.Types.ObjectId.isValid(String(branchId))) {
    industryFilter.branchId = new mongoose.Types.ObjectId(String(branchId))
  }
  const industry = await IndustryModel.findOne(industryFilter)
    .select('area subZoneId branchId')
    .lean()
  if (!industry) {
    throw new CustomError(
      statusCodes.notFound,
      'Company not found',
      errorCodes.not_found
    )
  }

  const empFilter = {
    isDeleted: false,
    role: { $regex: /^sales/i },
  }
  if (industry.branchId) {
    empFilter.branchId = industry.branchId
  }

  if (industry.subZoneId) {
    empFilter.subZoneId = industry.subZoneId
  } else if (industry.area) {
    const aid = industry.area
    empFilter.$or = [{ zoneId: aid }, { zoneIds: aid }]
  } else {
    throw new CustomError(
      statusCodes.badRequest,
      'Client has no zone assigned; cannot determine salesperson',
      errorCodes.bad_request
    )
  }

  const emp = await EmployeeModel.findOne(empFilter)
    .select('_id')
    .sort({ name: 1 })
    .lean()
  if (!emp?._id) {
    throw new CustomError(
      statusCodes.badRequest,
      'No sales employee mapped to this client zone',
      errorCodes.bad_request
    )
  }
  return emp._id
}

export const getPoBillingFormOptions = async ({ branchFilter = {} }) => {
  const filter = { isDeleted: false, ...branchFilter }
  const companies = await IndustryModel.find(filter)
    .select('_id name')
    .sort({ name: 1 })
    .lean()

  return {
    companies: (companies || []).map((company) => ({
      _id: company._id,
      name: company.name || '',
    })),
    salespeople: [],
  }
}

export const createPoEntry = async ({
  poNumber = '',
  companyId,
  salespersonId,
  amount,
  entryDate,
  dispatchmentDate = null,
  remark = '',
  branchId = null,
  created_by = null,
  attachmentDocumentId = null,
  purchaseOrderId = null,
}) => {
  const attachmentId = await normalizeAttachmentDocumentId(attachmentDocumentId)
  const trimmedSalesId = salespersonId && String(salespersonId).trim()
  const resolvedSalespersonId = trimmedSalesId
    ? trimmedSalesId
    : await resolveSalespersonIdForIndustry({ companyId, branchId })
  const dispatchment =
    dispatchmentDate != null && String(dispatchmentDate).trim() !== ''
      ? new Date(dispatchmentDate)
      : null
  const poRef =
    purchaseOrderId &&
    mongoose.Types.ObjectId.isValid(String(purchaseOrderId).trim())
      ? String(purchaseOrderId).trim()
      : null
  const doc = await PoEntryModel.create({
    poNumber: String(poNumber || '')
      .trim()
      .toUpperCase(),
    companyId,
    salespersonId: resolvedSalespersonId,
    amount: Number(amount) || 0,
    entryDate: entryDate ? new Date(entryDate) : new Date(),
    dispatchmentDate:
      dispatchment && !Number.isNaN(dispatchment.getTime())
        ? dispatchment
        : null,
    remark: String(remark || '').trim(),
    branchId: branchId || null,
    created_by: created_by || null,
    attachmentDocumentId: attachmentId,
    purchaseOrderId: poRef,
  })
  return doc.toObject()
}

const pickEarliestDispatchmentFromProducts = (products = []) => {
  let best = null
  for (const p of products) {
    const raw = p?.dispatchmentDate
    if (raw == null || raw === '') continue
    const dt = new Date(raw)
    if (Number.isNaN(dt.getTime())) continue
    if (!best || dt < best) best = dt
  }
  return best
}

const resolveIndustryIdForPo = (purchaseOrder) => {
  const raw = purchaseOrder?.industry_id
  if (raw && typeof raw === 'object' && raw._id != null) return raw._id
  return raw || null
}

const resolveSalespersonIdForLinkedPurchaseOrder = async ({
  purchaseOrder,
  companyId,
  branchId,
}) => {
  const assigned = purchaseOrder?.assigned_employee
  if (assigned && typeof assigned === 'object') {
    const aid = assigned._id ?? assigned.id
    if (aid != null && mongoose.Types.ObjectId.isValid(String(aid))) {
      return String(aid)
    }
  }
  const se = purchaseOrder?.salesEmployeeId
  if (se) {
    const sid =
      typeof se === 'object' && se._id != null ? String(se._id) : String(se)
    if (mongoose.Types.ObjectId.isValid(sid)) return sid
  }
  return resolveSalespersonIdForIndustry({ companyId, branchId })
}

const safeNormalizeAttachmentId = async (attachmentDocumentId) => {
  if (attachmentDocumentId == null || attachmentDocumentId === '') return null
  try {
    return await normalizeAttachmentDocumentId(attachmentDocumentId)
  } catch {
    return null
  }
}

/**
 * One poEntry per purchase order (sparse unique purchaseOrderId).
 * Call when a PO is created from quotation or when totals / assignee / attachment change.
 */
export const upsertPoEntryLinkedToPurchaseOrder = async ({
  purchaseOrder,
  amount,
  created_by = null,
}) => {
  if (!purchaseOrder?._id) return null
  const companyId = resolveIndustryIdForPo(purchaseOrder)
  if (!companyId || !mongoose.Types.ObjectId.isValid(String(companyId))) {
    return null
  }
  const branchId = purchaseOrder.branchId || null
  const salespersonId = await resolveSalespersonIdForLinkedPurchaseOrder({
    purchaseOrder,
    companyId,
    branchId,
  })
  const attRaw = purchaseOrder.attachmentDocumentId
  const attIdStr =
    attRaw && typeof attRaw === 'object' && attRaw._id != null
      ? String(attRaw._id)
      : attRaw
        ? String(attRaw)
        : null
  const attachmentDocumentId = await safeNormalizeAttachmentId(attIdStr)
  const dispatchmentDate = pickEarliestDispatchmentFromProducts(
    purchaseOrder.products || []
  )
  const base = {
    poNumber: String(purchaseOrder.poCode || '')
      .trim()
      .toUpperCase(),
    companyId,
    salespersonId,
    amount: Math.max(0, Number(amount) || 0),
    remark: String(purchaseOrder.remark || '').trim(),
    branchId: branchId || null,
    dispatchmentDate:
      dispatchmentDate && !Number.isNaN(dispatchmentDate.getTime())
        ? dispatchmentDate
        : null,
    attachmentDocumentId,
  }
  const poOid = new mongoose.Types.ObjectId(String(purchaseOrder._id))
  const existing = await PoEntryModel.findOne({
    purchaseOrderId: poOid,
    isDeleted: false,
  })
    .select('_id')
    .lean()
  if (existing?._id) {
    await PoEntryModel.updateOne(
      { _id: existing._id },
      { $set: { ...base, purchaseOrderId: poOid } }
    )
    return PoEntryModel.findById(existing._id).lean()
  }
  const doc = await PoEntryModel.create({
    ...base,
    purchaseOrderId: poOid,
    entryDate: new Date(),
    created_by: created_by || null,
  })
  return doc.toObject()
}

export const createBillingEntry = async ({
  billingNumber = '',
  companyId,
  salespersonId,
  amount,
  entryDate,
  remark = '',
  branchId = null,
  created_by = null,
  attachmentDocumentId = null,
}) => {
  const attachmentId = await normalizeAttachmentDocumentId(attachmentDocumentId)
  const trimmedSalesId = salespersonId && String(salespersonId).trim()
  const resolvedSalespersonId = trimmedSalesId
    ? trimmedSalesId
    : await resolveSalespersonIdForIndustry({ companyId, branchId })
  const doc = await BillingEntryModel.create({
    billingNumber: String(billingNumber || '')
      .trim()
      .toUpperCase(),
    companyId,
    salespersonId: resolvedSalespersonId,
    amount: Number(amount) || 0,
    entryDate: entryDate ? new Date(entryDate) : new Date(),
    remark: String(remark || '').trim(),
    branchId: branchId || null,
    created_by: created_by || null,
    attachmentDocumentId: attachmentId,
  })
  return doc.toObject()
}

export const getPoBillingAnalytics = async ({
  period = 'all',
  dateFrom = '',
  dateTo = '',
  areaIds = '',
  industryId = '',
  tab = 'po',
  pageNumber = 1,
  pageSize = 10,
  branchFilter = {},
  currentUserId = null,
  isFullAccessRole = true,
}) => {
  const page = Math.max(1, parseInt(pageNumber))
  const limit = Math.min(100, Math.max(1, parseInt(pageSize)))
  const skip = (page - 1) * limit

  const dateFilter = buildDateFilter({ period, dateFrom, dateTo })
  const poFilter = { isDeleted: false, ...branchFilter, ...dateFilter }
  const billingFilter = { isDeleted: false, ...branchFilter, ...dateFilter }

  if (
    industryId &&
    String(industryId).trim() &&
    mongoose.Types.ObjectId.isValid(String(industryId).trim())
  ) {
    const scopedIndustryId = new mongoose.Types.ObjectId(
      String(industryId).trim()
    )
    poFilter.companyId = scopedIndustryId
    billingFilter.companyId = scopedIndustryId
  }

  if (areaIds && String(areaIds).trim()) {
    const selectedAreaIds = String(areaIds)
      .split(',')
      .map((v) => String(v || '').trim())
      .filter(Boolean)
    if (selectedAreaIds.length) {
      const areaObjectIds = selectedAreaIds
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id))
      const areaScopedIndustries = await IndustryModel.find({
        isDeleted: false,
        ...branchFilter,
        area: { $in: [...selectedAreaIds, ...areaObjectIds] },
      })
        .select('_id')
        .lean()
      const areaIndustryIds = areaScopedIndustries.map((row) => row._id)
      if (poFilter.companyId && !Array.isArray(poFilter.companyId?.$in)) {
        const selectedCompanyId = String(poFilter.companyId)
        const inArea = areaIndustryIds.some(
          (id) => String(id) === selectedCompanyId
        )
        const scopedIds = inArea ? [poFilter.companyId] : []
        poFilter.companyId = { $in: scopedIds }
        billingFilter.companyId = { $in: scopedIds }
      } else {
        poFilter.companyId = { $in: areaIndustryIds }
        billingFilter.companyId = { $in: areaIndustryIds }
      }
    }
  }

  const territoryIndustryIds = await getTerritoryIndustryIdsForUser({
    currentUserId,
    isFullAccessRole,
    branchFilter,
  })
  if (territoryIndustryIds != null) {
    let scopedIds = territoryIndustryIds
    if (Array.isArray(poFilter.companyId?.$in)) {
      scopedIds = poFilter.companyId.$in.filter((id) =>
        territoryIndustryIds.some((tid) => String(tid) === String(id))
      )
    } else if (poFilter.companyId) {
      const selectedCompanyId = String(poFilter.companyId)
      scopedIds = territoryIndustryIds.some(
        (id) => String(id) === selectedCompanyId
      )
        ? [poFilter.companyId]
        : []
    }
    const companyScope = { $in: scopedIds }
    poFilter.companyId = companyScope
    billingFilter.companyId = companyScope
  }

  const [totalPoCount, totalBillingCount, poAmountAgg, billingAmountAgg] =
    await Promise.all([
      PoEntryModel.countDocuments(poFilter),
      BillingEntryModel.countDocuments(billingFilter),
      PoEntryModel.aggregate([
        { $match: poFilter },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      BillingEntryModel.aggregate([
        { $match: billingFilter },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ])

  const poAmount = poAmountAgg?.[0]?.total || 0
  const billingAmount = billingAmountAgg?.[0]?.total || 0

  const activeModel = tab === 'billing' ? BillingEntryModel : PoEntryModel
  const activeFilter = tab === 'billing' ? billingFilter : poFilter
  const totalItems = tab === 'billing' ? totalBillingCount : totalPoCount

  let rows = await activeModel
    .find(activeFilter)
    .populate('companyId', 'name')
    .populate('salespersonId', 'name')
    .populate('attachmentDocumentId', 'path originalName mimeType')
    .sort({ entryDate: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

  rows = await Promise.all(
    rows.map(async (row) => {
      let attachment = null
      const att = row.attachmentDocumentId
      if (att && att._id && att.path) {
        const url = await toDisplayPath(att.path)
        attachment = {
          documentId: String(att._id),
          url,
          originalName: att.originalName || '',
          mimeType: att.mimeType || '',
        }
      }
      return {
        _id: row._id,
        number:
          tab === 'billing' ? row.billingNumber || '' : row.poNumber || '',
        companyId: row.companyId?._id || row.companyId || null,
        companyName: row.companyId?.name || '-',
        salespersonId: row.salespersonId?._id || row.salespersonId || null,
        salespersonName: row.salespersonId?.name || '-',
        amount: Number(row.amount) || 0,
        entryDate: row.entryDate || row.createdAt,
        dispatchmentDate: tab === 'po' ? row.dispatchmentDate || null : null,
        remark: row.remark || '',
        createdAt: row.createdAt,
        attachment,
      }
    })
  )

  const totalPages = Math.max(1, Math.ceil(totalItems / limit))
  return {
    metrics: {
      totalPoCount,
      totalBillingCount,
      poAmount,
      billingAmount,
    },
    table: {
      tab,
      rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    },
  }
}
