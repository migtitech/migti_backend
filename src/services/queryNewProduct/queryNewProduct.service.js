import mongoose from 'mongoose'
import QueryNewProductModel from '../../models/queryNewProduct.model.js'
import CategoryModel from '../../models/category.model.js'
import {
  getNextSequence,
  formatProductCodeValue,
  formatRitemsValue,
} from '../codeSequence/codeSequence.service.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'

const toOidOrNull = (id) => {
  if (id == null || id === '') return null
  if (!mongoose.Types.ObjectId.isValid(String(id))) return null
  return new mongoose.Types.ObjectId(String(id))
}

export const addQueryNewProduct = async ({
  name,
  description,
  unit,
  hsnNumber,
  modelNumber,
  qty: qtyIn,
  groupId,
  categoryId,
  subcategoryId,
  variants = [],
  images = [],
}) => {
  const gId = toOidOrNull(groupId)
  const cId = toOidOrNull(categoryId)
  const sId = toOidOrNull(subcategoryId)

  if (cId) {
    const cat = await CategoryModel.findById(cId).select('group parent').lean()
    if (!cat) {
      throw new CustomError(
        statusCodes.notFound,
        'Category not found',
        errorCodes.not_found
      )
    }
    if (cat.parent) {
      throw new CustomError(
        statusCodes.badRequest,
        'Invalid category: expected a top-level category',
        errorCodes.validation_error
      )
    }
    if (gId && String(cat.group || '') !== String(gId)) {
      throw new CustomError(
        statusCodes.badRequest,
        'Category does not belong to the selected group',
        errorCodes.validation_error
      )
    }
  }

  if (sId) {
    const sub = await CategoryModel.findById(sId).select('parent').lean()
    if (!sub) {
      throw new CustomError(
        statusCodes.notFound,
        'Subcategory not found',
        errorCodes.not_found
      )
    }
    if (!cId || String(sub.parent || '') !== String(cId)) {
      throw new CustomError(
        statusCodes.badRequest,
        'Invalid subcategory for the selected category',
        errorCodes.validation_error
      )
    }
  }

  let qty = 1
  if (qtyIn != null && qtyIn !== '') {
    const n = Number(qtyIn)
    if (Number.isFinite(n) && n >= 0) {
      qty = Number.isInteger(n) ? n : Math.max(0, Math.floor(n))
    }
  }

  const n = await getNextSequence('productCode')
  const rawProductCode = formatProductCodeValue(n)
  const rN = await getNextSequence('ritems')
  const query_tracking_code = formatRitemsValue(rN)

  const doc = await QueryNewProductModel.create({
    name: name?.trim(),
    description: description?.trim() || '',
    unit: unit?.trim() || '',
    hsnNumber: hsnNumber?.trim() || '',
    modelNumber: modelNumber?.trim() || '',
    qty,
    groupId: gId,
    categoryId: cId,
    subcategoryId: sId,
    rawProductCode,
    query_tracking_code,
    variants: (variants || [])
      .map((v) => (v || '').toString().trim())
      .filter(Boolean),
    images: (images || []).filter(Boolean),
  })

  return doc.toObject()
}

export const listQueryNewProducts = async ({
  pageNumber = 1,
  pageSize = 10,
  search = '',
  name: nameQuery = '',
  description: descQuery = '',
  hsnNumber: hsnQuery = '',
  status: statusQuery = '',
}) => {
  const page = Math.max(1, parseInt(pageNumber, 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 10))
  const skip = (page - 1) * limit

  const filter = { isDeleted: false }
  const andParts = []

  if (search && String(search).trim()) {
    const term = String(search).trim()
    andParts.push({
      $or: [
        { name: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
        { unit: { $regex: term, $options: 'i' } },
        { hsnNumber: { $regex: term, $options: 'i' } },
        { modelNumber: { $regex: term, $options: 'i' } },
        { rawProductCode: { $regex: term, $options: 'i' } },
        { query_tracking_code: { $regex: term, $options: 'i' } },
        { variants: { $regex: term, $options: 'i' } },
      ],
    })
  }

  if (nameQuery && String(nameQuery).trim()) {
    andParts.push({
      name: { $regex: String(nameQuery).trim(), $options: 'i' },
    })
  }
  if (descQuery && String(descQuery).trim()) {
    andParts.push({
      description: { $regex: String(descQuery).trim(), $options: 'i' },
    })
  }
  if (hsnQuery && String(hsnQuery).trim()) {
    andParts.push({
      hsnNumber: { $regex: String(hsnQuery).trim(), $options: 'i' },
    })
  }

  if (statusQuery && String(statusQuery).trim()) {
    filter.status = String(statusQuery).trim()
  }

  if (andParts.length === 1) {
    Object.assign(filter, andParts[0])
  } else if (andParts.length > 1) {
    filter.$and = andParts
  }

  const totalItems = await QueryNewProductModel.countDocuments(filter)

  const items = await QueryNewProductModel.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('images', 'path')
    .populate('groupId', 'name code')
    .populate('categoryId', 'name categoryCode')
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
  const product = await QueryNewProductModel.findOne({
    _id: productId,
    isDeleted: false,
  })
    .populate('images', 'path')
    .populate('groupId', 'name code')
    .populate('categoryId', 'name categoryCode')
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
    { new: true }
  ).lean()

  if (!product) {
    const err = new Error('Product not found')
    err.statusCode = 404
    throw err
  }

  return { _id: product._id }
}
