// accessVideo.js
import { getSignedUrl } from '@aws-sdk/cloudfront-signer'
import fs from 'fs'

export function generateSignedCloudFrontUrl({
  url,
  keyPairId,
  privateKeyPath,
  expiresInSeconds = 3600,
}) {
  const privateKey = fs.readFileSync(privateKeyPath, 'utf8')
  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds
  console.log('DEBUG INPUT', { url, keyPairId, expires })

  return getSignedUrl({
    url,
    keyPairId,
    privateKey,
    expires,
  })
}
