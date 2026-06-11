import EmployeeModel from '../models/employee.model.js'

export const findEmployeeByEmailOrIdnumber = ({ email, idnumber }) =>
  EmployeeModel.findOne({ $or: [{ email }, { idnumber }] }).lean()

export const createEmployee = (data) => EmployeeModel.create(data)

export const countEmployees = (filter) => EmployeeModel.countDocuments(filter)

export const findEmployees = (filter, { skip, limit }) =>
  EmployeeModel.find(filter)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

export const findEmployeeById = (employeeId, branchFilter = {}) =>
  EmployeeModel.findOne({ _id: employeeId, ...branchFilter })
    .select('-password')
    .lean()

export const findEmployeeByIdRaw = (employeeId, branchFilter = {}) =>
  EmployeeModel.findOne({ _id: employeeId, ...branchFilter }).lean()

export const findEmployeeConflict = ({ employeeId, email, idnumber }) =>
  EmployeeModel.findOne({
    _id: { $ne: employeeId },
    $or: [
      ...(email ? [{ email }] : []),
      ...(idnumber ? [{ idnumber }] : []),
    ],
  }).lean()

export const updateEmployeeById = (employeeId, updateData) =>
  EmployeeModel.findByIdAndUpdate(employeeId, updateData, {
    new: true,
    runValidators: true,
  })
    .select('-password')
    .lean()

export const updateEmployeePasswordById = (employeeId, password) =>
  EmployeeModel.findByIdAndUpdate(employeeId, { password })

export const deleteEmployeeById = (employeeId) =>
  EmployeeModel.findByIdAndDelete(employeeId)

export const findEmployeeByEmailRegex = (emailRegex) =>
  EmployeeModel.findOne({ email: emailRegex }).lean()

export const findEmployeeByIdWithNameEmail = (performerId) =>
  EmployeeModel.findById(performerId).select('name email').lean()

export const findEmployeesByRoles = (filter) =>
  EmployeeModel.find(filter).select('_id').lean()

export const findEmployeeByIdAndBranch = (employeeId, branchId) =>
  EmployeeModel.findOne({
    _id: employeeId,
    branchId,
    isDeleted: false,
  }).lean()

export const findEmployeeByIdNotDeleted = (employeeId) =>
  EmployeeModel.findOne({
    _id: employeeId,
    isDeleted: false,
  }).lean()

export const findEmployeeByIdSelectId = (employeeId) =>
  EmployeeModel.findOne({
    _id: employeeId,
    isDeleted: false,
  })
    .select('_id')
    .lean()

export const findEmployeeTerritoryFields = (employeeId) =>
  EmployeeModel.findById(employeeId)
    .select('role zoneId zoneIds subZoneId branchId')
    .lean()

export const findEmployeesSelectIdByBranch = (filter) =>
  EmployeeModel.find(filter).select('_id').lean()

export const findEmployeesByZoneRoles = (filter) =>
  EmployeeModel.find(filter)
    .select('name email phone role zoneIds zoneId')
    .sort({ name: 1 })
    .lean()

export const findEmployeeSelectZoneFields = (filter) =>
  EmployeeModel.findOne(filter).select('zoneIds zoneId').lean()

export const findZoneEmployeesSelectId = (filter) =>
  EmployeeModel.find(filter).select('_id').lean()

export const findProcurementEmployeesByGroups = (filter) =>
  EmployeeModel.find(filter).select('_id').lean()

export const findZoneEmployeesByRole = (filter) =>
  EmployeeModel.find(filter).select('_id').lean()

export const findEmployeeZoneIdsLean = (filter) =>
  EmployeeModel.findOne(filter).select('zoneIds zoneId').lean()

export const aggregateEmployees = (pipeline) => EmployeeModel.aggregate(pipeline)

export const getEmployeeLocationCollectionName = () =>
  EmployeeModel.collection.name

const employeeRepository = {
  find: (filter) => EmployeeModel.find(filter),
  findOne: (filter) => EmployeeModel.findOne(filter),
  findById: (id) => EmployeeModel.findById(id),
}

export default employeeRepository
