import Joi from 'joi'

const objectIdPattern = /^[0-9a-fA-F]{24}$/

export const appendPoPaymentLedgerSchema = Joi.object({
  purchaseOrderId: Joi.string().pattern(objectIdPattern).required().messages({
    'string.pattern.base': 'purchaseOrderId must be a valid Mongo ObjectId',
  }),
  amount: Joi.number().positive().required(),
  paidAt: Joi.date().optional().allow(null),
  remark: Joi.string().allow('').optional().default(''),
  paymentProofDocumentId: Joi.string()
    .pattern(objectIdPattern)
    .allow('', null)
    .optional()
    .default(null)
    .messages({
      'string.pattern.base':
        'paymentProofDocumentId must be a valid Mongo ObjectId',
    }),
})
