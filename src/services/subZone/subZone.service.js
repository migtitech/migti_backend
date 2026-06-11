import mongoose from 'mongoose'
import {
  countSubZones,
  createSubZone,
  findSubZones,
  findSubZonesByZoneIds,
  findOneSubZoneLean,
  findSubZoneByIdAndUpdateLean,
  softDeleteSubZoneById,
} from '../../repository/subZone.repository.js'
import {
  findOneAreaLean,
  findAreasSelectFields,
} from '../../repository/area.repository.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'

/** Uppercase token from zone name for subZoneCode prefix (max 40 chars). */
export const tokenizeZoneName = (name) => {
  const raw = (name || '')
    .toString()
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
  const token = raw.slice(0, 40) || 'ZONE'
  return token
}

/** 0 -> A, 25 -> Z, 26 -> AA (Excel-style). */
const suffixFromIndex = (index) => {
  let n = index + 1
  let result = ''
  while (n > 0) {
    n -= 1
    result = String.fromCharCode(65 + (n % 26)) + result
    n = Math.floor(n / 26)
  }
  return result
}

const nextSubZoneCodeForZone = async (zoneId, baseToken) => {
  const total = await countSubZones({ zoneId })
  return `${baseToken}_${suffixFromIndex(total)}`
}

/**
 * Ensures subZone exists, is active, belongs to areaId, and area is visible under branchFilter.
 */
export const assertSubZoneBelongsToArea = async ({
  subZoneId,
  areaId,
  branchFilter = {},
}) => {
  if (!subZoneId || String(subZoneId).trim() === '') return
  if (!areaId || String(areaId).trim() === '') {
    throw new CustomError(
      statusCodes.badRequest,
      'Sub-zone requires a zone to be selected',
      errorCodes.bad_request
    )
  }
  const sub = await findOneSubZoneLean({
    _id: subZoneId,
    isDeleted: false,
  })
  if (!sub) {
    throw new CustomError(
      statusCodes.badRequest,
      'Invalid sub-zone',
      errorCodes.not_found
    )
  }
  if (String(sub.zoneId) !== String(areaId)) {
    throw new CustomError(
      statusCodes.badRequest,
      'Sub-zone does not belong to the selected zone',
      errorCodes.bad_request
    )
  }
  const areaFilter = Object.keys(branchFilter).length
    ? { _id: areaId, isDeleted: false, ...branchFilter }
    : { _id: areaId, isDeleted: false }
  const area = await findOneAreaLean(areaFilter)
  if (!area) {
    throw new CustomError(
      statusCodes.badRequest,
      'Zone not found for this branch',
      errorCodes.not_found
    )
  }
}

export const addSubZone = async ({ zoneId, name, branchFilter = {} }) => {
  const area = await findOneAreaLean({
    _id: zoneId,
    isDeleted: false,
    ...branchFilter,
  })
  if (!area) {
    throw new CustomError(
      statusCodes.notFound,
      'Zone not found',
      errorCodes.not_found
    )
  }

  const trimmed = (name || '').toString().trim()
  if (!trimmed) {
    throw new CustomError(
      statusCodes.badRequest,
      'Sub-zone name is required',
      errorCodes.bad_request
    )
  }

  const baseToken = tokenizeZoneName(area.name)
  const subZoneCode = await nextSubZoneCodeForZone(area._id, baseToken)

  const doc = await createSubZone({
    zoneId: area._id,
    name: trimmed,
    subZoneCode,
  })
  return doc.toObject()
}

export const listSubZones = async ({
  zoneId,
  pageNumber = 1,
  pageSize = 100,
  branchFilter = {},
}) => {
  if (!zoneId || !mongoose.Types.ObjectId.isValid(String(zoneId))) {
    throw new CustomError(
      statusCodes.badRequest,
      'zoneId is required',
      errorCodes.bad_request
    )
  }
  const area = await findOneAreaLean({
    _id: zoneId,
    isDeleted: false,
    ...branchFilter,
  })
  if (!area) {
    throw new CustomError(
      statusCodes.notFound,
      'Zone not found',
      errorCodes.not_found
    )
  }

  const page = Math.max(1, parseInt(pageNumber, 10))
  const limit = Math.min(100, Math.max(1, parseInt(pageSize, 10)))
  const skip = (page - 1) * limit

  const filter = { zoneId: area._id, isDeleted: false }
  const totalItems = await countSubZones(filter)
  const subZones = await findSubZones(filter, { skip, limit })

  const totalPages = Math.ceil(totalItems / limit) || 1

  return {
    subZones,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  }
}

/** All zones for branch + their sub-zones (for accordion UI). */
export const listSubZonesGroupedByBranch = async ({ branchFilter = {} }) => {
  const areas = await findAreasSelectFields({ isDeleted: false, ...branchFilter })

  if (!areas.length) {
    return { zones: [] }
  }

  const zoneIds = areas.map((a) => a._id)
  const allSubs = await findSubZonesByZoneIds(zoneIds)

  const byZone = allSubs.reduce((acc, s) => {
    const k = String(s.zoneId)
    if (!acc[k]) acc[k] = []
    acc[k].push(s)
    return acc
  }, {})

  const zones = areas.map((area) => ({
    ...area,
    subZones: byZone[String(area._id)] || [],
  }))

  return { zones }
}

export const updateSubZone = async ({ subZoneId, name, branchFilter = {} }) => {
  const sub = await findOneSubZoneLean({
    _id: subZoneId,
    isDeleted: false,
  })
  if (!sub) {
    throw new CustomError(
      statusCodes.notFound,
      'Sub-zone not found',
      errorCodes.not_found
    )
  }

  const area = await findOneAreaLean({
    _id: sub.zoneId,
    isDeleted: false,
    ...branchFilter,
  })
  if (!area) {
    throw new CustomError(
      statusCodes.notFound,
      'Sub-zone not found',
      errorCodes.not_found
    )
  }

  const trimmed = (name || '').toString().trim()
  if (!trimmed) {
    throw new CustomError(
      statusCodes.badRequest,
      'Sub-zone name is required',
      errorCodes.bad_request
    )
  }

  const updated = await findSubZoneByIdAndUpdateLean(subZoneId, {
    $set: { name: trimmed },
  })

  return updated
}

export const deleteSubZone = async ({ subZoneId, branchFilter = {} }) => {
  const sub = await findOneSubZoneLean({
    _id: subZoneId,
    isDeleted: false,
  })
  if (!sub) {
    throw new CustomError(
      statusCodes.notFound,
      'Sub-zone not found',
      errorCodes.not_found
    )
  }

  const area = await findOneAreaLean({
    _id: sub.zoneId,
    isDeleted: false,
    ...branchFilter,
  })
  if (!area) {
    throw new CustomError(
      statusCodes.notFound,
      'Sub-zone not found',
      errorCodes.not_found
    )
  }

  await softDeleteSubZoneById(subZoneId)

  return {
    deletedSubZone: {
      id: sub._id,
      subZoneCode: sub.subZoneCode,
      deletedAt: new Date().toISOString(),
    },
  }
}
