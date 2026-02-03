import { Message, statusCodes } from '../../core/common/constant.js'
import {
  createAdminSchema,
  loginAdminSchema,
  loginSuperAdminSchema,
  listAdminSchema,
  updateAdminSchema,
  deleteAdminSchema,
  updateAdminAccessSchema,
  getAdminByIdSchema,
} from '../../validator/admin/admin.validator.js'
import {
  addAdmin,
  adminLogin,
  superAdminLogin,
  listAdmins,
  updateAdmin as updateAdminService,
  deleteAdmin,
  updateAdminAccess,
  getAdminById,
} from '../../services/admin/admin.service.js'

export const loginAdmin = async (req, res) => {
  const { error, value } = loginAdminSchema.validate(req.body, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      data: null,
      error: {
        errorCode: 'VALIDATION_ERROR',
        detail: error.details.map((d) => d.message),
      },
    })
  }

  console.log('value', value)
  const result = await adminLogin(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: Message.loginSuccessfully,
    data: result,
  })
}

export const loginSuperAdmin = async (req, res) => {
  const { error, value } = loginSuperAdminSchema.validate(req.body, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      data: null,
      error: {
        errorCode: 'VALIDATION_ERROR',
        detail: error.details.map((d) => d.message),
      },
    })
  }

  const result = await superAdminLogin(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: Message.loginSuccessfully,
    data: result,
  })
}

export const createAdmin = async (req, res) => {
  const { error, value } = createAdminSchema.validate(req.body, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      data: null,
      error: {
        errorCode: 'VALIDATION_ERROR',
        detail: error.details.map((d) => d.message),
      },
    })
  }
  const result = await addAdmin(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: Message.adminCreated,
    data: result,
  })
}

export const listAdmin = async (req, res) => {
  const { error, value } = listAdminSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      data: null,
      error: {
        errorCode: 'VALIDATION_ERROR',
        detail: error.details.map((d) => d.message),
      },
    })
  }
  const result = await listAdmins(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Admins retrieved successfully',
    data: result,
  })
}

export const updateAdmin = async (req, res) => {
  const { error, value } = updateAdminSchema.validate(
    { ...req.body, ...req.query },
    {
      abortEarly: false,
    }
  )
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      data: null,
      error: {
        errorCode: 'VALIDATION_ERROR',
        detail: error.details.map((d) => d.message),
      },
    })
  }
  const result = await updateAdminService(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Admin updated successfully',
    data: result,
  })
}

export const deleteAdminController = async (req, res) => {
  const { error, value } = deleteAdminSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      data: null,
      error: {
        errorCode: 'VALIDATION_ERROR',
        detail: error.details.map((d) => d.message),
      },
    })
  }
  const result = await deleteAdmin(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Admin deleted successfully',
    data: result,
  })
}

export const updateAdminAccessController = async (req, res) => {
  const { error, value } = updateAdminAccessSchema.validate(req.body, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      data: null,
      error: {
        errorCode: 'VALIDATION_ERROR',
        detail: error.details.map((d) => d.message),
      },
    })
  }
  const result = await updateAdminAccess(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Admin access updated successfully',
    data: result,
  })
}

export const getAdminByIdController = async (req, res) => {
  const { error, value } = getAdminByIdSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      data: null,
      error: {
        errorCode: 'VALIDATION_ERROR',
        detail: error.details.map((d) => d.message),
      },
    })
  }
  try {
    const result = await getAdminById(value)
    return res.status(statusCodes.ok).json({
      success: true,
      message: 'Admin details retrieved successfully',
      data: result,
    })
  } catch (error) {
    return res
      .status(error.statusCode || statusCodes.internalServerError)
      .json({
        success: false,
        message: error.message,
        data: null,
        error: {
          errorCode: error.errorCode || 'INTERNAL_SERVER_ERROR',
        },
      })
  }
}
