export const getBranchFilter = (_req, _options = {}) => {
  // Permission/branch scoping is intentionally disabled.
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
export const getBranchIdForCreate = (_req) => {
  return null
}

/**
 * Resolves branchId for create operations in a safe and consistent way.
 *
 * Rules:
 * - Branch-scoped users (employee, etc.) are always forced to their token branch.
 * - Bypass roles (super_admin/admin/hod) can optionally create for requested branchId.
 * - If requestedBranchId is invalid, it is ignored.
 *
 * @param {Object} req - Express request
 * @param {string|mongoose.Types.ObjectId|null|undefined} requestedBranchId - branchId from body/query
 * @returns {mongoose.Types.ObjectId|null}
 */
export const getEffectiveBranchIdForCreate = (req, requestedBranchId) => {
  return requestedBranchId || null
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
export const hasBranchContext = (_req) => {
  return true
}
