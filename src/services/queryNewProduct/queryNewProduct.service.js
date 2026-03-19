import QueryNewProductModel from '../../models/queryNewProduct.model.js'

export const addQueryNewProduct = async ({
  name,
  unit,
  hsnNumber,
  modelNumber,
  variants = [],
  images = [],
}) => {
  const doc = await QueryNewProductModel.create({
    name: name?.trim(),
    unit: unit?.trim() || '',
    hsnNumber: hsnNumber?.trim() || '',
    modelNumber: modelNumber?.trim() || '',
    variants: (variants || []).map((v) => (v || '').toString().trim()).filter(Boolean),
    images: (images || []).filter(Boolean),
  })

  return doc.toObject()
}

export const listQueryNewProducts = async ({
  pageNumber = 1,
  pageSize = 10,
  search = '',
}) => {
  const page = Math.max(1, parseInt(pageNumber, 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 10))
  const skip = (page - 1) * limit

  const filter = { isDeleted: false }

  if (search && search.trim()) {
    const term = search.trim()
    filter.$or = [
      { name: { $regex: term, $options: 'i' } },
      { unit: { $regex: term, $options: 'i' } },
      { hsnNumber: { $regex: term, $options: 'i' } },
      { modelNumber: { $regex: term, $options: 'i' } },
      { variants: { $regex: term, $options: 'i' } },
    ]
  }

  const totalItems = await QueryNewProductModel.countDocuments(filter)

  const items = await QueryNewProductModel.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('images', 'path')
    .lean()

  const totalPages = Math.ceil(totalItems / limit) || 1

  return {
    items,
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

export const getQueryNewProductById = async ({ productId }) => {
  const product = await QueryNewProductModel.findOne({ _id: productId, isDeleted: false })
    .populate('images', 'path')
    .lean()

  if (!product) {
    const err = new Error('Product not found')
    err.statusCode = 404
    throw err
  }

  return product
}

export const deleteQueryNewProduct = async ({ productId }) => {
  const product = await QueryNewProductModel.findOneAndUpdate(
    { _id: productId, isDeleted: false },
    { $set: { isDeleted: true } },
    { new: true },
  ).lean()

  if (!product) {
    const err = new Error('Product not found')
    err.statusCode = 404
    throw err
  }

  return { _id: product._id }
}

