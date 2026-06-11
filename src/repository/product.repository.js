import ProductModel from '../models/product.model.js'

export { ProductModel }

export const findOneProduct = (filter) => ProductModel.findOne(filter)

export const findOneProductLean = (filter) =>
  ProductModel.findOne(filter).lean()

export const findProductByIdLean = (productId) =>
  ProductModel.findById(productId).lean()

export const findProductById = (productId) => ProductModel.findById(productId)

export const findProductByIdSelectFields = (productId, select) =>
  ProductModel.findById(productId).select(select).lean()

export const createProduct = (data) => ProductModel.create(data)

export const countProducts = (filter) => ProductModel.countDocuments(filter)

export const countProductsByBrand = (brandId) =>
  ProductModel.countDocuments({ brand: brandId, isDeleted: false })

export const findProductsWithListPopulate = (filter, { sort, skip, limit }) =>
  ProductModel.find(filter)
    .populate('category', 'name slug')
    .populate('subcategory', 'name slug')
    .populate('brand', 'name slug logo')
    .populate('images', 'path')
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean()

export const findProductByIdWithDetailPopulate = (productId) =>
  ProductModel.findById(productId)
    .populate('category', 'name slug')
    .populate('subcategory', 'name slug')
    .populate('brand', 'name slug logo')
    .populate('group', 'name code')
    .populate('companyProductCodes.industry', 'name location')
    .populate('images', 'path')
    .populate({
      path: 'variantCombinations.images',
      model: 'document',
      select: 'path',
    })
    .lean()

export const findProductByIdAndUpdateWithPopulate = (productId, updateData) =>
  ProductModel.findByIdAndUpdate(productId, updateData, {
    new: true,
    runValidators: true,
  })
    .populate('category', 'name slug')
    .populate('subcategory', 'name slug')
    .populate('brand', 'name slug logo')
    .populate('group', 'name code')
    .populate('companyProductCodes.industry', 'name location')
    .lean()

export const deleteProductById = (productId) =>
  ProductModel.findByIdAndDelete(productId)

export const searchProducts = (filter, { sort, limit }) =>
  ProductModel.find(filter)
    .select('name sku price')
    .sort(sort)
    .limit(limit)
    .lean()

export const findProductsByIdsSelectProductCode = (ids) =>
  ProductModel.find({ _id: { $in: ids } }).select('productCode').lean()

export const findProductsByProductCodes = (productCodes) =>
  ProductModel.find({
    productCode: { $in: productCodes },
    isDeleted: false,
  })
    .select('_id productCode')
    .lean()

export const createProductFromQueryLine = (data) => {
  const doc = new ProductModel(data)
  return doc.save({ validateBeforeSave: false })
}

const productRepository = {
  find: (filter) => ProductModel.find(filter),
  findById: (id) => ProductModel.findById(id),
}

export default productRepository
