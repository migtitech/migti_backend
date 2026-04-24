import QueryModel from '../../models/query.model.js'
import IndustryModel from '../../models/industry.model.js'
import EmployeeModel from '../../models/employee.model.js'

const normalizeRole = (role) =>
  String(role || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')

const isSalesRole = (role) => normalizeRole(role).startsWith('sales')

const toObjectId = (value) => {
  if (!value) return null
  if (typeof value === 'object' && value._id) return value._id
  return value
}

const resolveEmployeeZoneIds = (employee = {}) => {
  const zoneIds = Array.isArray(employee.zoneIds) ? employee.zoneIds : []
  const normalizedZoneIds = zoneIds.map(toObjectId).filter(Boolean)
  if (normalizedZoneIds.length > 0) return normalizedZoneIds
  const legacyZoneId = toObjectId(employee.zoneId)
  return legacyZoneId ? [legacyZoneId] : []
}

/** No document matches — employee with zone but no matching industries. */
export const impossibleQueryMatch = () => ({ _id: { $in: [] } })

/**
 * Mongo match on Industry: `area` in employee zones and optional exact sub-zone.
 * Returns null when there are no valid zones.
 */
export const buildIndustryTerritoryMongoFilterForEmployee = (
  _zoneIds = [],
  _subZoneId = null
) => {
  const zoneIds = (Array.isArray(_zoneIds) ? _zoneIds : [])
    .map(toObjectId)
    .filter(Boolean)
  if (!zoneIds.length) return null
  const filter = { area: { $in: zoneIds } }
  const subZoneId = toObjectId(_subZoneId)
  if (subZoneId) filter.subZoneId = subZoneId
  return filter
}

/**
 * Industry (client) documents whose area/subzone match the employee's zone/subzone.
 * - Employee has a subzone: only industries with that exact subzone in that zone.
 * - Employee has zone only: all industries in that zone.
 */
export const fetchIndustryIdsMatchingSalesTerritory = async ({
  zoneIds: _zoneIds,
  subZoneId: _subZoneId,
  branchFilter: _branchFilter = {},
}) => {
  const territoryFilter = buildIndustryTerritoryMongoFilterForEmployee(
    _zoneIds,
    _subZoneId
  )
  if (!territoryFilter) return []
  const rows = await IndustryModel.find({
    isDeleted: false,
    ..._branchFilter,
    ...territoryFilter,
  })
    .select('_id')
    .lean()
  return rows.map((row) => row._id).filter(Boolean)
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
export const getEmployeeIndustryTerritoryFields = async ({
  currentUserId: _currentUserId,
  isFullAccessRole: _isFullAccessRole,
}) => {
  if (_isFullAccessRole || !_currentUserId) return null
  const employee = await EmployeeModel.findOne({
    _id: _currentUserId,
    isDeleted: false,
  })
    .select('role zoneIds zoneId subZoneId')
    .lean()
  if (!employee || !isSalesRole(employee.role)) return null
  const zoneIds = resolveEmployeeZoneIds(employee)
  const territoryFilter = buildIndustryTerritoryMongoFilterForEmployee(
    zoneIds,
    employee.subZoneId || null
  )
  if (!territoryFilter) return { _id: { $in: [] } }
  return territoryFilter
}

/**
 * Industry _ids in the user's territory (same branch), or null if user is not zone-scoped.
 */
export const getTerritoryIndustryIdsForUser = async ({
  currentUserId: _currentUserId,
  isFullAccessRole: _isFullAccessRole,
  branchFilter: _branchFilter = {},
}) => {
  if (_isFullAccessRole || !_currentUserId) return null
  const employee = await EmployeeModel.findOne({
    _id: _currentUserId,
    isDeleted: false,
  })
    .select('role zoneIds zoneId subZoneId')
    .lean()
  if (!employee || !isSalesRole(employee.role)) return null
  const zoneIds = resolveEmployeeZoneIds(employee)
  return fetchIndustryIdsMatchingSalesTerritory({
    zoneIds,
    subZoneId: employee.subZoneId || null,
    branchFilter: _branchFilter,
  })
}

/**
 * Access filter merged into QueryModel queries (list, get, update, …).
 * - Full access: no restriction
 * - Employee has zoneId: queries whose linked industry matches that zone/subzone
 * - Otherwise (restricted, no zone): only queries they created
 */
export const resolveQueryAccessFilter = async ({
  currentUserId: _currentUserId = null,
  isFullAccessRole: _isFullAccessRole = true,
  role: _role = '',
  branchFilter: _branchFilter = {},
}) => {
  if (_isFullAccessRole || !_currentUserId) return {}
  if (!isSalesRole(_role)) return {}
  const industryIds = await getTerritoryIndustryIdsForUser({
    currentUserId: _currentUserId,
    isFullAccessRole: _isFullAccessRole,
    branchFilter: _branchFilter,
  })
  if (industryIds == null) return {}
  return buildSalesQueryFilterFromIndustryIds(industryIds)
}

/**
 * Returns a lean query doc if the user may access it, else null.
 */
export const findVisibleQueryById = async ({
  queryId,
  branchFilter = {},
  currentUserId: _currentUserId = null,
  isFullAccessRole: _isFullAccessRole = true,
  role: _role = '',
  select = '_id',
}) => {
  return QueryModel.findOne({
    _id: queryId,
    isDeleted: false,
    ...branchFilter,
  })
    .select(select)
    .lean()
}
