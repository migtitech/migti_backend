import path from 'path'
import fs from 'fs';


export const generateReferralCode = (length = 12) => {
  const characters = '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }

  return result
}

export const generateUniqueReferralCode = async (
  Model,
  length = 12,
  maxAttempts = 10
) => {
  let attempts = 0
  while (attempts < maxAttempts) {
    const code = generateReferralCode(length)
    const existingUser = await Model.findOne({ refferalCode: code }).lean()
    if (!existingUser) {
      return code
    }
    attempts++
  }
}

export const imageToBase64 = (filePath) => {
  try {
    const file = fs.readFileSync(filePath);
    return `data:image/png;base64,${Buffer.from(file).toString('base64')}`;
  } catch (error) {
    console.error('Error reading logo file:', error);
    return null; // Return null if the logo can't be read
  }
};
