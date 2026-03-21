import puppeteer from 'puppeteer'
import { getQueryById } from './query.service.js'
import { getQuotationByQueryId } from '../quotation/quotation.service.js'
import CompanyBranchModel from '../../models/companyBranch.model.js'
import CompanyModel from '../../models/company.model.js'
import IndustryModel from '../../models/industry.model.js'
import EmployeeModel from '../../models/employee.model.js'

const getAssetsBaseUrl = () => {
  const port = process.env.PORT || 7200
  return process.env.APP_BASE_URL || `http://localhost:${port}`
}

const toImageUrl = (img) => {
  if (!img) return ''
  const p = typeof img === 'string' ? img : img?.path
  if (!p) return ''
  if (typeof p === 'string' && (p.startsWith('http://') || p.startsWith('https://'))) return p
  const base = getAssetsBaseUrl()
  return `${base}/assets/${p.startsWith('/') ? p.slice(1) : p}`
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

const formatVariants = (variants) => {
  if (!variants?.length) return '—'
  return variants.map((v) => v.variantName || '—').filter(Boolean).join(', ') || '—'
}

// Fixed Migti header (same as quotation PDF)
const MIGTI_COMPANY_NAME = 'Migti Industrial Pvt Ltd'
const MIGTI_GST_NUMBER = '23AARCM4143L1Z6'
const MIGTI_ADDRESS = '3rd Floor, M.S.-1, B-304, New Siyaganj, Indore, Madhya Pradesh 452003'
const MIGTI_EMAIL = 'sale.migtiindore@gmail.com'
const MIGTI_PHONE1 = '+91 7898611052'
const MIGTI_PHONE2 = ''

/**
 * Build HTML for Query PDF – same style/design as quotation PDF; no rate/total columns.
 */
const buildHtml = (query, orgContext = {}) => {
  const { industry } = orgContext || {}
  const ci = query.companyInfo || {}
  const prods = Array.isArray(query.products) ? query.products : []

  const queryCode = query.queryCode || `QR-${String(query._id || query.id).slice(-6)}`
  let queryDateWithTime = ''
  if (query.createdAt) {
    const d = new Date(query.createdAt)
    // Format created date/time explicitly in IST with 12-hour clock and AM/PM
    queryDateWithTime = d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
  }

  const customerName = ci.name || (industry && industry.name) || ''
  const customerAddress = ci.address || (industry && industry.address) || ''
  const pmList = Array.isArray(ci.purchaseManagers) ? ci.purchaseManagers : []
  const primaryPm = pmList[0] || null
  const customerContactPerson = (primaryPm && primaryPm.name) || (industry && industry.purchase_manager_name) || ''
  const customerPhone = (primaryPm && primaryPm.phone) || (industry && industry.purchase_manager_phone) || ''
  const customerEmail = (primaryPm && primaryPm.email) || (industry && industry.email) || ''
  const shippingAddress = customerAddress
  const shippingContactPerson = customerContactPerson

  const productRows = prods.map((p, index) => {
    const ref = typeof p.product_id === 'object' ? p.product_id : null
    const imageSources =
      (Array.isArray(p.images) && p.images.length && p.images) ||
      (Array.isArray(ref?.images) && ref.images.length && ref.images) ||
      []
    const firstImg = imageSources[0] || null
    const firstImgUrl = firstImg ? toImageUrl(firstImg) : ''
    const imgHtml = firstImgUrl
      ? `<img src="${escapeHtml(firstImgUrl)}" alt="" style="width:60px;height:60px;object-fit:cover;border:1px solid #ddd;" onerror="this.style.display='none'">`
      : '—'

    const hsn = p.hsnNumber || ref?.hsnNumber || '—'
    const qty = p.quantity != null ? p.quantity : ''
    const unit = p.unit || '—'
    const gstPercent =
      typeof p.gstPercentage === 'number' && !Number.isNaN(p.gstPercentage)
        ? p.gstPercentage
        : ref != null && typeof ref.gstPercentage === 'number' && !Number.isNaN(ref.gstPercentage)
          ? ref.gstPercentage
          : 0
    const descriptionText = (p.description || ref?.shortDescription || '').trim()
    const variantsText = formatVariants(p.variants || [])

    const remarkText = (p.remark && String(p.remark).trim()) ? escapeHtml(String(p.remark).trim()) : '—'
    return `
      <tr>
        <td class="cell text-center">${index + 1}</td>
        <td class="cell">
          <div class="product-name">${escapeHtml(p.productName || '—')}</div>
          ${descriptionText ? `<div class="product-description">${escapeHtml(descriptionText)}</div>` : ''}
        </td>
        <td class="cell">${escapeHtml(variantsText)}</td>
        <td class="cell product-remark-cell">${remarkText}</td>
        <td class="cell text-center">${escapeHtml(hsn)}</td>
        <td class="cell text-center image-cell">${imgHtml}</td>
        <td class="cell text-center">${qty || ''}</td>
        <td class="cell text-center">${escapeHtml(unit)}</td>
        <td class="cell text-center">${gstPercent ? gstPercent.toFixed(2) + '%' : '—'}</td>
      </tr>
    `
  })

  const productsBody =
    productRows.length > 0
      ? productRows
      : '<tr><td class="cell text-center" colspan="9">No products.</td></tr>'

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
      font-size: 12.5px;
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
      padding: 0 130px;
    }
    .pdf-header-company-name {
      font-size: 17px;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .pdf-header-line {
      font-size: 11px;
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
      font-size: 12px;
      font-weight: 600;
      margin: 8px 0 4px;
    }
    .query-meta-below-details {
      font-size: 11px;
      margin-top: 8px;
      padding-top: 6px;
      border-top: 1px solid #e8e8e8;
    }
    .query-meta-date {
      margin-top: 6px;
    }
    .query-meta-label {
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
      font-weight: 600;
      margin-bottom: 2px;
      font-size: 12px;
    }
    .product-description {
      font-size: 11px;
      color: #444;
      margin-bottom: 2px;
    }
    .product-remark {
      font-size: 11px;
      color: #666;
    }
    .product-remark-cell {
      font-size: 11px;
      color: #444;
      max-width: 180px;
      word-wrap: break-word;
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
      font-size: 12px;
      margin-bottom: 3px;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
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
    .summary-signature-wrapper {
      margin-top: 8px;
      display: flex;
      justify-content: flex-end;
      align-items: flex-start;
    }
    .signature {
      margin-top: 10px;
      text-align: right;
      font-size: 11px;
    }
    .signature-name {
      font-weight: 600;
      margin-top: 18px;
    }
  </style>
</head>
<body>
  <div class="pdf-header-row">
    <div class="pdf-header-logo-cell">
      <img src="https://migti.co.in/assets/images/logo.png" alt="" class="pdf-logo-header" onerror="this.style.display='none'">
    </div>
    <div class="pdf-header-center-cell">
      <div class="pdf-header-company-name">${escapeHtml(MIGTI_COMPANY_NAME)}</div>
      <div class="pdf-header-line"><span class="pdf-header-gst-label">GST No.</span> ${escapeHtml(MIGTI_GST_NUMBER)} &nbsp;|&nbsp; ${escapeHtml(MIGTI_ADDRESS)}</div>
      <div class="pdf-header-line"><span class="pdf-header-gst-label">Contact:</span> ${escapeHtml(MIGTI_PHONE1)}${MIGTI_PHONE2 ? `, ${escapeHtml(MIGTI_PHONE2)}` : ''} &nbsp;|&nbsp; ${escapeHtml(MIGTI_EMAIL)}</div>
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
        </table>
      </td>
      <td class="details-block" style="width: 45%;">
        <div class="block-title">Shipping Details</div>
        <table class="info-table">
          <tr>
            <td class="info-label">Shipping Address</td>
            <td class="info-value">${escapeHtml(shippingAddress || '')}</td>
          </tr>
          <tr>
            <td class="info-label">Contact Person</td>
            <td class="info-value">${escapeHtml(shippingContactPerson || '')}</td>
          </tr>
        </table>
        <div class="query-meta-below-details">
          <div><span class="query-meta-label">Query Code:</span> ${escapeHtml(queryCode)}</div>
          ${queryDateWithTime ? `<div class="query-meta-date"><span class="query-meta-label">Query Date:</span> ${escapeHtml(queryDateWithTime)}</div>` : ''}
        </div>
      </td>
    </tr>
  </table>

  <div class="section-title">Query Details</div>
  <table>
    <thead>
      <tr>
        <th>S.N.</th>
        <th>Item Name &amp; Description</th>
        <th>Variants</th>
        <th>Remark</th>
        <th>HSN Code</th>
        <th>Photo</th>
        <th>Qty.</th>
        <th>Unit</th>
        <th>GST %</th>
      </tr>
    </thead>
    <tbody>
      ${productsBody}
    </tbody>
  </table>

  <div class="summary-signature-wrapper">
    <div style="width: 100%; display: flex; flex-direction: column; align-items: flex-end;">
      <div class="signature">
        <div class="signature-name">For ${escapeHtml(MIGTI_COMPANY_NAME)}</div>
        <div>Authorised Signatory</div>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim()
}

export const exportQueryPdf = async ({
  queryId,
  branchFilter,
  currentUserId = null,
  isFullAccessRole = true,
}) => {
  const query = await getQueryById({
    queryId,
    branchFilter,
    currentUserId,
    isFullAccessRole,
  })

  let branch = null
  let company = null
  let industry = null
  let createdByEmployee = null
  let quotation = null

  if (query.branchId) {
    branch = await CompanyBranchModel.findById(query.branchId).lean()
    if (branch?.companyId) {
      company = await CompanyModel.findById(branch.companyId).lean()
    }
  }
  if (query.industry_id) {
    const industryId = typeof query.industry_id === 'object' ? query.industry_id._id : query.industry_id
    if (industryId) {
      industry = await IndustryModel.findById(industryId).select('name location address email purchase_manager_name purchase_manager_phone gstNumber').lean()
    }
  }
  if (query.created_by) {
    const creatorId = typeof query.created_by === 'object' ? query.created_by._id : query.created_by
    if (creatorId) {
      createdByEmployee = await EmployeeModel.findById(creatorId).select('name email phone').lean()
    }
  }
  try {
    quotation = await getQuotationByQueryId({
      queryId: query._id,
      branchFilter,
      currentUserId,
      isFullAccessRole,
    })
  } catch {
    quotation = null
  }

  const html = buildHtml(query, {
    branch,
    company,
    industry,
    createdByEmployee,
    quotation,
  })

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    await page.setContent(html, {
      waitUntil: ['networkidle0', 'load'],
      timeout: 30000,
    })
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
    })
    return { buffer: pdfBuffer, queryCode: query?.queryCode }
  } finally {
    await browser.close()
  }
}
