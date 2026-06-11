import PasswordResetRequestModel from '../models/passwordResetRequest.model.js'

export const createPasswordResetRequest = async (data) => {
  return PasswordResetRequestModel.create(data)
}
