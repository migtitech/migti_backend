import mongoose from 'mongoose'
import { BRANCH_BYPASS_ROLES } from '../common/constant.js'

/**
 * Returns a MongoDB filter object for branch-scoped data.
 * Use this in list/get/update/delete for any model that has branchId.
 *
 * - If user has branchId in token (employee, hod, etc.): returns { branchId: user.branchId }
 * - If user is super_admin or admin (no branchId): returns {} so they see all data
 * - Optional: for bypass roles, req.query.branchId can be used to filter by a specific branch
 *
 * @param {Object} req - Express request (must have req.user set by authenticateToken)
 * @param {Object} [options] - { allowQueryBranchId: boolean } - if true, full-access roles can use ?branchId= to filter
 * @returns {Object} Filter to merge with existing query filter (e.g. Object.assign(filter, getBranchFilter(req)))
 */
export const getBranchFilter = (req, options = {}) => {
  if (!req?.user) return {}

  const { allowQueryBranchId = false } = options
  const role = req.user.role
  const userBranchId = req.user.branchId || req.branchId

  // Full-access roles without branchId see all branches
  if (Array.from(BRANCH_BYPASS_ROLES).includes(role) && !userBranchId) {
    if (allowQueryBranchId && req.query?.branchId) {
      const qBranchId = req.query.branchId
      if (qBranchId && mongoose.Types.ObjectId.isValid(qBranchId)) {
        return { branchId: new mongoose.Types.ObjectId(qBranchId) }
      }
    }
    return {}
  }

  // User has a branch (employee, hod, or branch-scoped admin): restrict to that branch
  if (userBranchId) {
    const branchId = typeof userBranchId === 'string' && mongoose.Types.ObjectId.isValid(userBranchId)
      ? new mongoose.Types.ObjectId(userBranchId)
      : userBranchId
    return { branchId }
  }

  return {}
}

/**
 * Returns the branchId that should be set on new documents (create).
 * For branch-scoped users returns their branchId; for super_admin/admin returns null
 * (caller may then require branchId for the resource and throw 403).
 *
 * @param {Object} req - Express request
 * @returns {mongoose.Types.ObjectId|null}
 */
export const getBranchIdForCreate = (req) => {
  if (!req?.user) return null
  const userBranchId = req.user.branchId || req.branchId
  if (!userBranchId) return null
  if (typeof userBranchId === 'string' && mongoose.Types.ObjectId.isValid(userBranchId)) {
    return new mongoose.Types.ObjectId(userBranchId)
  }
  return userBranchId
}

/**
 * Ensures the request has a branch context when the route requires it.
 * Use for routes where only branch-scoped users can create (e.g. queries).
 * Super_admin/admin may still be allowed to create but must pass branchId in body/query if we require it;
 * here we require branch-scoped users to have branchId from token.
 *
 * @param {Object} req
 * @returns {boolean} true if branch is available or user can bypass
 */
export const hasBranchContext = (req) => {
  if (!req?.user) return false
  if (Array.from(BRANCH_BYPASS_ROLES).includes(req.user.role)) return true
  return !!(req.user.branchId || req.branchId)
}
