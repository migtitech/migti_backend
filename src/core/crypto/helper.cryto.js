import crypto from 'crypto'

const algorithm = 'aes-256-ecb'
const secret = 'ABCDEFGHIJKLMNOPQRSTUVWXZY123456'
const key = Buffer.from(secret, 'utf8')

export function encrypt(text) {
  const cipher = crypto.createCipheriv(algorithm, key, null)
  let encrypted = cipher.update(text, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  return encrypted
}

export function decrypt(encrypted) {
  const decipher = crypto.createDecipheriv(algorithm, key, null)
  let decrypted = decipher.update(encrypted, 'base64', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}
