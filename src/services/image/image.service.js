import ImageModel from '../../models/image.model.js'
import {
  uploadFiles,
  deleteFile,
  getSignedUrlForKey,
} from '../../core/helpers/s3.service.js'
import { S3_CONFIG } from '../../core/config/s3.config.js'
import logger from '../../core/config/logger.js'

const normalizeImageInput = (item) => {
  if (typeof item === 'string') return { imageUrl: item, s3Key: null, signedUrl: null }
  if (item && typeof item === 'object' && item.imageUrl) {
    return {
      imageUrl: item.imageUrl,
      s3Key: item.s3Key || null,
      signedUrl: item.signedUrl || null,
    }
  }
  return null
}

/**
 * Resolve effective URL for an image: use signed URL if bucket is private, else public URI
 * @param {{ imageUrl: string, s3Key?: string, signedUrl?: string }} doc
 * @returns {Promise<string>}
 */
const resolveImageUrl = async (doc) => {
  if (!doc.s3Key) return doc.imageUrl
  if (!S3_CONFIG.bucketPublic) {
    try {
      return await getSignedUrlForKey(doc.s3Key)
    } catch (err) {
      logger.warn('Failed to generate signed URL, falling back to stored URL', err)
      return doc.imageUrl
    }
  }
  return doc.imageUrl
}

/**
 * Add product images to the Images model
 * @param {ObjectId} productId - Product reference ID
 * @param {string[]|Array<{imageUrl, s3Key?}>} imageUrls - Array of URLs or { imageUrl, s3Key }
 * @param {Array} variantCombinations - Variant combinations with images [{ uniqueId, images: [] }]
 */
export const addImagesForProduct = async (productId, imageUrls = [], variantCombinations = []) => {
  const imageDocs = []

  if (imageUrls && imageUrls.length > 0) {
    for (const item of imageUrls) {
      const normalized = normalizeImageInput(item)
      if (normalized) {
        imageDocs.push({
          imageUrl: normalized.imageUrl,
          s3Key: normalized.s3Key,
          signedUrl: normalized.signedUrl,
          imageType: 'product',
          referenceId: productId,
        })
      }
    }
  }

  if (variantCombinations && variantCombinations.length > 0) {
    for (const combo of variantCombinations) {
      const urls = combo.images || []
      for (const item of urls) {
        const normalized = normalizeImageInput(item)
        if (normalized) {
          imageDocs.push({
            imageUrl: normalized.imageUrl,
            s3Key: normalized.s3Key,
            signedUrl: normalized.signedUrl,
            imageType: 'variant',
            referenceId: productId,
            variantCombinationUniqueId: combo.uniqueId || null,
          })
        }
      }
    }
  }

  if (imageDocs.length > 0) {
    await ImageModel.insertMany(imageDocs)
  }
}

/**
 * Upload files to S3 and save to Images model with transactional safety.
 * If DB save fails, uploaded S3 files are rolled back (deleted).
 * @param {Object} params
 * @param {Object[]} params.files - Multer file objects
 * @param {ObjectId} params.referenceId - Entity reference (e.g. productId)
 * @param {string} params.imageType - product | variant | user | banner | category | brand
 * @param {string} [params.variantCombinationUniqueId] - For variant images
 * @param {string} [params.folderPath] - S3 folder (default: imageType)
 */
export const uploadFilesToS3AndSave = async ({
  files,
  referenceId,
  imageType = 'product',
  variantCombinationUniqueId = null,
  folderPath,
}) => {
  if (!files || files.length === 0) {
    return []
  }

  const useS3 = S3_CONFIG.isConfigured
  const folder = folderPath || `${imageType}s`

  let uploadedResults = []

  if (useS3) {
    uploadedResults = await uploadFiles(files, folder)
  } else {
    logger.warn('S3 not configured; image upload skipped')
    return []
  }

  const imageDocs = uploadedResults.map(({ url, key, signedUrl }) => ({
    imageUrl: url,
    s3Key: key,
    signedUrl: signedUrl || null,
    imageType,
    referenceId,
    variantCombinationUniqueId,
  }))

  try {
    const created = await ImageModel.insertMany(imageDocs)
    return created.map((doc) => doc.toObject())
  } catch (dbError) {
    logger.error('DB save failed after S3 upload, rolling back S3 objects', dbError)
    for (const { key } of uploadedResults) {
      try {
        await deleteFile(key)
      } catch (rollbackError) {
        logger.error(`Failed to rollback S3 object: ${key}`, rollbackError)
      }
    }
    throw dbError
  }
}

/**
 * Delete image by ID. If s3Key exists, deletes from S3 first.
 * If S3 delete fails, DB record is NOT removed (returns error).
 * @param {ObjectId} imageId
 */
export const deleteImageById = async (imageId) => {
  const image = await ImageModel.findById(imageId).lean()

  if (!image) {
    return null
  }

  if (image.s3Key) {
    try {
      await deleteFile(image.s3Key)
    } catch (s3Error) {
      logger.error('S3 delete failed, DB record preserved', s3Error)
      throw s3Error
    }
  }

  await ImageModel.findByIdAndDelete(imageId)
  return { id: image._id, imageUrl: image.imageUrl }
}

/**
 * Get product images grouped by type.
 * If bucket is private, returns dynamically generated signed URLs.
 * @param {ObjectId} productId - Product reference ID
 * @returns {{ images: string[], variantImages: Object }}
 */
export const getImagesForProduct = async (productId) => {
  const imageDocs = await ImageModel.find({
    referenceId: productId,
    isDeleted: false,
  })
    .select('imageUrl s3Key signedUrl imageType variantCombinationUniqueId')
    .lean()

  const images = []
  const variantImages = {}

  for (const doc of imageDocs) {
    const url = await resolveImageUrl(doc)
    if (doc.imageType === 'product') {
      images.push(url)
    } else if (doc.imageType === 'variant' && doc.variantCombinationUniqueId) {
      const key = doc.variantCombinationUniqueId
      if (!variantImages[key]) variantImages[key] = []
      variantImages[key].push(url)
    }
  }

  return { images, variantImages }
}

/**
 * Attach images to products (for list/fetch responses).
 * If bucket is private, returns dynamically generated signed URLs.
 * @param {Array} products - Array of product objects
 * @returns {Array} Products with images attached
 */
export const attachImagesToProducts = async (products) => {
  if (!products || products.length === 0) return products

  const productIds = products.map((p) => p._id)
  const imageDocs = await ImageModel.find({
    referenceId: { $in: productIds },
    isDeleted: false,
  })
    .select('imageUrl s3Key signedUrl imageType variantCombinationUniqueId referenceId')
    .lean()

  const imagesByProduct = {}
  const variantImagesByProduct = {}

  for (const doc of imageDocs) {
    const url = await resolveImageUrl(doc)
    const refId = String(doc.referenceId)
    if (doc.imageType === 'product') {
      if (!imagesByProduct[refId]) imagesByProduct[refId] = []
      imagesByProduct[refId].push(url)
    } else if (doc.imageType === 'variant' && doc.variantCombinationUniqueId) {
      if (!variantImagesByProduct[refId]) variantImagesByProduct[refId] = {}
      const key = doc.variantCombinationUniqueId
      if (!variantImagesByProduct[refId][key]) variantImagesByProduct[refId][key] = []
      variantImagesByProduct[refId][key].push(url)
    }
  }

  return products.map((product) => {
    const idStr = String(product._id)
    const images = imagesByProduct[idStr] || []
    const variantImages = variantImagesByProduct[idStr] || {}

    const variantCombinations = (product.variantCombinations || []).map((combo) => ({
      ...combo,
      images: variantImages[combo.uniqueId] || [],
    }))

    return {
      ...product,
      images,
      variantCombinations,
    }
  })
}

/**
 * Replace all images for a product
 * @param {ObjectId} productId - Product reference ID
 * @param {string[]} imageUrls - Main product images
 * @param {Array} variantCombinations - Variant combinations with images
 */
export const updateImagesForProduct = async (
  productId,
  imageUrls = [],
  variantCombinations = [],
) => {
  await ImageModel.deleteMany({ referenceId: productId })
  await addImagesForProduct(productId, imageUrls, variantCombinations)
}

/**
 * Delete all images for a product (cascade on product delete).
 * Deletes from S3 first where s3Key exists; if S3 fails, skips that image and continues.
 * @param {ObjectId} productId - Product reference ID
 */
export const deleteImagesForProduct = async (productId) => {
  const images = await ImageModel.find({ referenceId: productId }).select('s3Key').lean()

  for (const img of images) {
    if (img.s3Key) {
      try {
        await deleteFile(img.s3Key)
      } catch (err) {
        logger.warn(`S3 delete failed for ${img.s3Key}, continuing`, err)
      }
    }
  }

  await ImageModel.deleteMany({ referenceId: productId })
}
