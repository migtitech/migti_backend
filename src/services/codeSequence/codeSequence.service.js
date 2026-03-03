import CodeSequenceModel, { CODE_SEQUENCE_ID } from '../../models/codeSequence.model.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'

const INITIAL_VALUE = 999

/** Default formatters: numeric value (from 1000) to display code */
const DEFAULT_FORMATTERS = {
  companyCode: (n) => `COM${n}`,
  branchCode: (n) => `BR${n}`,
  zoneCode: (n) => `ZON${n}`,
  groupCode: (n) => `GRP${n}`,
  categoryCode: (n) => `CAT${n}`,
  productCode: (n) => `mig${n}`,
  queryCode: (n) => `QRY0${n}`,
  quotationCode: (n) => `QUO0${n}`,
}

/** Initial values for upsert so first generated code is 1000 */
const SET_ON_INSERT = {
  companyCode: INITIAL_VALUE,
  branchCode: INITIAL_VALUE,
  zoneCode: INITIAL_VALUE,
  groupCode: INITIAL_VALUE,
  categoryCode: INITIAL_VALUE,
  productCode: INITIAL_VALUE,
  queryCode: INITIAL_VALUE,
  quotationCode: INITIAL_VALUE,
}

const MAX_ATTEMPTS = 10000

/**
 * Atomically increment the sequence for codeType and return the new value.
 * Ensures the code_sequence document exists (create with 999 if missing, then $inc only to avoid MongoDB conflict).
 * @param {string} codeType - One of: companyCode, branchCode, zoneCode, groupCode, categoryCode, productCode, queryCode, quotationCode
 * @returns {Promise<number>} Next sequence number (starts from 1000)
 */
export const getNextSequence = async (codeType) => {
  if (!DEFAULT_FORMATTERS[codeType]) {
    throw new CustomError(
      statusCodes.badRequest,
      `Invalid codeType: ${codeType}. Must be one of: ${Object.keys(DEFAULT_FORMATTERS).join(', ')}`,
      errorCodes.validation_error,
    )
  }

  try {
    await CodeSequenceModel.create({ _id: CODE_SEQUENCE_ID, ...SET_ON_INSERT })
  } catch (err) {
    if (err.code !== 11000) throw err
  }

  const doc = await CodeSequenceModel.findByIdAndUpdate(
    CODE_SEQUENCE_ID,
    { $inc: { [codeType]: 1 } },
    { new: true },
  ).lean()

  const value = doc[codeType]
  if (value == null || value < 1000) {
    throw new CustomError(
      statusCodes.internal,
      `Code sequence for ${codeType} is in invalid state. Run: npm run seed:codeSequence`,
      errorCodes.internal_error,
    )
  }
  return value
}

/**
 * Generate a unique code for the given codeType.
 * 1. Get next number from common table (atomic increment).
 * 2. Format the code (e.g. QRY01001).
 * 3. If checkModel is provided, check if that code already exists in the entity table; if yes, increment again and repeat until unique.
 * 4. Return the unique code. The common table is updated so the next call gets the next number.
 *
 * @param {string} codeType - companyCode | branchCode | zoneCode | groupCode | categoryCode | productCode | queryCode | quotationCode
 * @param {Object} [options]
 * @param {import('mongoose').Model} [options.model] - Mongoose model to check for existing code (e.g. QueryModel)
 * @param {string} [options.field] - Field name on the model that stores the code (e.g. 'queryCode'). Defaults to codeType.
 * @param {Function} [options.format] - (n: number) => string. Defaults to DEFAULT_FORMATTERS[codeType].
 * @param {Object} [options.branchFilter] - Extra filter when checking existence (e.g. { branchId })
 * @param {boolean} [options.useIsDeleted=true] - If true, adds isDeleted: false to the existence check.
 * @returns {Promise<string>} Unique code string
 */
export const generateUniqueCode = async (codeType, options = {}) => {
  const {
    model,
    field = codeType,
    format = DEFAULT_FORMATTERS[codeType],
    branchFilter = {},
    useIsDeleted = true,
  } = options

  let attempts = 0
  while (attempts < MAX_ATTEMPTS) {
    const num = await getNextSequence(codeType)
    const code = typeof format === 'function' ? format(num) : `${num}`

    if (!model) {
      return code
    }

    const filter = { [field]: code, ...branchFilter }
    if (useIsDeleted && model.schema.paths.isDeleted) {
      filter.isDeleted = false
    }
    const exists = await model.findOne(filter).lean()
    if (!exists) {
      return code
    }
    attempts++
  }

  throw new CustomError(
    statusCodes.conflict,
    `Could not generate unique ${codeType}. Please try again.`,
    errorCodes.already_exist,
  )
}
