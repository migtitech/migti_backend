import ProductModel from '../models/product.model.js'

const PREFIX = 'mig'
const CODE_LENGTH = 6
const MAX_ATTEMPTS = 1000

/**
 * Generates a random 6-digit number (000000 to 999999)
 */
const getRandomSixDigits = () => {
  const num = Math.floor(Math.random() * 1000000)
  return num.toString().padStart(CODE_LENGTH, '0')
}

/**
 * Generates a unique product code in format: mig + 6 digit random number.
 * Retries on collision to ensure it never repeats.
 */
export const generateUniqueProductCode = async () => {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const sixDigits = getRandomSixDigits()
    const code = `${PREFIX}${sixDigits}`

    const existing = await ProductModel.findOne({ productCode: code }).lean()
    if (!existing) {
      return code
    }
  }

  // Fallback: use timestamp suffix to guarantee uniqueness (extremely rare)
  const sixDigits = (Date.now() % 1000000).toString().padStart(CODE_LENGTH, '0')
  return `${PREFIX}${sixDigits}`
}
