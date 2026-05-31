import { Message, statusCodes } from '../../core/common/constant.js'
import {
  rateMasterSummarySchema,
  rateMasterListSchema,
  rateMasterSearchCodesSchema,
} from '../../validator/rateMaster/rateMaster.validator.js'
import {
  listRatesByProductCode,
  getProductCodeSummary,
  searchProductCodes,
} from '../../services/rateMaster/rateMaster.service.js'

const validationError = (res, error) =>
  res.status(statusCodes.badRequest).json({
    success: false,
    message: Message.validationError,
    error: error.details.map((d) => d.message),
  })

export const listRatesController = async (req, res) => {
  const { error, value } = rateMasterListSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) return validationError(res, error)

  const result = await listRatesByProductCode(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Rates retrieved successfully',
    data: result,
  })
}

export const summaryController = async (req, res) => {
  const { error, value } = rateMasterSummarySchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) return validationError(res, error)

  const result = await getProductCodeSummary(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Rate summary retrieved successfully',
    data: result,
  })
}

export const searchCodesController = async (req, res) => {
  const { error, value } = rateMasterSearchCodesSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) return validationError(res, error)

  const result = await searchProductCodes(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Product codes retrieved successfully',
    data: result,
  })
}
