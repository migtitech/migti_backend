import EmployeeModel from '../../models/employee.model.js'
import { assertSubZoneBelongsToArea } from '../subZone/subZone.service.js'
import CustomError from '../../utils/exception.js'
import { Message, statusCodes, errorCodes, MODULES, ACTIONS } from '../../core/common/constant.js'
import { decrypt, encrypt } from '../../core/crypto/helper.cryto.js'
import { createTokenPair } from '../../core/helpers/jwt.helper.js'

const nullIfEmpty = (v) => (v === '' || v == null ? null : v)

const SUB_ZONE_PERM_PREFIX = `${MODULES.SUB_ZONES}:`
const SUB_ZONE_READ_PERM = `${MODULES.SUB_ZONES}:${ACTIONS.READ}`
const SUB_ZONE_CREATE_PERM = `${MODULES.SUB_ZONES}:${ACTIONS.CREATE}`

/**
 * When an employee has a sub-zone assignment, ensure read + create (for inline sub-zone flows);
 * when cleared, strip all sub_zones:* perms.
 */
const syncPermissionsWithSubZoneAssignment = (permissions = [], subZoneId) => {
  const arr = [...(Array.isArray(permissions) ? permissions : [])].map(String).filter(Boolean)
  const hasSub = subZoneId != null && String(subZoneId).trim() !== ''
  if (!hasSub) {
    return arr.filter((p) => !p.startsWith(SUB_ZONE_PERM_PREFIX))
  }
  if (!arr.includes(SUB_ZONE_READ_PERM)) arr.push(SUB_ZONE_READ_PERM)
  if (!arr.includes(SUB_ZONE_CREATE_PERM)) arr.push(SUB_ZONE_CREATE_PERM)
  return arr
}

export const addEmployee = async (payload) => {
  const { password, ...rest } = payload
  const { email, idnumber } = rest

  rest.zoneId = nullIfEmpty(rest.zoneId)
  rest.subZoneId = nullIfEmpty(rest.subZoneId)
  const branchFilter = rest.branchId ? { branchId: rest.branchId } : {}
  await assertSubZoneBelongsToArea({
    subZoneId: rest.subZoneId,
    areaId: rest.zoneId,
    branchFilter,
  })

  // Normalize optional company contact fields
  if (rest.companyEmail == null) {
    rest.companyEmail = ''
  }
  if (rest.companyPhone == null) {
    rest.companyPhone = ''
  }

  // Normalize optional bank details to strings to avoid type issues
  if (rest.bankDetails) {
    rest.bankDetails = {
      accountNumber: typeof rest.bankDetails.accountNumber === 'string' ? rest.bankDetails.accountNumber : '',
      ifscCode: typeof rest.bankDetails.ifscCode === 'string' ? rest.bankDetails.ifscCode : '',
      bankName: typeof rest.bankDetails.bankName === 'string' ? rest.bankDetails.bankName : '',
      accountHolderName:
        typeof rest.bankDetails.accountHolderName === 'string' ? rest.bankDetails.accountHolderName : '',
      upiDetails: typeof rest.bankDetails.upiDetails === 'string' ? rest.bankDetails.upiDetails : '',
    }
  }

  rest.permissions = syncPermissionsWithSubZoneAssignment(rest.permissions || [], rest.subZoneId)

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

export const listEmployees = async ({
  pageNumber = 1,
  pageSize = 10,
  branchId,
  branchFilter = {},
  rolePrefix = '',
}) => {
  const page = Math.max(1, parseInt(pageNumber))
  const limit = Math.min(100, Math.max(1, parseInt(pageSize)))
  const skip = (page - 1) * limit

  const filter = { ...branchFilter }
  if (Object.keys(filter).length === 0 && branchId) filter.branchId = branchId

  const rp = String(rolePrefix || '').trim()
  if (rp) {
    const escaped = rp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    filter.role = new RegExp(`^${escaped}`, 'i')
  }

  const totalItems = await EmployeeModel.countDocuments(filter)

  const employees = await EmployeeModel.find(filter)
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

export const getEmployeeById = async ({ employeeId, branchFilter = {} }) => {
  const employee = await EmployeeModel.findOne({ _id: employeeId, ...branchFilter }).select('-password').lean()

  if (!employee) {
    throw new CustomError(
      statusCodes.notFound,
      'Employee not found',
      errorCodes.not_found
    )
  }

  return employee
}

export const updateEmployee = async ({ employeeId, branchFilter = {}, ...updateData }) => {
  const employee = await EmployeeModel.findOne({ _id: employeeId, ...branchFilter }).lean()
  if (!employee) {
    throw new CustomError(
      statusCodes.notFound,
      'Employee not found',
      errorCodes.not_found
    )
  }

  if (Object.prototype.hasOwnProperty.call(updateData, 'zoneId')) {
    updateData.zoneId = nullIfEmpty(updateData.zoneId)
  }
  if (Object.prototype.hasOwnProperty.call(updateData, 'subZoneId')) {
    updateData.subZoneId = nullIfEmpty(updateData.subZoneId)
  }
  if (Object.prototype.hasOwnProperty.call(updateData, 'zoneId') && updateData.zoneId == null) {
    updateData.subZoneId = null
  }

  const effZone = Object.prototype.hasOwnProperty.call(updateData, 'zoneId')
    ? updateData.zoneId
    : employee.zoneId
  const effSub = Object.prototype.hasOwnProperty.call(updateData, 'subZoneId')
    ? updateData.subZoneId
    : employee.subZoneId
  const effBranchId = Object.prototype.hasOwnProperty.call(updateData, 'branchId')
    ? updateData.branchId
    : employee.branchId
  const areaBranchFilter = effBranchId ? { branchId: effBranchId } : {}
  await assertSubZoneBelongsToArea({
    subZoneId: effSub,
    areaId: effZone,
    branchFilter: areaBranchFilter,
  })

  if (updateData.password) {
    updateData.password = encrypt(updateData.password)
  } else {
    delete updateData.password
  }

  // Normalize optional company contact fields on update
  if (Object.prototype.hasOwnProperty.call(updateData, 'companyEmail') && updateData.companyEmail == null) {
    updateData.companyEmail = ''
  }
  if (Object.prototype.hasOwnProperty.call(updateData, 'companyPhone') && updateData.companyPhone == null) {
    updateData.companyPhone = ''
  }

  // Normalize optional bank details to strings on update as well
  if (updateData.bankDetails) {
    updateData.bankDetails = {
      accountNumber:
        typeof updateData.bankDetails.accountNumber === 'string' ? updateData.bankDetails.accountNumber : '',
      ifscCode:
        typeof updateData.bankDetails.ifscCode === 'string' ? updateData.bankDetails.ifscCode : '',
      bankName: typeof updateData.bankDetails.bankName === 'string' ? updateData.bankDetails.bankName : '',
      accountHolderName:
        typeof updateData.bankDetails.accountHolderName === 'string'
          ? updateData.bankDetails.accountHolderName
          : '',
      upiDetails:
        typeof updateData.bankDetails.upiDetails === 'string' ? updateData.bankDetails.upiDetails : '',
    }
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

  const basePermissions =
    updateData.permissions !== undefined
      ? [...(Array.isArray(updateData.permissions) ? updateData.permissions : [])]
      : [...(employee.permissions || [])]
  updateData.permissions = syncPermissionsWithSubZoneAssignment(basePermissions, effSub)

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

export const deleteEmployee = async ({ employeeId, branchFilter = {} }) => {
  const employee = await EmployeeModel.findOne({ _id: employeeId, ...branchFilter }).lean()
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
    permissions: employee.permissions || [],
  }

  const tokens = createTokenPair(tokenPayload)

  const safeEmployee = { ...employee }
  delete safeEmployee.password

  return {
    employee: safeEmployee,
    ...tokens,
  }
}
