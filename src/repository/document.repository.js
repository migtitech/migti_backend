import DocumentModel from '../models/document.model.js'

const documentRepository = {
  find: (filter) => DocumentModel.find(filter),
  findById: (id) => DocumentModel.findById(id),
}

export const createDocument = (data) => DocumentModel.create(data)

export const findDocumentById = async (documentId) => {
  if (!documentId) return null
  return DocumentModel.findById(documentId).lean()
}

export default documentRepository
