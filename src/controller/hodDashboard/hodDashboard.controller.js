import { statusCodes, Message } from '../../core/common/constant.js'
import {
  hodOverviewSchema,
  hodPendingItemsSchema,
} from '../../validator/hodDashboard/hodDashboard.validator.js'
import {
  getHodOverview,
  getHodPendingItems,
} from '../../services/hodDashboard/hodDashboard.service.js'

export const getHodOverviewController = async (req, res) => {
  const { error, value } = hodOverviewSchema.validate(req.query, {
    abortEarly: false,
    convert: true,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await getHodOverview({
    ...value,
    fallbackBranchId: req.user?.branchId || null,
  })

  return res.status(statusCodes.ok).json({
    success: true,
    message: 'HOD dashboard overview retrieved successfully',
    data: result,
  })
}

export const getHodPendingItemsController = async (req, res) => {
  const { error, value } = hodPendingItemsSchema.validate(req.query, {
    abortEarly: false,
    convert: true,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await getHodPendingItems(value)

  return res.status(statusCodes.ok).json({
    success: true,
    message: 'HOD pending items retrieved successfully',
    data: result,
  })
}
