import RateCardModel from '../models/rateCard.model.js'

export const findOneAndUpdateRateCardWithPopulate = (filter, updateData) =>
  RateCardModel.findOneAndUpdate(filter, updateData, {
    upsert: true,
    new: true,
  })
    .populate('product', 'name sku price')
    .populate('supplier', 'name shopname phone_1 email')
    .lean()

export const findRateCardsWithPopulate = (filter) =>
  RateCardModel.find(filter)
    .populate(
      'supplier',
      'name shopname phone_1 phone_2 email address shop_location'
    )
    .sort({ rate: 1 })
    .lean()

export const findRateCardsBySupplierWithPopulate = (filter) =>
  RateCardModel.find(filter)
    .populate('product', 'name sku price description')
    .sort({ createdAt: -1 })
    .lean()

export const findRateCardByIdLean = (id) => RateCardModel.findById(id).lean()

export const deleteRateCardById = (id) => RateCardModel.findByIdAndDelete(id)

export const findOneAndDeleteRateCard = (filter) =>
  RateCardModel.findOneAndDelete(filter)

export const findOneAndUpdateRateCard = (filter, updateData) =>
  RateCardModel.findOneAndUpdate(filter, updateData)
