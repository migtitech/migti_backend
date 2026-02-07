import 'dotenv/config'

/**
 * AWS S3 configuration
 * Environment variables:
 * - AWS_ACCESS_KEY_ID
 * - AWS_SECRET_ACCESS_KEY
 * - AWS_REGION
 * - AWS_S3_BUCKET (or AWS_BUCKET_NAME for backward compatibility)
 * - S3_SIGNED_URL_EXPIRY - Signed URL expiry in seconds (default: 3600 = 1 hour)
 * - S3_BUCKET_PUBLIC - Set to 'true' if bucket is public; otherwise use signed URLs on fetch
 */
const signedUrlExpiry = parseInt(process.env.S3_SIGNED_URL_EXPIRY || '3600', 10)

export const S3_CONFIG = Object.freeze({
  region: process.env.AWS_REGION || 'ap-south-1',
  bucket: process.env.AWS_S3_BUCKET || process.env.AWS_BUCKET_NAME || '',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  isConfigured: Boolean(
    process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      (process.env.AWS_S3_BUCKET || process.env.AWS_BUCKET_NAME)
  ),
  signedUrlExpirySeconds: Number.isNaN(signedUrlExpiry) ? 3600 : Math.max(60, signedUrlExpiry),
  bucketPublic: process.env.S3_BUCKET_PUBLIC === 'true',
})

export default S3_CONFIG
