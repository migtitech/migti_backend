import puppeteer from 'puppeteer'
import fs from 'fs/promises'
import { getQuotationById } from './quotation.service.js'
import { QUOTATION_STATUS } from '../../models/quotation.model.js'
import CompanyBranchModel from '../../models/companyBranch.model.js'
import CompanyModel from '../../models/company.model.js'
import CustomError from '../../utils/exception.js'
import { errorCodes, statusCodes } from '../../core/common/constant.js'
import {
  getDocumentById,
  getDocumentServeInfo,
  toDisplayPath,
} from '../document/document.service.js'

const normalizeRole = (role) =>
  String(role || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')

const isSalesRole = (role) => normalizeRole(role).startsWith('sales')

const getAssetsBaseUrl = () => {
  const port = process.env.PORT || 7200
  return process.env.APP_BASE_URL || `http://localhost:${port}`
}

const toImageUrl = (img) => {
  if (!img) return ''
  const p = typeof img === 'string' ? img : img.path
  if (!p) return ''
  if (
    typeof p === 'string' &&
    (p.startsWith('http://') || p.startsWith('https://'))
  )
    return p
  const base = getAssetsBaseUrl()
  return `${base}/assets/${p.startsWith('/') ? p.slice(1) : p}`
}

const toDataUriFromBuffer = (buffer, mimeType = 'image/png') => {
  if (!buffer) return ''
  return `data:${mimeType};base64,${buffer.toString('base64')}`
}

const toSignatureDataUri = async (documentId) => {
  if (!documentId) return ''
  try {
    const info = await getDocumentServeInfo(documentId)
    if (!info) return ''

    if (info.type === 'local' && info.filePath) {
      const fileBuffer = await fs.readFile(info.filePath)
      const ext = String(info.filePath).toLowerCase()
      const mimeType =
        ext.endsWith('.jpg') || ext.endsWith('.jpeg')
          ? 'image/jpeg'
          : ext.endsWith('.gif')
            ? 'image/gif'
            : ext.endsWith('.webp')
              ? 'image/webp'
              : ext.endsWith('.svg')
                ? 'image/svg+xml'
                : 'image/png'
      return toDataUriFromBuffer(fileBuffer, mimeType)
    }

    if (info.type === 's3' && info.signedUrl) {
      const response = await fetch(info.signedUrl)
      if (!response.ok) return ''
      const mimeType = response.headers.get('content-type') || 'image/png'
      const arrayBuffer = await response.arrayBuffer()
      return toDataUriFromBuffer(Buffer.from(arrayBuffer), mimeType)
    }
  } catch (_err) {
    return ''
  }
  return ''
}

const escapeHtml = (str) => {
  if (str == null) return ''
  const s = String(str)
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const formatCurrency = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '0.00'
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const formatDeliveryDatePdf = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB')
}

const formatVariants = (variants) => {
  if (!Array.isArray(variants) || variants.length === 0) return '—'
  return (
    variants
      .map((v) =>
        typeof v === 'object' ? v?.variantName || '' : String(v || '')
      )
      .map((v) => v.trim())
      .filter(Boolean)
      .join(', ') || '—'
  )
}

const parseChargeNumeric = (value) => {
  if (value == null || value === '') return 0
  const compact = String(value).replace(/,/g, '').replace(/\s/g, '')
  const num = parseFloat(compact)
  return Number.isFinite(num) && num >= 0 ? num : 0
}

/**
 * Build HTML for quotation PDF to match structured design.
 * Uses existing quotation data plus branch/company (for header).
 */
const buildHtml = (quotation, orgContext = {}) => {
  const { branch, company } = orgContext || {}
  const ci = quotation.companyInfo || {}
  const allProducts = Array.isArray(quotation.products)
    ? quotation.products
    : []

  let totalTaxable = 0
  let totalGstAmount = 0

  const quotationCode =
    quotation.quotationCode ||
    `QT-${String(quotation._id || quotation.id).slice(-6)}`
  const quotationDate = quotation.createdAt
    ? (() => {
        const d = new Date(quotation.createdAt)
        const dateStr = d.toLocaleDateString()
        const h = String(d.getHours()).padStart(2, '0')
        const m = String(d.getMinutes()).padStart(2, '0')
        const s = String(d.getSeconds()).padStart(2, '0')
        return `${dateStr} ${h}:${m}:${s}`
      })()
    : ''

  // Whether to show Discount column (at least one available product has discount)
  const hasDiscount = allProducts.some(
    (p) =>
      !p.notAvailable &&
      p.applyDiscount &&
      (p.discountPercentage != null || p.discountAmount != null)
  )

  // Fixed Migti header for PDF
  const migtiCompanyName = 'Migti Industrial Pvt Ltd'
  const migtiGstNumber = '23AARCM4143L1Z6'
  const migtiAddress =
    '3rd Floor, M.S.-1, B-304, New Siyaganj, Indore, Madhya Pradesh 452003'
  const migtiEmail = 'sale.migtiindore@gmail.com'
  const migtiPhone1 = '+91 7898611052'
  const migtiPhone2 = ''

  // Customer & shipping information
  const industry = quotation.industry_id || {}
  const queryCompanyInfo =
    quotation.queryId && quotation.queryId.companyInfo
      ? quotation.queryId.companyInfo
      : {}

  const customerName = ci.name || queryCompanyInfo.name || industry.name || ''
  const customerAddress =
    ci.address || queryCompanyInfo.address || industry.address || ''

  const pmList = Array.isArray(ci.purchaseManagers) ? ci.purchaseManagers : []
  const primaryPm = pmList[0] || null

  const customerContactPerson =
    (primaryPm && primaryPm.name) || industry.purchase_manager_name || ''
  const customerPhone =
    (primaryPm && primaryPm.phone) || industry.purchase_manager_phone || ''
  const customerEmail =
    (primaryPm && primaryPm.email) ||
    ci.email ||
    queryCompanyInfo.email ||
    industry.email ||
    ''
  const customerGstNumber =
    ci.gstNumber || queryCompanyInfo.gstNumber || industry.gstNumber || ''

  const shippingContactPerson = customerContactPerson
  const signatureUrl = orgContext?.signatureUrl || ''

  const productRows = allProducts
    .map((p, index) => {
      const productRef = typeof p.product_id === 'object' ? p.product_id : null
      const imageSources =
        (Array.isArray(p.images) && p.images.length && p.images) ||
        (Array.isArray(productRef?.images) &&
          productRef.images.length &&
          productRef.images) ||
        []
      const firstImg = imageSources[0] || null
      const firstImgUrl = firstImg ? toImageUrl(firstImg) : ''
      const imgHtml = firstImgUrl
        ? `<img src="${escapeHtml(
            firstImgUrl
          )}" alt="" style="width:60px;height:60px;object-fit:cover;border:1px solid #ddd;" onerror="this.style.display='none'">`
        : '—'

      const hsn = p.hsnNumber || productRef?.hsnNumber || '—'
      const variantsText = formatVariants(p.variants || [])
      const descriptionText = (
        p.description ||
        productRef?.shortDescription ||
        ''
      ).trim()
      const reasonCell = escapeHtml(
        String(
          p.notAvailableRemark || (p.notAvailable ? 'Not available' : '')
        ).trim()
      )
      const deliveryDateCell = escapeHtml(formatDeliveryDatePdf(p.deliveryDate))

      if (p.notAvailable) {
        return `
        <tr>
          <td class="cell text-center">${index + 1}</td>
          <td class="cell">
            <div class="product-name">${escapeHtml(p.productName || '—')}</div>
            ${descriptionText ? `<div class="product-description">${escapeHtml(descriptionText)}</div>` : ''}
            ${p.remark ? `<div class="product-remark">${escapeHtml(String(p.remark))}</div>` : ''}
          </td>
          <td class="cell text-center">${escapeHtml(variantsText)}</td>
          <td class="cell text-center">${escapeHtml(hsn)}</td>
          <td class="cell text-right">—</td>
          ${hasDiscount ? '<td class="cell text-right">—</td>' : ''}
          <td class="cell text-center">${Number(p.quantity) || ''}</td>
          <td class="cell text-center">${escapeHtml(p.unit || '')}</td>
          <td class="cell text-center">${deliveryDateCell}</td>
          <td class="cell text-center">—</td>
          <td class="cell text-right">—</td>
          <td class="cell text-center image-cell">${imgHtml}</td>
          <td class="cell">${reasonCell || '—'}</td>
        </tr>
      `
      }

      const qty = Number(p.quantity) || 0
      const rate = Number(p.rate) || 0
      const beforeDiscount = qty * rate
      const discountAmount =
        p.applyDiscount && p.discountPercentage != null
          ? beforeDiscount * (Number(p.discountPercentage) / 100)
          : Number(p.discountAmount) || 0
      const taxable = Math.max(0, beforeDiscount - discountAmount)

      const gstPercent =
        typeof p.gstPercentage === 'number' && !Number.isNaN(p.gstPercentage)
          ? p.gstPercentage
          : productRef != null &&
              typeof productRef.gstPercentage === 'number' &&
              !Number.isNaN(productRef.gstPercentage)
            ? productRef.gstPercentage
            : 0
      const gstAmount = taxable * (gstPercent / 100)

      totalTaxable += taxable
      totalGstAmount += gstAmount

      const discountCell = hasDiscount
        ? p.applyDiscount && p.discountPercentage != null
          ? `${Number(p.discountPercentage).toFixed(2)}%`
          : '—'
        : ''

      return `
        <tr>
          <td class="cell text-center">${index + 1}</td>
          <td class="cell">
            <div class="product-name">${escapeHtml(p.productName || '—')}</div>
            ${descriptionText ? `<div class="product-description">${escapeHtml(descriptionText)}</div>` : ''}
            ${p.remark ? `<div class="product-remark">${escapeHtml(String(p.remark))}</div>` : ''}
          </td>
          <td class="cell text-center">${escapeHtml(variantsText)}</td>
          <td class="cell text-center">${escapeHtml(hsn)}</td>
          <td class="cell text-right">${rate ? formatCurrency(rate) : ''}</td>
          ${hasDiscount ? `<td class="cell text-right">${discountCell}</td>` : ''}
          <td class="cell text-center">${qty || ''}</td>
          <td class="cell text-center">${escapeHtml(p.unit || '')}</td>
          <td class="cell text-center">${deliveryDateCell}</td>
          <td class="cell text-center">${gstPercent ? gstPercent.toFixed(2) + '%' : '—'}</td>
          <td class="cell text-right">${taxable ? formatCurrency(taxable) : ''}</td>
          <td class="cell text-center image-cell">${imgHtml}</td>
          <td class="cell">—</td>
        </tr>
      `
    })
    .join('')

  const freightCharge = parseChargeNumeric(quotation.freightCharge)
  const packingCharge =
    Number(quotation.packingCharge) >= 0 ? Number(quotation.packingCharge) : 0
  const freightChargePdfCell = (() => {
    const raw = quotation.freightCharge
    if (raw == null || raw === '') return '—'
    const str = String(raw).trim()
    if (str === '') return '—'
    const compact = str.replace(/,/g, '').replace(/\s/g, '')
    if (/^\d*\.?\d+$/.test(compact)) {
      const num = parseFloat(compact)
      return `₹${formatCurrency(Number.isFinite(num) && num >= 0 ? num : 0)}`
    }
    return escapeHtml(str)
  })()
  const taxableAfterCharges = totalTaxable + freightCharge + packingCharge
  const totalAmount = taxableAfterCharges + totalGstAmount

  const colCount = 11 + (hasDiscount ? 1 : 0)
  const productsBody =
    productRows ||
    `<tr><td class="cell text-center" colspan="${colCount}">No products.</td></tr>`

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; }
    html, body { width: 100%; margin: 0; padding: 0; }
    body {
      font-family: Arial, sans-serif;
      font-size: 14px;
      color: #222;
      padding: 14px 16px;
    }
    .pdf-header-row {
      position: relative;
      width: 100%;
      border-bottom: 2px solid #444;
      padding-bottom: 8px;
      margin-bottom: 10px;
      min-height: 62px;
    }
    .pdf-header-logo-cell {
      position: absolute;
      left: 0;
      top: -16px;
      width: 120px;
      padding-right: 12px;
      display: block;
    }
    .pdf-header-center-cell {
      width: 100%;
      text-align: center;
      padding: 0 20px;
    }
    .pdf-header-company-name {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .pdf-header-line {
      font-size: 12px;
      margin: 2px 0;
      line-height: 1.35;
    }
    .pdf-header-gst-label {
      font-weight: 600;
    }
    .pdf-logo-header {
      width: 100px;
      height: auto;
      max-height: 50px;
      object-fit: contain;
      display: block;
    }
    .section-title {
      font-size: 14px;
      font-weight: 600;
      margin: 8px 0 4px;
    }
    .quotation-meta-below-details {
      font-size: 11px;
      margin-top: 8px;
      padding-top: 6px;
      border-top: 1px solid #e8e8e8;
    }
    .quotation-meta-date {
      margin-top: 6px;
    }
    .quotation-meta-label {
      font-weight: 600;
      color: #444;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 6px 0;
      page-break-inside: auto;
    }
    thead {
      display: table-header-group;
    }
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    th {
      background: #f7ecd4;
      color: #222;
      border: 1px solid #bbb;
      padding: 6px 5px;
      font-size: 12px;
      font-weight: 600;
      text-align: center;
      white-space: nowrap;
    }
    .cell {
      border: 1px solid #ddd;
      padding: 5px 5px;
      font-size: 12px;
      vertical-align: top;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .product-name {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 2px;
    }
    .product-description {
      font-size: 11px;
      color: #444;
      margin-bottom: 2px;
    }
    .product-remark {
      font-size: 10px;
      color: #666;
    }
    .image-cell {
      width: 70px;
      text-align: center;
    }
    .details-grid {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 6px;
      table-layout: fixed;
    }
    .details-grid td {
      vertical-align: top;
      padding: 0;
    }
    .details-block {
      padding: 0 8px;
    }
    .details-grid td.details-block + td.details-block {
      padding-left: 16px;
      border-left: 1px solid #eee;
    }
    .block-title {
      font-weight: 600;
      font-size: 13px;
      margin-bottom: 3px;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .info-table td {
      padding: 2px 3px;
      border: 1px solid #e0e0e0;
    }
    .info-label {
      width: 32%;
      font-weight: 600;
      background-color: #f8f9fa;
      white-space: nowrap;
    }
    .info-value {
      width: 68%;
    }
    .meta-small {
      margin-top: 4px;
      font-size: 10px;
    }
    .summary-signature-wrapper {
      margin-top: 8px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .terms {
      width: 55%;
      font-size: 12px;
    }
    .terms-title {
      font-weight: 600;
      margin-bottom: 3px;
    }
    .terms ul {
      margin: 0;
      padding-left: 14px;
    }
    .terms li {
      margin-bottom: 2px;
    }
    .summary-wrapper {
      width: 40%;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      font-size: 12px;
    }
    .summary-table {
      border-collapse: collapse;
      min-width: 230px;
      font-size: 12px;
    }
    .summary-table td {
      padding: 3px 5px;
      border: 1px solid #ccc;
    }
    .summary-label {
      font-weight: 600;
      text-align: right;
      background-color: #f8f9fa;
      white-space: nowrap;
    }
    .summary-value {
      text-align: right;
      min-width: 90px;
    }
    .grand-total-row .summary-label {
      background-color: #e9ecef;
    }
    .grand-total-row .summary-value {
      font-weight: 700;
    }
    .signature {
      margin-top: 10px;
      text-align: right;
      font-size: 12px;
    }
    .signature-image {
      display: block;
      max-width: 170px;
      max-height: 70px;
      margin-left: auto;
      margin-bottom: 6px;
      object-fit: contain;
    }
    .signature-name {
      font-weight: 600;
      margin-top: 18px;
    }
    .muted {
      color: #666;
      font-size: 9px;
    }
  </style>
</head>
<body>
  <div class="pdf-header-row">
    <div class="pdf-header-logo-cell">
      <img src="https://migti.co.in/assets/images/logo.png" alt="" class="pdf-logo-header" onerror="this.style.display='none'">
    </div>
    <div class="pdf-header-center-cell">
      <div class="pdf-header-company-name">${escapeHtml(migtiCompanyName)}</div>
      <div class="pdf-header-line"><span class="pdf-header-gst-label">GST No.</span> ${escapeHtml(migtiGstNumber)} &nbsp;|&nbsp; ${escapeHtml(migtiAddress)}</div>
      <div class="pdf-header-line"><span class="pdf-header-gst-label">Contact:</span> ${escapeHtml(migtiPhone1)}${migtiPhone2 ? `, ${escapeHtml(migtiPhone2)}` : ''} &nbsp;|&nbsp; ${escapeHtml(migtiEmail)}</div>
    </div>
  </div>

  <div class="section-title">Customer & Shipping Details</div>
  <table class="details-grid">
    <tr>
      <td class="details-block" style="width: 55%;">
        <div class="block-title">Customer Details</div>
        <table class="info-table">
          <tr>
            <td class="info-label">Customer Name</td>
            <td class="info-value">${escapeHtml(customerName || '')}</td>
          </tr>
          <tr>
            <td class="info-label">Address</td>
            <td class="info-value">${escapeHtml(customerAddress || '')}</td>
          </tr>
          <tr>
            <td class="info-label">Contact Person</td>
            <td class="info-value">${escapeHtml(customerContactPerson || '')}</td>
          </tr>
          <tr>
            <td class="info-label">Phone</td>
            <td class="info-value">${escapeHtml(customerPhone || '')}</td>
          </tr>
          <tr>
            <td class="info-label">Email</td>
            <td class="info-value">${escapeHtml(customerEmail || '')}</td>
          </tr>
          <tr>
            <td class="info-label">GST Number</td>
            <td class="info-value">${escapeHtml(customerGstNumber || '')}</td>
          </tr>
        </table>
      </td>
      <td class="details-block" style="width: 45%;">
        <div class="block-title">Shipping Details</div>
        <table class="info-table">
          <tr>
            <td class="info-label">Contact Person</td>
            <td class="info-value">${escapeHtml(shippingContactPerson || '')}</td>
          </tr>
        </table>
        <div class="quotation-meta-below-details">
          <div><span class="quotation-meta-label">Quotation Code:</span> ${escapeHtml(quotationCode)}</div>
          ${quotationDate ? `<div class="quotation-meta-date"><span class="quotation-meta-label">Quotation Date:</span> ${escapeHtml(quotationDate)}</div>` : ''}
        </div>
      </td>
    </tr>
  </table>

  <div class="section-title">Quotation Details</div>
  <table>
    <thead>
      <tr>
        <th>S.N.</th>
        <th>Item Name &amp; Description</th>
        <th>Variants</th>
        <th>HSN Code</th>
        <th>Unit Price</th>
        ${hasDiscount ? '<th>Discount</th>' : ''}
        <th>Qty.</th>
        <th>Unit</th>
        <th>Delivery Date</th>
        <th>GST %</th>
        <th>Total</th>
        <th>Photo</th>
        <th>Reason</th>
      </tr>
    </thead>
    <tbody>
      ${productsBody}
    </tbody>
  </table>

  <div class="summary-signature-wrapper">
    <div class="terms">
      <div class="terms-title">Terms And Conditions</div>
      <ul>
        <li>Validity – Offer valid for 2 days from quotation date.</li>
        <li>Once delivered material will not be returned or exchanged.</li>
        <li>Warranty as per company policy.</li>
        <li>Payment terms – 100% advance with purchase order.</li>
        <li>Freight charges as actual.</li>
        <li>Order once placed cannot be cancelled.</li>
      </ul>
    </div>
    <div class="summary-wrapper">
      <table class="summary-table">
        <tr>
          <td class="summary-label">Amount</td>
          <td class="summary-value">₹${formatCurrency(totalTaxable)}</td>
        </tr>
        <tr>
          <td class="summary-label">Freight Charge</td>
          <td class="summary-value">${freightChargePdfCell}</td>
        </tr>
        <tr>
          <td class="summary-label">Packing Charge</td>
          <td class="summary-value">₹${formatCurrency(packingCharge)}</td>
        </tr>
        <tr>
          <td class="summary-label">Total Taxable Amount</td>
          <td class="summary-value">₹${formatCurrency(taxableAfterCharges)}</td>
        </tr>
        <tr>
          <td class="summary-label">GST Amount</td>
          <td class="summary-value">₹${formatCurrency(totalGstAmount)}</td>
        </tr>
        <tr class="grand-total-row">
          <td class="summary-label">Total Amount</td>
          <td class="summary-value">₹${formatCurrency(totalAmount)}</td>
        </tr>
      </table>
      <div class="signature">
        ${signatureUrl ? `<img src="${escapeHtml(signatureUrl)}" alt="Authorised signature" class="signature-image" onerror="this.style.display='none'">` : ''}
        <div class="signature-name">For ${escapeHtml(migtiCompanyName)}</div>
        <div>Authorised Signatory</div>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Export quotation as PDF (products with rate only), with structured layout and images.
 */
export const exportQuotationPdf = async ({
  quotationId,
  branchFilter = {},
  currentUserId = null,
  isFullAccessRole = true,
  role = '',
}) => {
  const quotation = await getQuotationById({
    quotationId,
    branchFilter,
    currentUserId,
    isFullAccessRole,
    role,
  })

  if (
    quotation?.status !== QUOTATION_STATUS.HOD_APPROVED &&
    !isSalesRole(role) &&
    !quotation?.allProductsHodRatesApproved
  ) {
    throw new CustomError(
      statusCodes.forbidden,
      'Quotation can be exported only after HOD approval or when all product HOD rates are approved',
      errorCodes.forbidden
    )
  }

  let branch = null
  let company = null
  let signatureUrl = ''

  // 1) Prefer signature already resolved by quotation service.
  if (quotation?.branchSignature?.path) {
    signatureUrl = toImageUrl(quotation.branchSignature.path)
  }
  if (quotation?.branchSignature?._id && !signatureUrl.startsWith('data:')) {
    const inlineSignature = await toSignatureDataUri(
      quotation.branchSignature._id
    )
    if (inlineSignature) signatureUrl = inlineSignature
  }

  // 2) Resolve branch context from quotation branch, else query branch.
  const rawBranchId =
    quotation?.branchId || quotation?.queryId?.branchId || null
  const resolvedBranchId =
    rawBranchId &&
    typeof rawBranchId === 'object' &&
    rawBranchId._id != null
      ? rawBranchId._id
      : rawBranchId

  if (resolvedBranchId) {
    branch = await CompanyBranchModel.findById(resolvedBranchId).lean()
    if (branch?.companyId) {
      company = await CompanyModel.findById(branch.companyId).lean()
    }
    if (!signatureUrl && branch?.signature) {
      const inlineSignature = await toSignatureDataUri(branch.signature)
      if (inlineSignature) {
        signatureUrl = inlineSignature
      }
    }
    if (!signatureUrl && branch?.signature) {
      const signatureDoc = await getDocumentById(branch.signature)
      if (signatureDoc?.path) {
        const displayPath = await toDisplayPath(signatureDoc.path)
        signatureUrl = toImageUrl(displayPath)
      }
    }
  }

  const html = buildHtml(quotation, { branch, company, signatureUrl })

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    await page.setContent(html, {
      waitUntil: 'load',
      timeout: 30000,
    })
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
    })
    const quotationCode =
      quotation.quotationCode || `QT-${String(quotation._id).slice(-6)}`
    return { buffer: pdfBuffer, quotationCode }
  } finally {
    await browser.close()
  }
}
