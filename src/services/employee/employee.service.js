import EmployeeModel from '../../models/employee.model.js'
import CustomError from '../../utils/exception.js'
import { Message, statusCodes, errorCodes } from '../../core/common/constant.js'
import { decrypt, encrypt } from '../../core/crypto/helper.cryto.js'
import { createTokenPair } from '../../core/helpers/jwt.helper.js'

export const addEmployee = async (payload) => {
  const { password, ...rest } = payload
  const { email, idnumber } = rest

  const existingEmployee = await EmployeeModel.findOne({
    $or: [{ email }, { idnumber }],
  }).lean()

  if (existingEmployee) {
    throw new CustomError(
      statusCodes.conflict,
      'Employee already exists',
      errorCodes.already_exist
    )
  }

  const employeeDoc = await EmployeeModel.create({
    ...rest,
    password: encrypt(password),
  })

  const employee = employeeDoc.toObject()
  delete employee.password
  return employee
}

export const listEmployees = async ({ pageNumber = 1, pageSize = 10 }) => {
  const page = Math.max(1, parseInt(pageNumber))
  const limit = Math.min(100, Math.max(1, parseInt(pageSize)))
  const skip = (page - 1) * limit

  const totalItems = await EmployeeModel.countDocuments()

  const employees = await EmployeeModel.find()
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

  const totalPages = Math.ceil(totalItems / limit)
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  return {
    employees,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
      hasNextPage,
      hasPrevPage,
    },
  }
}

export const getEmployeeById = async ({ employeeId }) => {
  const employee = await EmployeeModel.findById(employeeId).select('-password').lean()

  if (!employee) {
    throw new CustomError(
      statusCodes.notFound,
      'Employee not found',
      errorCodes.not_found
    )
  }

  return employee
}

export const updateEmployee = async ({ employeeId, ...updateData }) => {
  const employee = await EmployeeModel.findById(employeeId).lean()
  if (!employee) {
    throw new CustomError(
      statusCodes.notFound,
      'Employee not found',
      errorCodes.not_found
    )
  }

  if (updateData.password) {
    updateData.password = encrypt(updateData.password)
  } else {
    delete updateData.password
  }

  if (updateData.email || updateData.idnumber) {
    const conflict = await EmployeeModel.findOne({
      _id: { $ne: employeeId },
      $or: [
        ...(updateData.email ? [{ email: updateData.email }] : []),
        ...(updateData.idnumber ? [{ idnumber: updateData.idnumber }] : []),
      ],
    }).lean()

    if (conflict) {
      throw new CustomError(
        statusCodes.conflict,
        'Employee already exists',
        errorCodes.already_exist
      )
    }
  }

  const updatedEmployee = await EmployeeModel.findByIdAndUpdate(
    employeeId,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  )
    .select('-password')
    .lean()

  return updatedEmployee
}

export const deleteEmployee = async ({ employeeId }) => {
  const employee = await EmployeeModel.findById(employeeId).lean()
  if (!employee) {
    throw new CustomError(
      statusCodes.notFound,
      'Employee not found',
      errorCodes.not_found
    )
  }

  await EmployeeModel.findByIdAndDelete(employeeId)

  return {
    deletedEmployee: {
      id: employee._id,
      name: employee.name,
      email: employee.email,
      deletedAt: new Date().toISOString(),
    },
  }
}

export const employeeLogin = async ({ email, password, role }) => {
  const employee = await EmployeeModel.findOne({ email , role }).lean()
  if (!employee) {
    throw new CustomError(
      statusCodes.notFound,
      Message.notFound,
      errorCodes.not_found
    )
  }

  const decryptedPassword = decrypt(employee.password)
  if (password !== decryptedPassword) {
    throw new CustomError(
      statusCodes.unauthorized,
      Message.wrongPassword,
      errorCodes.unauthorized
    )
  }

  const tokenPayload = {
    id: employee._id,
    email: employee.email,
    role: employee.role,
    type: 'access',
    branchId: employee.branchId,
  }

  const tokens = createTokenPair(tokenPayload)

  const safeEmployee = { ...employee }
  delete safeEmployee.password

  return {
    employee: safeEmployee,
    ...tokens,
  }
}
