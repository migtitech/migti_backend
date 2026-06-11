import GroupModel from '../models/group.model.js'

export { GroupModel }

export const findOneGroupLean = (filter) => GroupModel.findOne(filter).lean()

export const createGroup = (data) => GroupModel.create(data)

export const countGroups = (filter) => GroupModel.countDocuments(filter)

export const findGroups = (filter, { skip, limit }) =>
  GroupModel.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

export const findGroupByIdLean = (groupId) => GroupModel.findById(groupId).lean()

export const findGroupByIdAndUpdateLean = (groupId, updateData) =>
  GroupModel.findByIdAndUpdate(groupId, updateData, {
    new: true,
    runValidators: true,
  }).lean()

export const deleteGroupById = (groupId) => GroupModel.findByIdAndDelete(groupId)

const groupRepository = {
  findById: (id) => GroupModel.findById(id),
}

export default groupRepository
