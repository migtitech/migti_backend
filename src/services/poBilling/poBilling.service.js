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
    throw new CustomError(statusCodes.badRequest, 'Attachment document not found', errorCodes.bad_request)
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
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999))
  let start = null
  if (period === 'daily') {
    start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
  } else if (period === 'weekly') {
    start = new Date(end)
    start.setUTCDate(start.getUTCDate() - 6)
    start.setUTCHours(0, 0, 0, 0)
  } else if (period === 'monthly') {
    start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))
  }
  return { start, end }
}

const buildDateFilter = ({ period = 'all', dateFrom = '', dateTo = '' }) => {
  let fromD = dateFrom && String(dateFrom).trim() ? startOfUtcDay(dateFrom) : null
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
      errorCodes.bad_request,
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
const resolveSalespersonIdForIndustry = async ({ companyId, branchId = null }) => {
  if (!companyId || !mongoose.Types.ObjectId.isValid(String(companyId))) {
    throw new CustomError(statusCodes.badRequest, 'Invalid company', errorCodes.bad_request)
  }
  const industryFilter = {
    _id: new mongoose.Types.ObjectId(String(companyId)),
    isDeleted: false,
  }
  if (branchId && mongoose.Types.ObjectId.isValid(String(branchId))) {
    industryFilter.branchId = new mongoose.Types.ObjectId(String(branchId))
  }
  const industry = await IndustryModel.findOne(industryFilter).select('area subZoneId branchId').lean()
  if (!industry) {
    throw new CustomError(statusCodes.notFound, 'Company not found', errorCodes.not_found)
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
      errorCodes.bad_request,
    )
  }

  const emp = await EmployeeModel.findOne(empFilter).select('_id').sort({ name: 1 }).lean()
  if (!emp?._id) {
    throw new CustomError(
      statusCodes.badRequest,
      'No sales employee mapped to this client zone',
      errorCodes.bad_request,
    )
  }
  return emp._id
}

export const getPoBillingFormOptions = async ({ branchFilter = {} }) => {
  const filter = { isDeleted: false, ...branchFilter }
  const companies = await IndustryModel.find(filter).select('_id name').sort({ name: 1 }).lean()

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
  const doc = await PoEntryModel.create({
    poNumber: String(poNumber || '').trim().toUpperCase(),
    companyId,
    salespersonId: resolvedSalespersonId,
    amount: Number(amount) || 0,
    entryDate: entryDate ? new Date(entryDate) : new Date(),
    dispatchmentDate: dispatchment && !Number.isNaN(dispatchment.getTime()) ? dispatchment : null,
    remark: String(remark || '').trim(),
    branchId: branchId || null,
    created_by: created_by || null,
    attachmentDocumentId: attachmentId,
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
    billingNumber: String(billingNumber || '').trim().toUpperCase(),
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

  const territoryIndustryIds = await getTerritoryIndustryIdsForUser({
    currentUserId,
    isFullAccessRole,
    branchFilter,
  })
  if (territoryIndustryIds != null) {
    const companyScope = { $in: territoryIndustryIds }
    poFilter.companyId = companyScope
    billingFilter.companyId = companyScope
  }

  const [totalPoCount, totalBillingCount, poAmountAgg, billingAmountAgg] = await Promise.all([
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
        number: tab === 'billing' ? row.billingNumber || '' : row.poNumber || '',
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
    }),
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
