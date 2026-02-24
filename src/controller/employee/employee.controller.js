import { Message, statusCodes } from '../../core/common/constant.js'
import { getBranchFilter } from '../../core/helpers/branchFilter.js'
import {
  createEmployeeSchema,
  listEmployeeSchema,
  getEmployeeByIdSchema,
  updateEmployeeSchema,
  deleteEmployeeSchema,
  loginEmployeeSchema,
} from '../../validator/employee/employee.validator.js'
import {
  addEmployee,
  listEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  employeeLogin,
} from '../../services/employee/employee.service.js'

export const createEmployeeController = async (req, res) => {
  const { error, value } = createEmployeeSchema.validate(req.body, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const result = await addEmployee(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Employee created successfully',
    data: result,
  })
}

export const listEmployeesController = async (req, res) => {
  const { error, value } = listEmployeeSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = getBranchFilter(req, { allowQueryBranchId: true })
  const result = await listEmployees({ ...value, branchFilter })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Employees retrieved successfully',
    data: result,
  })
}

export const getEmployeeByIdController = async (req, res) => {
  const { error, value } = getEmployeeByIdSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = getBranchFilter(req)
  const result = await getEmployeeById({ ...value, branchFilter })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Employee details retrieved successfully',
    data: result,
  })
}

export const updateEmployeeController = async (req, res) => {
  const { error, value } = updateEmployeeSchema.validate(
    { ...req.body, ...req.query },
    {
      abortEarly: false,
    }
  )
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = getBranchFilter(req)
  const result = await updateEmployee({ ...value, branchFilter })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Employee updated successfully',
    data: result,
  })
}

export const deleteEmployeeController = async (req, res) => {
  const { error, value } = deleteEmployeeSchema.validate(req.query, {
    abortEarly: false,
  })
  if (error) {
    return res.status(statusCodes.badRequest).json({
      success: false,
      message: Message.validationError,
      error: error.details.map((d) => d.message),
    })
  }

  const branchFilter = getBranchFilter(req)
  const result = await deleteEmployee({ ...value, branchFilter })
  return res.status(statusCodes.ok).json({
    success: true,
    message: 'Employee deleted successfully',
    data: result,
  })
}

export const loginEmployeeController = async (req, res) => {
  const { error, value } = loginEmployeeSchema.validate(req.body, {
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

  const result = await employeeLogin(value)
  return res.status(statusCodes.ok).json({
    success: true,
    message: Message.loginSuccessfully,
    data: result,
  })
}
