import crypto from 'crypto'
import os from 'os'
import logger from '../../core/config/logger.js'
import AuditLogModel from '../../models/auditLog.model.js'

const STORE_RAW_JWT = process.env.AUDIT_LOG_STORE_RAW_JWT === 'true'

const SENSITIVE_BODY_KEYS = new Set(
  [
    'password',
    'confirmpassword',
    'currentpassword',
    'newpassword',
    'token',
    'refreshtoken',
    'accesstoken',
    'authorization',
  ].map((k) => k.toLowerCase())
)

export function hashBearerToken(token) {
  if (!token || typeof token !== 'string') return ''
  const clean = token.replace(/^Bearer\s+/i, '').trim()
  if (!clean) return ''
  return crypto.createHash('sha256').update(clean).digest('hex')
}

function cloneJsonSafe(value) {
  if (value === undefined || value === null) return value
  if (typeof value !== 'object') return value
  if (Buffer.isBuffer(value)) return '[binary]'
  try {
    return JSON.parse(JSON.stringify(value))
  } catch {
    return String(value)
  }
}

function sanitizeBody(body) {
  if (body === undefined || body === null) return undefined
  if (typeof body !== 'object' || Buffer.isBuffer(body)) {
    return typeof body === 'object' ? '[non-serializable]' : body
  }
  const raw = cloneJsonSafe(body)
  if (raw === null || typeof raw !== 'object') return raw
  const out = Array.isArray(raw) ? [...raw] : { ...raw }
  for (const key of Object.keys(out)) {
    if (SENSITIVE_BODY_KEYS.has(String(key).toLowerCase())) {
      out[key] = '[REDACTED]'
    }
  }
  return out
}

function pickHeaders(req) {
  const h = req.headers || {}
  const pick = (name) => h[name] ?? ''
  return {
    'user-agent': pick('user-agent'),
    'accept-language': pick('accept-language'),
    'accept-encoding': pick('accept-encoding'),
    referer: pick('referer'),
    origin: pick('origin'),
    host: pick('host'),
    'x-forwarded-for': pick('x-forwarded-for'),
    'x-real-ip': pick('x-real-ip'),
    'sec-ch-ua': pick('sec-ch-ua'),
    'sec-ch-ua-platform': pick('sec-ch-ua-platform'),
    'sec-ch-ua-mobile': pick('sec-ch-ua-mobile'),
    'sec-ch-ua-platform-version': pick('sec-ch-ua-platform-version'),
    'content-type': pick('content-type'),
  }
}

function clientMeta(req) {
  const forwarded = req.headers?.['x-forwarded-for']
  const firstForwarded =
    typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : undefined
  const ip =
    firstForwarded ||
    req.headers?.['x-real-ip'] ||
    req.ip ||
    req.socket?.remoteAddress ||
    ''

  return {
    ip: String(ip),
    forwardedFor: req.headers?.['x-forwarded-for'] || '',
    realIp: req.headers?.['x-real-ip'] || '',
    userAgent: req.headers?.['user-agent'] || '',
    headers: pickHeaders(req),
    remoteAddress: req.socket?.remoteAddress || '',
  }
}

function routeMeta(req) {
  return {
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl,
    url: req.url,
    routePath: req.route?.path || null,
  }
}

function requestSnapshot(req) {
  return {
    params: cloneJsonSafe(req.params),
    query: cloneJsonSafe(req.query),
    body: sanitizeBody(req.body),
  }
}

function serverMeta() {
  return {
    hostname: os.hostname(),
    nodeEnv: process.env.NODE_ENV || 'development',
    pid: process.pid,
    platform: process.platform,
    nodeVersion: process.version,
    serverTime: new Date().toISOString(),
  }
}

/**
 * Persist JWT auth check audit (non-blocking for the request).
 * @param {object} opts
 * @param {import('express').Request} opts.req
 * @param {'success'|'failure'} opts.outcome
 * @param {object|null} opts.jwtPayload - decoded claims on success
 * @param {string} [opts.bearerToken] - raw token segment (no "Bearer " prefix)
 * @param {import('../../utils/exception.js').default|Error|null} [opts.error]
 */
export function scheduleJwtAuthAudit({
  req,
  outcome,
  jwtPayload = null,
  bearerToken = '',
  error = null,
}) {
  const tokenHash = hashBearerToken(bearerToken)
  const doc = {
    eventType: 'jwt_auth',
    outcome,
    jwtPayload: jwtPayload ? cloneJsonSafe(jwtPayload) : null,
    tokenHash,
    jwtAccessToken:
      STORE_RAW_JWT && bearerToken
        ? String(bearerToken)
            .replace(/^Bearer\s+/i, '')
            .trim()
        : '',
    route: routeMeta(req),
    request: requestSnapshot(req),
    client: clientMeta(req),
    server: serverMeta(),
    failure:
      outcome === 'failure' && error
        ? {
            message: error.message || String(error),
            code: error.errorCode || error.code || null,
            name: error.name || null,
          }
        : null,
  }

  void AuditLogModel.create(doc).catch((err) => {
    logger.error('audit_log insert failed (jwt_auth)', err)
  })
}
