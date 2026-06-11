import AuditLogModel from '../models/auditLog.model.js'

export const createAuditLog = async (data) => {
  return AuditLogModel.create(data)
}
