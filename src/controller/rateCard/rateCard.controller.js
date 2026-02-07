import { Message, statusCodes } from '../../core/common/constant.js'
import {
  createRateCardSchema,
  listRateCardSchema,
  searchRateCardSchema,
  getRateCardByIdSchema,
  updateRateCardSchema,
  deleteRateCardSchema,
  addSupplierSchema,
  updateSupplierSchema,
  deleteSupplierSchema,
} from '../../validator/rateCard/rateCard.validator.js'
import {
  addRateCard,
  listRateCards,
  searchRateCards,
  getRateCardById,
  updateRateCard,
  deleteRateCard,
  addSupplierToRateCard,
  updateSupplierOnRateCard,
  deleteSupplierFromRateCard,
} from '../../services/rateCard/rateCard.service.js'

export const createRateCardController = async (req, res) => {
  const { error, value } = createRateCardSchema.validate(req.body, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await addRateCard(value)
  return res.status(statusCodes.created).json({
    success: true,
    message: 'Rate card created successfully',
    data: result,
  })
}

export const listRateCardsController = async (req, res) => {
  const { error, value } = listRateCardSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await listRateCards(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Rate cards retrieved successfully',
    data: result,
  })
}

export const searchRateCardsController = async (req, res) => {
  const { error, value } = searchRateCardSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await searchRateCards(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Rate cards search results retrieved successfully',
    data: result,
  })
}

export const getRateCardByIdController = async (req, res) => {
  const { error, value } = getRateCardByIdSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await getRateCardById(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Rate card details retrieved successfully',
    data: result,
  })
}

export const updateRateCardController = async (req, res) => {
  const { error, value } = updateRateCardSchema.validate(
    { ...req.body, ...req.query },
    {
      abortEarly: false,
    },
  )
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await updateRateCard(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Rate card updated successfully',
    data: result,
  })
}

export const deleteRateCardController = async (req, res) => {
  const { error, value } = deleteRateCardSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await deleteRateCard(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Rate card deleted successfully',
    data: result,
  })
}

export const addSupplierController = async (req, res) => {
  const { error, value } = addSupplierSchema.validate(
    { ...req.body, ...req.query },
    { abortEarly: false },
  )
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }
  const result = await addSupplierToRateCard(value)
  return res.status(statusCodes.created).json({
    success: true,
    message: 'Supplier added to rate card successfully',
    data: result,
  })
}

export const updateSupplierController = async (req, res) => {
  const { error, value } = updateSupplierSchema.validate(
    { ...req.body, ...req.query },
    { abortEarly: false },
  )
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }
  const result = await updateSupplierOnRateCard(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Supplier updated successfully',
    data: result,
  })
}

export const deleteSupplierController = async (req, res) => {
  const { error, value } = deleteSupplierSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }
  const result = await deleteSupplierFromRateCard(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Supplier removed from rate card successfully',
    data: result,
  })
}
