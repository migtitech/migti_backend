import EmployeeModel from '../../models/employee.model.js'
import PasswordResetRequestModel from '../../models/passwordResetRequest.model.js'
import { assertSubZoneBelongsToArea } from '../subZone/subZone.service.js'
import CustomError from '../../utils/exception.js'
import {
  statusCodes,
  errorCodes,
  MODULES,
  ACTIONS,
} from '../../core/common/constant.js'
import { decrypt, encrypt } from '../../core/crypto/helper.cryto.js'
import { createTokenPair } from '../../core/helpers/jwt.helper.js'

const nullIfEmpty = (v) => (v === '' || v == null ? null : v)
const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key)
const asIdString = (value) => {
  if (value == null || value === '') return ''
  if (typeof value === 'object' && value._id != null) return String(value._id)
  return String(value)
}
const normalizeZoneIds = (zoneIds = [], legacyZoneId = null) => {
  const out = []
  if (Array.isArray(zoneIds)) {
    for (const zid of zoneIds) {
      const v = asIdString(zid).trim()
      if (v && !out.includes(v)) out.push(v)
    }
  }
  if (!out.length) {
    const legacy = asIdString(legacyZoneId).trim()
    if (legacy) out.push(legacy)
  }
  return out
}
const withNormalizedZones = (employee = {}) => {
  const zoneIds = normalizeZoneIds(employee.zoneIds, employee.zoneId)
  return {
    ...employee,
    zoneIds,
  }
}

const normalizeAssignedGroups = (arr = []) => {
  const out = []
  if (!Array.isArray(arr)) {
    return out
  }
  for (const id of arr) {
    const v = asIdString(id).trim()
    if (v && /^[a-fA-F0-9]{24}$/i.test(v) && !out.includes(v)) {
      out.push(v)
    }
  }
  return out
}

const SUB_ZONE_PERM_PREFIX = `${MODULES.SUB_ZONES}:`
const SUB_ZONE_READ_PERM = `${MODULES.SUB_ZONES}:${ACTIONS.READ}`
const SUB_ZONE_CREATE_PERM = `${MODULES.SUB_ZONES}:${ACTIONS.CREATE}`

/**
 * When an employee has a sub-zone assignment, ensure read + create (for inline sub-zone flows);
 * when cleared, strip all sub_zones:* perms.
 */
const syncPermissionsWithSubZoneAssignment = (permissions = [], subZoneId) => {
  const arr = [...(Array.isArray(permissions) ? permissions : [])]
    .map(String)
    .filter(Boolean)
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

  rest.zoneIds = normalizeZoneIds(rest.zoneIds, rest.zoneId)
  delete rest.zoneId
  rest.subZoneId = nullIfEmpty(rest.subZoneId)
  if (rest.zoneIds.length !== 1) {
    rest.subZoneId = null
  }
  const branchFilter = rest.branchId ? { branchId: rest.branchId } : {}
  if (rest.zoneIds.length === 1) {
    await assertSubZoneBelongsToArea({
      subZoneId: rest.subZoneId,
      areaId: rest.zoneIds[0],
      branchFilter,
    })
  }

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
      accountNumber:
        typeof rest.bankDetails.accountNumber === 'string'
          ? rest.bankDetails.accountNumber
          : '',
      ifscCode:
        typeof rest.bankDetails.ifscCode === 'string'
          ? rest.bankDetails.ifscCode
          : '',
      bankName:
        typeof rest.bankDetails.bankName === 'string'
          ? rest.bankDetails.bankName
          : '',
      accountHolderName:
        typeof rest.bankDetails.accountHolderName === 'string'
          ? rest.bankDetails.accountHolderName
          : '',
      upiDetails:
        typeof rest.bankDetails.upiDetails === 'string'
          ? rest.bankDetails.upiDetails
          : '',
    }
  }

  rest.permissions = syncPermissionsWithSubZoneAssignment(
    rest.permissions || [],
    rest.subZoneId
  )

  if (rest.assigned_groups !== undefined) {
    rest.assigned_groups = normalizeAssignedGroups(rest.assigned_groups)
  } else {
    rest.assigned_groups = []
  }

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

  const employee = withNormalizedZones(employeeDoc.toObject())
  delete employee.password
  return employee
}

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** OR conditions on `role` from comma-separated keywords (see listEmployeeSchema). */
const roleConditionsFromKeywords = (roleKeywordsCsv) => {
  const parts = String(roleKeywordsCsv || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (!parts.length) return null
  const or = []
  for (const part of parts) {
    const lower = part.toLowerCase()
    if (lower === 'hod') {
      or.push({ role: /^head_of_department$/i })
      or.push({ role: /^hod$/i })
    } else {
      or.push({ role: new RegExp(escapeRegex(part), 'i') })
    }
  }
  return or.length ? { $or: or } : null
}

export const listEmployees = async ({
  pageNumber = 1,
  pageSize = 10,
  branchId,
  branchFilter = {},
  search = '',
  role = '',
  rolePrefix = '',
  roleKeywords = '',
}) => {
  const page = Math.max(1, parseInt(pageNumber))
  const limit = Math.min(100, Math.max(1, parseInt(pageSize)))
  const skip = (page - 1) * limit

  const filter = { ...branchFilter }
  if (Object.keys(filter).length === 0 && branchId) filter.branchId = branchId

  const andConditions = []

  const searchTerm = String(search || '').trim()
  if (searchTerm) {
    const escaped = escapeRegex(searchTerm)
    andConditions.push({
      $or: [
        { name: new RegExp(escaped, 'i') },
        { email: new RegExp(escaped, 'i') },
      ],
    })
  }

  const roleExact = String(role || '').trim()
  if (roleExact) {
    filter.role = new RegExp(`^${escapeRegex(roleExact)}$`, 'i')
  } else {
    const rk = String(roleKeywords || '').trim()
    const roleOr = rk ? roleConditionsFromKeywords(rk) : null
    if (roleOr) {
      andConditions.push(roleOr)
    } else {
      const rp = String(rolePrefix || '').trim()
      if (rp) {
        filter.role = new RegExp(`^${escapeRegex(rp)}`, 'i')
      }
    }
  }

  if (andConditions.length === 1) {
    Object.assign(filter, andConditions[0])
  } else if (andConditions.length > 1) {
    filter.$and = andConditions
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
    employees: (employees || []).map(withNormalizedZones),
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
  const employee = await EmployeeModel.findOne({
    _id: employeeId,
    ...branchFilter,
  })
    .select('-password')
    .lean()

  if (!employee) {
    throw new CustomError(
      statusCodes.notFound,
      'Employee not found',
      errorCodes.not_found
    )
  }

  return withNormalizedZones(employee)
}

export const updateEmployee = async ({
  employeeId,
  branchFilter = {},
  ...updateData
}) => {
  const employee = await EmployeeModel.findOne({
    _id: employeeId,
    ...branchFilter,
  }).lean()
  if (!employee) {
    throw new CustomError(
      statusCodes.notFound,
      'Employee not found',
      errorCodes.not_found
    )
  }

  const hasZoneIds = hasOwn(updateData, 'zoneIds')
  const hasLegacyZoneId = hasOwn(updateData, 'zoneId')
  const zonesTouched = hasZoneIds || hasLegacyZoneId
  if (zonesTouched) {
    updateData.zoneIds = normalizeZoneIds(
      hasZoneIds ? updateData.zoneIds : [],
      hasLegacyZoneId ? nullIfEmpty(updateData.zoneId) : null
    )
  }
  delete updateData.zoneId
  if (Object.prototype.hasOwnProperty.call(updateData, 'subZoneId')) {
    updateData.subZoneId = nullIfEmpty(updateData.subZoneId)
  }
  if (zonesTouched && updateData.zoneIds.length !== 1) {
    updateData.subZoneId = null
  }

  const effZoneIds = zonesTouched
    ? updateData.zoneIds
    : normalizeZoneIds(employee.zoneIds, employee.zoneId)
  const effSub = Object.prototype.hasOwnProperty.call(updateData, 'subZoneId')
    ? updateData.subZoneId
    : employee.subZoneId
  const effBranchId = Object.prototype.hasOwnProperty.call(
    updateData,
    'branchId'
  )
    ? updateData.branchId
    : employee.branchId
  const areaBranchFilter = effBranchId ? { branchId: effBranchId } : {}
  if (effZoneIds.length !== 1) {
    updateData.subZoneId = null
  } else {
    await assertSubZoneBelongsToArea({
      subZoneId: effSub,
      areaId: effZoneIds[0],
      branchFilter: areaBranchFilter,
    })
  }

  if (updateData.password) {
    updateData.password = encrypt(updateData.password)
  } else {
    delete updateData.password
  }

  // Normalize optional company contact fields on update
  if (
    Object.prototype.hasOwnProperty.call(updateData, 'companyEmail') &&
    updateData.companyEmail == null
  ) {
    updateData.companyEmail = ''
  }
  if (
    Object.prototype.hasOwnProperty.call(updateData, 'companyPhone') &&
    updateData.companyPhone == null
  ) {
    updateData.companyPhone = ''
  }

  // Normalize optional bank details to strings on update as well
  if (updateData.bankDetails) {
    updateData.bankDetails = {
      accountNumber:
        typeof updateData.bankDetails.accountNumber === 'string'
          ? updateData.bankDetails.accountNumber
          : '',
      ifscCode:
        typeof updateData.bankDetails.ifscCode === 'string'
          ? updateData.bankDetails.ifscCode
          : '',
      bankName:
        typeof updateData.bankDetails.bankName === 'string'
          ? updateData.bankDetails.bankName
          : '',
      accountHolderName:
        typeof updateData.bankDetails.accountHolderName === 'string'
          ? updateData.bankDetails.accountHolderName
          : '',
      upiDetails:
        typeof updateData.bankDetails.upiDetails === 'string'
          ? updateData.bankDetails.upiDetails
          : '',
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
      ? [
          ...(Array.isArray(updateData.permissions)
            ? updateData.permissions
            : []),
        ]
      : [...(employee.permissions || [])]
  updateData.permissions = syncPermissionsWithSubZoneAssignment(
    basePermissions,
    effSub
  )

  if (Object.prototype.hasOwnProperty.call(updateData, 'assigned_groups')) {
    updateData.assigned_groups = normalizeAssignedGroups(
      updateData.assigned_groups
    )
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

  return withNormalizedZones(updatedEmployee)
}

export const updateEmployeePassword = async ({
  employeeId,
  newPassword,
  branchFilter = {},
}) => {
  const employee = await EmployeeModel.findOne({
    _id: employeeId,
    ...branchFilter,
  }).lean()
  if (!employee) {
    throw new CustomError(
      statusCodes.notFound,
      'Employee not found',
      errorCodes.not_found
    )
  }

  await EmployeeModel.findByIdAndUpdate(employeeId, {
    password: encrypt(newPassword),
  })

  return { updated: true }
}

export const deleteEmployee = async ({ employeeId, branchFilter = {} }) => {
  const employee = await EmployeeModel.findOne({
    _id: employeeId,
    ...branchFilter,
  }).lean()
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
  const emailTrimmed = String(email || '').trim()
  const emailRegex = new RegExp(`^${escapeRegex(emailTrimmed)}$`, 'i')
  const employee = await EmployeeModel.findOne({ email: emailRegex }).lean()
  if (!employee) {
    throw new CustomError(
      statusCodes.notFound,
      'Email not found. Please check and try again.',
      errorCodes.not_found
    )
  }
  if (role && employee.role !== role) {
    throw new CustomError(
      statusCodes.notFound,
      'Email not found. Please check and try again.',
      errorCodes.not_found
    )
  }

  const decryptedPassword = decrypt(employee.password)
  if (password !== decryptedPassword) {
    throw new CustomError(
      statusCodes.unauthorized,
      'Incorrect password. Please try again.',
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
  safeEmployee.zoneIds = normalizeZoneIds(
    safeEmployee.zoneIds,
    safeEmployee.zoneId
  )
  delete safeEmployee.password

  return {
    employee: safeEmployee,
    ...tokens,
  }
}

export const createPasswordResetRequest = async ({ email, role, message }) => {
  const emailTrimmed = String(email || '').trim()
  const emailRegex = new RegExp(`^${escapeRegex(emailTrimmed)}$`, 'i')
  const employee = await EmployeeModel.findOne({ email: emailRegex }).lean()
  if (!employee || employee.role !== role) {
    throw new CustomError(
      statusCodes.notFound,
      'Email not found. Please check and try again.',
      errorCodes.not_found
    )
  }

  const created = await PasswordResetRequestModel.create({
    userId: employee._id,
    message: String(message || '').trim(),
    email: String(employee.email || '')
      .trim()
      .toLowerCase(),
    role: employee.role,
  })

  return {
    requestId: created._id,
    userId: employee._id,
  }
}
