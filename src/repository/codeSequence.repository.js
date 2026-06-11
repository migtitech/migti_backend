import CodeSequenceModel from '../models/codeSequence.model.js'

export const createCodeSequence = async (data) => {
  return CodeSequenceModel.create(data)
}

export const updateCodeSequenceFieldIfMissing = async (
  codeSequenceId,
  codeType,
  initialValue
) => {
  return CodeSequenceModel.updateOne(
    { _id: codeSequenceId, [codeType]: { $exists: false } },
    { $set: { [codeType]: initialValue } }
  )
}

export const incrementCodeSequence = async (codeSequenceId, codeType) => {
  return CodeSequenceModel.findByIdAndUpdate(
    codeSequenceId,
    { $inc: { [codeType]: 1 } },
    { new: true }
  ).lean()
}
