import QueryNewProductModel from '../models/queryNewProduct.model.js'

export const createQueryNewProduct = (doc) => QueryNewProductModel.create(doc)

export const countQueryNewProducts = (filter) =>
  QueryNewProductModel.countDocuments(filter)

export const findQueryNewProducts = (filter, skip, limit) =>
  QueryNewProductModel.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('images', 'path')
    .populate('groupId', 'name code')
    .populate('categoryId', 'name categoryCode')
    .lean()

export const findQueryNewProductById = (productId) =>
  QueryNewProductModel.findOne({
    _id: productId,
    isDeleted: false,
  })
    .populate('images', 'path')
    .populate('groupId', 'name code')
    .populate('categoryId', 'name categoryCode')
    .lean()

export const softDeleteQueryNewProductById = (productId) =>
  QueryNewProductModel.findOneAndUpdate(
    { _id: productId, isDeleted: false },
    { $set: { isDeleted: true } },
    { new: true }
  ).lean()
