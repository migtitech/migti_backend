import BrandModel from '../models/brand.model.js'

export const findBrandBySlug = (slug) => BrandModel.findOne({ slug })

export const findBrandBySlugExcludingId = (slug, brandId) =>
  BrandModel.findOne({ slug, _id: { $ne: brandId } })

export const findActiveBrandByName = (name) =>
  BrandModel.findOne({ name, isDeleted: false }).lean()

export const createBrand = (data) => BrandModel.create(data)

export const countBrands = (filter) => BrandModel.countDocuments(filter)

export const findBrands = (filter, { skip, limit }) =>
  BrandModel.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

export const findBrandById = (brandId) => BrandModel.findById(brandId).lean()

export const findBrandByIdLean = (id) => BrandModel.findById(id).lean()

export const updateBrandById = (brandId, updateData) =>
  BrandModel.findByIdAndUpdate(brandId, updateData, {
    new: true,
    runValidators: true,
  }).lean()

export const deleteBrandById = (brandId) => BrandModel.findByIdAndDelete(brandId)
