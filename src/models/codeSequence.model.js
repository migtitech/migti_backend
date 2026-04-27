import mongoose from 'mongoose'

/**
 * Singleton document storing the last-used numeric value for each code type.
 * All sequences start at 999 so the first generated code is 1000.
 * Use generateUniqueCode() service to get next unique code (increments + checks entity table).
 */
const INITIAL_VALUE = 999

const codeSequenceSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'code_sequence_singleton' },
    companyCode: { type: Number, default: INITIAL_VALUE, required: true },
    branchCode: { type: Number, default: INITIAL_VALUE, required: true },
    zoneCode: { type: Number, default: INITIAL_VALUE, required: true },
    groupCode: { type: Number, default: INITIAL_VALUE, required: true },
    categoryCode: { type: Number, default: INITIAL_VALUE, required: true },
    productCode: { type: Number, default: INITIAL_VALUE, required: true },
    queryCode: { type: Number, default: INITIAL_VALUE, required: true },
    /** Query / new-product tracking codes (QTRK1000) */
    ritems: { type: Number, default: INITIAL_VALUE, required: true },
    quotationCode: { type: Number, default: INITIAL_VALUE, required: true },
    purchaseOrderCode: { type: Number, default: INITIAL_VALUE, required: true },
  },
  { timestamps: true, collection: 'codesequences' }
)

const CodeSequenceModel = mongoose.model('codeSequence', codeSequenceSchema)

export default CodeSequenceModel
export const CODE_SEQUENCE_ID = 'code_sequence_singleton'
