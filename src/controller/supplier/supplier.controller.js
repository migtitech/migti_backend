import { Message, statusCodes } from '../../core/common/constant.js'
import {
  createSupplierSchema,
  listSupplierSchema,
  searchSupplierSchema,
  getSupplierByIdSchema,
  updateSupplierSchema,
  deleteSupplierSchema,
} from '../../validator/supplier/supplier.validator.js'
import {
  addSupplier,
  listSuppliers,
  searchSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
} from '../../services/supplier/supplier.service.js'

export const createSupplierController = async (req, res) => {
  const { error, value } = createSupplierSchema.validate(req.body, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await addSupplier(value)
  return res.status(statusCodes.created).json({
    success: true,
    message: 'Supplier created successfully',
    data: result,
  })
}

export const listSuppliersController = async (req, res) => {
  const { error, value } = listSupplierSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await listSuppliers(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Suppliers retrieved successfully',
    data: result,
  })
}

export const searchSuppliersController = async (req, res) => {
  const { error, value } = searchSupplierSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await searchSuppliers(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Suppliers search results retrieved successfully',
    data: result,
  })
}

export const getSupplierByIdController = async (req, res) => {
  const { error, value } = getSupplierByIdSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await getSupplierById(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Supplier details retrieved successfully',
    data: result,
  })
}

export const updateSupplierController = async (req, res) => {
  const { error, value } = updateSupplierSchema.validate(
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

  const result = await updateSupplier(value)
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

  const result = await deleteSupplier(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Supplier deleted successfully',
    data: result,
  })
}
