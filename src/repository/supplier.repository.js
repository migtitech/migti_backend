import SupplierModel from '../models/supplier.model.js'

export const createSupplier = (data) => SupplierModel.create(data)

export const countSuppliers = (filter) => SupplierModel.countDocuments(filter)

export const findSuppliersWithPopulate = (filter, { skip, limit }) =>
  SupplierModel.find(filter)
    .populate('categories', 'name slug')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

export const findSuppliersSelectFields = (filter, { sort, limit }) =>
  SupplierModel.find(filter)
    .select(
      'name shopname email phone_1 phone_2 other_contact label shop_location'
    )
    .sort(sort)
    .limit(limit)
    .lean()

export const findOneSupplierWithPopulate = (filter) =>
  SupplierModel.findOne(filter).populate('categories', 'name slug').lean()

export const findOneSupplierLean = (filter) =>
  SupplierModel.findOne(filter).lean()

export const findSupplierByIdAndUpdateWithPopulate = (id, updateData) =>
  SupplierModel.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  })
    .populate('categories', 'name slug')
    .lean()

export const deleteSupplierById = (id) => SupplierModel.findByIdAndDelete(id)

export const findSupplierById = (id) => SupplierModel.findById(id)

export const findSupplierByIdSelectFields = (id, select) =>
  SupplierModel.findById(id).select(select).lean()

export const searchSuppliers = (filter, { sort, limit }) =>
  SupplierModel.find(filter)
    .select('name shopname phone_1 email shop_location')
    .sort(sort)
    .limit(limit)
    .lean()
