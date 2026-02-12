import Joi from 'joi'

export const uploadImagesSchema = Joi.object({
  productId: Joi.string().required(),
  imageType: Joi.string().valid('product', 'variant').optional().default('product'),
  variantCombinationUniqueId: Joi.string().optional().allow(null, ''),
})

export const deleteImageSchema = Joi.object({
  imageId: Joi.string().required(),
})
