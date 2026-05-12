import { statusCodes, Message } from '../../core/common/constant.js'
import {
  listPoPaymentBacklog,
  settlePoPaymentBacklog,
} from '../../services/poPaymentBacklog/poPaymentBacklog.service.js'

export const listPoPaymentBacklogController = async (req, res) => {
  const {
    employeeId,
    is_settled,
    pageNumber,
    pageSize,
    poNumber,
    salesPersonName,
    clientName,
    dateFrom,
    dateTo,
  } = req.query

  const result = await listPoPaymentBacklog({
    employeeId: employeeId || undefined,
    is_settled: is_settled !== undefined ? is_settled : undefined,
    pageNumber: pageNumber ? Number(pageNumber) : 1,
    pageSize: pageSize ? Number(pageSize) : 20,
    poNumber: poNumber || undefined,
    salesPersonName: salesPersonName || undefined,
    clientName: clientName || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  })

  return res.status(statusCodes.ok).json({
    success: true,
    message: 'PO payment backlog fetched',
    data: result,
  })
}

export const settlePoPaymentBacklogController = async (req, res) => {
  const { backlogId } = req.body

  if (!backlogId) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: 'backlogId is required',
    })
  }

  const entry = await settlePoPaymentBacklog({ backlogId })

  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Backlog entry marked as settled',
    data: entry,
  })
}
