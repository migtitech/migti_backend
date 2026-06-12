import CompanyDocumentModel from '../../models/companyDocument.model.js'
import DocumentModel from '../../models/document.model.js'
import CustomError from '../../utils/exception.js'
import { statusCodes, errorCodes } from '../../core/common/constant.js'
import { uploadToS3 } from '../../core/helpers/s3bucket.js'
import { createDocumentsForUploadedFiles } from '../document/document.service.js'

const uploadCompanyDocumentFile = async (file) => {
  if (!file?.buffer) {
    throw new CustomError(
      statusCodes.badRequest,
      'Document file is required',
      errorCodes.invalid_input
    )
  }

  const folder = `company-documents/${Date.now()}`
  const s3Result = await uploadToS3(file, process.env.AWS_BUCKET_NAME, folder)

  if (s3Result.success && s3Result.data?.url) {
    const doc = await DocumentModel.create({
      path: s3Result.data.url,
      originalName: s3Result.data.originalName || file.originalname || '',
      mimeType: s3Result.data.mimetype || file.mimetype || '',
    })
    return doc
  }

  const [created] = await createDocumentsForUploadedFiles([file])
  if (!created?._id) {
    throw new CustomError(
      statusCodes.badRequest,
      s3Result.message || 'Document upload failed',
      errorCodes.invalid_input
    )
  }
  return DocumentModel.findById(created._id)
}

export const createCompanyDocument = async ({
  name,
  doc_type,
  remark = '',
  file,
  createdBy = null,
}) => {
  const document = await uploadCompanyDocumentFile(file)

  const record = await CompanyDocumentModel.create({
    name,
    doc_type,
    remark: remark || '',
    documentId: document._id,
    createdBy,
  })

  return CompanyDocumentModel.findById(record._id)
    .populate('documentId', 'path originalName mimeType')
    .lean()
}

export const listCompanyDocuments = async ({
  pageNumber = 1,
  pageSize = 20,
  search = '',
  doc_type = '',
}) => {
  const filter = { isDeleted: false }
  const term = String(search || '').trim()
  if (term) {
    filter.$or = [
      { name: { $regex: term, $options: 'i' } },
      { remark: { $regex: term, $options: 'i' } },
    ]
  }
  const type = String(doc_type || '').trim()
  if (type) {
    filter.doc_type = { $regex: type, $options: 'i' }
  }

  const skip = (pageNumber - 1) * pageSize
  const [items, totalItems] = await Promise.all([
    CompanyDocumentModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate('documentId', 'path originalName mimeType')
      .lean(),
    CompanyDocumentModel.countDocuments(filter),
  ])

  const totalPages = Math.ceil(totalItems / pageSize) || 1
  return {
    companyDocuments: items,
    pagination: {
      currentPage: pageNumber,
      itemsPerPage: pageSize,
      totalItems,
      totalPages,
      hasNextPage: pageNumber < totalPages,
      hasPrevPage: pageNumber > 1,
    },
  }
}

export const deleteCompanyDocument = async ({ companyDocumentId }) => {
  const record = await CompanyDocumentModel.findOne({
    _id: companyDocumentId,
    isDeleted: false,
  })
  if (!record) {
    throw new CustomError(
      statusCodes.notFound,
      'Company document not found',
      errorCodes.not_found
    )
  }
  await record.softDelete()
  return { companyDocumentId }
}
