import fs from 'fs/promises'
import path from 'path'
import { getSignedUrlForPath } from './s3bucket.js'

const ASSETS_DIR = path.join(process.cwd(), 'assets')
const dataUriCache = new Map()

const toDataUriFromBuffer = (buffer, mimeType = 'image/png') => {
  if (!buffer?.length) return ''
  return `data:${mimeType};base64,${buffer.toString('base64')}`
}

const guessMimeFromPath = (filePath) => {
  const ext = String(filePath || '').toLowerCase()
  if (ext.endsWith('.jpg') || ext.endsWith('.jpeg')) return 'image/jpeg'
  if (ext.endsWith('.gif')) return 'image/gif'
  if (ext.endsWith('.webp')) return 'image/webp'
  if (ext.endsWith('.svg')) return 'image/svg+xml'
  return 'image/png'
}

const fetchUrlAsDataUri = async (url) => {
  const response = await fetch(url)
  if (!response.ok) return ''
  const mimeType = response.headers.get('content-type') || 'image/png'
  const arrayBuffer = await response.arrayBuffer()
  return toDataUriFromBuffer(Buffer.from(arrayBuffer), mimeType)
}

/**
 * Resolve a document path or populated image doc to an inline data URI for PDF rendering.
 * Avoids Puppeteer network fetches and duplicate S3 presign work during PDF export.
 */
export const resolvePdfImageDataUri = async (imgDocOrPath) => {
  const rawPath =
    typeof imgDocOrPath === 'string' ? imgDocOrPath : imgDocOrPath?.path
  if (!rawPath) return ''
  if (String(rawPath).startsWith('data:')) return rawPath

  const cacheKey = String(rawPath)
  if (dataUriCache.has(cacheKey)) return dataUriCache.get(cacheKey)

  let dataUri = ''
  try {
    if (
      typeof rawPath === 'string' &&
      (rawPath.startsWith('http://') || rawPath.startsWith('https://'))
    ) {
      const signed = (await getSignedUrlForPath(rawPath)) || rawPath
      dataUri = await fetchUrlAsDataUri(signed)
    } else {
      const filePath = path.join(ASSETS_DIR, rawPath)
      const fileBuffer = await fs.readFile(filePath)
      dataUri = toDataUriFromBuffer(fileBuffer, guessMimeFromPath(filePath))
    }
  } catch (_err) {
    dataUri = ''
  }

  if (dataUri) dataUriCache.set(cacheKey, dataUri)
  return dataUri
}

export const resolveFirstProductLineImageDataUri = async (productLine = {}) => {
  const ref =
    productLine.product_id && typeof productLine.product_id === 'object'
      ? productLine.product_id
      : null
  const imageSources =
    (Array.isArray(productLine.images) &&
      productLine.images.length &&
      productLine.images) ||
    (Array.isArray(ref?.images) && ref.images.length && ref.images) ||
    []
  if (!imageSources[0]) return ''
  return resolvePdfImageDataUri(imageSources[0])
}

const PDF_LOGO_URL = 'https://migti.co.in/assets/images/logo.png'
let cachedLogoDataUri = null
let logoFetchPromise = null

export const getPdfLogoDataUri = async () => {
  if (cachedLogoDataUri) return cachedLogoDataUri
  if (!logoFetchPromise) {
    logoFetchPromise = fetchUrlAsDataUri(PDF_LOGO_URL)
      .then((uri) => {
        cachedLogoDataUri = uri || PDF_LOGO_URL
        return cachedLogoDataUri
      })
      .catch(() => {
        cachedLogoDataUri = PDF_LOGO_URL
        return cachedLogoDataUri
      })
      .finally(() => {
        logoFetchPromise = null
      })
  }
  return logoFetchPromise
}
