import jwt from 'jsonwebtoken'
export const regexFilter = (
  filters = {},
  options = { caseInsensitive: true }
) => {
  const result = {}
  const regexOptions = options.caseInsensitive ? 'i' : ''
  for (const [key, value] of Object.entries(filters)) {
    const trimmedValue = typeof value === 'string' ? value.trim() : null

    if (key && trimmedValue) {
      result[key] = { $regex: trimmedValue, $options: regexOptions }
    }
  }

  return result
}

const JWT_SECRET = 'JWT_SECRET'

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers?.authorization
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).send({
      success: false,
      message: 'Access denied. No token provided.',
    })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(403).send({
      success: false,
      message: 'Invalid or expired token.',
    })
  }
}

export function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

export const fineUserIdByToken = (token) => {
  const decoded = jwt.verify(token, 'JWT_SECRET')
  return decoded.id
}
