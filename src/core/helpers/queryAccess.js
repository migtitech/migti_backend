import mongoose from 'mongoose'
import EmployeeModel from '../../models/employee.model.js'
import IndustryModel from '../../models/industry.model.js'
import QueryModel from '../../models/query.model.js'

const employeeHasAssignableZone = (zoneId) => {
  const zoneStr = asIdString(zoneId)
  return Boolean(zoneStr && mongoose.Types.ObjectId.isValid(zoneStr))
}

const asIdString = (value) => {
  if (value == null || value === '') return ''
  if (typeof value === 'object' && value._id != null) return String(value._id)
  return String(value)
}

/** No document matches — employee with zone but no matching industries. */
export const impossibleQueryMatch = () => ({ _id: { $in: [] } })

/**
 * Mongo match on Industry: `area` (zone) and optional exact `subZoneId`.
 * Returns null if zone is missing/invalid.
 */
export const buildIndustryTerritoryMongoFilterForEmployee = (zoneId, subZoneId) => {
  const zoneStr = asIdString(zoneId)
  if (!zoneStr || !mongoose.Types.ObjectId.isValid(zoneStr)) {
    return null
  }
  const out = {
    area: new mongoose.Types.ObjectId(zoneStr),
  }
  // Subzone is applied only when the employee has a valid subZoneId; zone-only employees see the whole zone.
  const subStr = asIdString(subZoneId)
  if (subStr && mongoose.Types.ObjectId.isValid(subStr)) {
    out.subZoneId = new mongoose.Types.ObjectId(subStr)
  }
  return out
}

/**
 * Industry (client) documents whose area/subzone match the employee's zone/subzone.
 * - Employee has a subzone: only industries with that exact subzone in that zone.
 * - Employee has zone only: all industries in that zone.
 */
export const fetchIndustryIdsMatchingSalesTerritory = async ({
  zoneId,
  subZoneId,
  branchFilter = {},
}) => {
  const territory = buildIndustryTerritoryMongoFilterForEmployee(zoneId, subZoneId)
  if (!territory) return []

  const rows = await IndustryModel.find({
    isDeleted: false,
    ...branchFilter,
    ...territory,
  })
    .select('_id')
    .lean()
  return (rows || []).map((r) => r._id)
}

/** Mongo filter: queries whose linked industry is in the allowed set. */
export const buildSalesQueryFilterFromIndustryIds = (industryIds = []) => {
  if (!industryIds.length) return impossibleQueryMatch()
  return { industry_id: { $in: industryIds } }
}

/**
 * Same zone/subzone rules as queries: merge into Industry `find` / `findOne` filters
 * (add `isDeleted` + `branchFilter` in the caller as usual).
 */
export const getEmployeeIndustryTerritoryFields = async ({ currentUserId, isFullAccessRole }) => {
  if (!currentUserId || isFullAccessRole) return null
  const emp = await EmployeeModel.findById(currentUserId).select('zoneId subZoneId').lean()
  if (!employeeHasAssignableZone(emp?.zoneId)) return null
  return buildIndustryTerritoryMongoFilterForEmployee(emp.zoneId, emp.subZoneId)
}

/**
 * Industry _ids in the user's territory (same branch), or null if user is not zone-scoped.
 */
export const getTerritoryIndustryIdsForUser = async ({
  currentUserId,
  isFullAccessRole,
  branchFilter = {},
}) => {
  if (!currentUserId || isFullAccessRole) return null
  const emp = await EmployeeModel.findById(currentUserId).select('zoneId subZoneId').lean()
  if (!employeeHasAssignableZone(emp?.zoneId)) return null
  return fetchIndustryIdsMatchingSalesTerritory({
    zoneId: emp.zoneId,
    subZoneId: emp.subZoneId,
    branchFilter,
  })
}

/**
 * Access filter merged into QueryModel queries (list, get, update, …).
 * - Full access: no restriction
 * - Employee has zoneId: queries whose linked industry matches that zone/subzone
 * - Otherwise (restricted, no zone): only queries they created
 */
export const resolveQueryAccessFilter = async ({
  currentUserId = null,
  isFullAccessRole = true,
  role = '',
  branchFilter = {},
}) => {
  if (!currentUserId || isFullAccessRole) return {}

  const emp = await EmployeeModel.findById(currentUserId).select('zoneId subZoneId').lean()

  if (employeeHasAssignableZone(emp?.zoneId)) {
    const industryIds = await fetchIndustryIdsMatchingSalesTerritory({
      zoneId: emp.zoneId,
      subZoneId: emp.subZoneId,
      branchFilter,
    })
    return buildSalesQueryFilterFromIndustryIds(industryIds)
  }

  return { created_by: currentUserId }
}

/**
 * Returns a lean query doc if the user may access it, else null.
 */
export const findVisibleQueryById = async ({
  queryId,
  branchFilter = {},
  currentUserId = null,
  isFullAccessRole = true,
  role = '',
  select = '_id',
}) => {
  const accessFilter = await resolveQueryAccessFilter({
    currentUserId,
    isFullAccessRole,
    role,
    branchFilter,
  })
  return QueryModel.findOne({
    _id: queryId,
    isDeleted: false,
    ...branchFilter,
    ...accessFilter,
  })
    .select(select)
    .lean()
}
