import puppeteer from 'puppeteer'
import { getQuotationById } from './quotation.service.js'
import CompanyBranchModel from '../../models/companyBranch.model.js'
import CompanyModel from '../../models/company.model.js'

const getAssetsBaseUrl = () => {
  const port = process.env.PORT || 7200
  return process.env.APP_BASE_URL || `http://localhost:${port}`
}

const toImageUrl = (img) => {
  if (!img) return ''
  const p = typeof img === 'string' ? img : img.path
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

const hasRate = (p) =>
  p.rate != null && !Number.isNaN(Number(p.rate)) && Number(p.rate) >= 0

const formatCurrency = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '0.00'
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Build HTML for quotation PDF to match structured design.
 * Uses existing quotation data plus branch/company (for header).
 */
const buildHtml = (quotation, orgContext = {}) => {
  const { branch, company } = orgContext || {}
  const ci = quotation.companyInfo || {}
  const allProducts = Array.isArray(quotation.products) ? quotation.products : []
  const prods = allProducts.filter(hasRate)

  let totalTaxable = 0
  let totalCgst = 0
  let totalSgst = 0

  // Dates
  const createdDate = quotation.createdAt
    ? new Date(quotation.createdAt).toLocaleDateString()
    : ''
  const validUntil = quotation.validUntil
    ? new Date(quotation.validUntil).toLocaleDateString()
    : ''

  const quotationCode =
    quotation.quotationCode || `QT-${String(quotation._id || quotation.id).slice(-6)}`

  // Header (company / branch) information
  const gstNumber = branch?.gstNumber || company?.gst || ''
  const companyDisplayName =
    company?.brandName || company?.name || branch?.name || ''
  const companyAddress =
    branch?.fullAddress || branch?.address || company?.address || ''
  const companyPhone = branch?.phone || company?.mobile || ''
  const companyEmail = branch?.email || company?.email || ''
  const companyTagline =
    company?.website || ''

  // Customer & shipping information
  const industry = quotation.industry_id || {}
  const queryCompanyInfo =
    quotation.queryId && quotation.queryId.companyInfo
      ? quotation.queryId.companyInfo
      : {}

  const customerName =
    ci.name || queryCompanyInfo.name || industry.name || ''
  const customerAddress =
    ci.address || queryCompanyInfo.address || industry.address || ''

  const pmList = Array.isArray(ci.purchaseManagers) ? ci.purchaseManagers : []
  const primaryPm =
    pmList[0] ||
    null

  const customerContactPerson =
    (primaryPm && primaryPm.name) ||
    industry.purchase_manager_name ||
    ''
  const customerPhone =
    (primaryPm && primaryPm.phone) ||
    industry.purchase_manager_phone ||
    ''
  const customerEmail =
    (primaryPm && primaryPm.email) ||
    ci.email ||
    queryCompanyInfo.email ||
    industry.email ||
    ''

  const shippingAddress = customerAddress
  const shippingContactPerson = customerContactPerson

  const queryCode = quotation.queryId?.queryCode || ''
  const queryDate = quotation.queryId?.createdAt
    ? new Date(quotation.queryId.createdAt).toLocaleDateString()
    : ''

  const productRows = prods
    .map((p, index) => {
      const qty = Number(p.quantity) || 0
      const rate = Number(p.rate) || 0
      const taxable = qty * rate

      const gstPercent =
        typeof p.gstPercentage === 'number' && !Number.isNaN(p.gstPercentage)
          ? p.gstPercentage
          : 0
      const cgstPercent = gstPercent / 2
      const sgstPercent = gstPercent - cgstPercent

      const cgstAmount = taxable * (cgstPercent / 100)
      const sgstAmount = taxable * (sgstPercent / 100)
      const lineTotal = taxable + cgstAmount + sgstAmount

      totalTaxable += taxable
      totalCgst += cgstAmount
      totalSgst += sgstAmount

      const productRef = typeof p.product_id === 'object' ? p.product_id : null
      const imageSources =
        (Array.isArray(p.images) && p.images.length && p.images) ||
        (Array.isArray(productRef?.images) && productRef.images.length && productRef.images) ||
        []
      const firstImg = imageSources[0] || null
      const firstImgUrl = firstImg ? toImageUrl(firstImg) : ''
      const imgHtml = firstImgUrl
        ? `<img src="${escapeHtml(
            firstImgUrl,
          )}" alt="" style="width:60px;height:60px;object-fit:cover;border:1px solid #ddd;" onerror="this.style.display='none'">`
        : '—'

      const hsn = p.hsnNumber || productRef?.hsnNumber || '—'
      const expDelivery = validUntil || '—'

      return `
        <tr>
          <td class="cell text-center">${index + 1}</td>
          <td class="cell">
            <div class="product-name">${escapeHtml(p.productName || '—')}</div>
            ${
              p.remark
                ? `<div class="product-remark">${escapeHtml(String(p.remark))}</div>`
                : ''
            }
          </td>
          <td class="cell text-center">${escapeHtml(hsn)}</td>
          <td class="cell text-center image-cell">${imgHtml}</td>
          <td class="cell text-center">${escapeHtml(expDelivery)}</td>
          <td class="cell text-center">${qty || ''}</td>
          <td class="cell text-center">${escapeHtml(p.unit || '')}</td>
          <td class="cell text-right">${rate ? formatCurrency(rate) : ''}</td>
          <td class="cell text-right">${taxable ? formatCurrency(taxable) : ''}</td>
        </tr>
      `
    })
    .join('')

  const effectiveCgstPercent =
    totalTaxable > 0 ? (totalCgst / totalTaxable) * 100 : 0
  const effectiveSgstPercent =
    totalTaxable > 0 ? (totalSgst / totalTaxable) * 100 : 0

  const freightCharge = 0
  const packingCharge = 0
  const taxableAfterCharges = totalTaxable + freightCharge + packingCharge

  const igstAmount = 0
  const effectiveIgstPercent = 0

  const grossAmount = taxableAfterCharges + totalCgst + totalSgst + igstAmount

  const productsBody =
    productRows ||
    '<tr><td class="cell text-center" colspan="9">No products with rate.</td></tr>'

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
      font-size: 11px;
      color: #222;
      padding: 14px 16px;
    }
    .header-grid {
      display: table;
      width: 100%;
      border-bottom: 2px solid #444;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }
    .header-cell {
      display: table-cell;
      vertical-align: top;
    }
    .header-left {
      width: 35%;
      padding-right: 8px;
      font-size: 10px;
    }
    .header-right {
      width: 65%;
      text-align: right;
      font-size: 10px;
    }
    .gst-label {
      font-weight: 600;
    }
    .company-name {
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 2px;
    }
    .company-line {
      margin: 1px 0;
    }
    .company-tagline {
      margin-top: 3px;
      font-style: italic;
      color: #555;
    }
    .section-title {
      font-size: 12px;
      font-weight: 600;
      margin: 8px 0 4px;
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
      padding: 5px 4px;
      font-size: 9px;
      font-weight: 600;
      text-align: center;
      white-space: nowrap;
    }
    .cell {
      border: 1px solid #ddd;
      padding: 4px 4px;
      font-size: 9px;
      vertical-align: top;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .product-name {
      font-weight: 600;
      margin-bottom: 2px;
    }
    .product-remark {
      font-size: 8px;
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
    }
    .details-grid td {
      vertical-align: top;
      padding: 0;
    }
    .details-block {
      padding-right: 6px;
    }
    .block-title {
      font-weight: 600;
      font-size: 11px;
      margin-bottom: 3px;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5px;
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
      font-size: 9px;
    }
    .summary-signature-wrapper {
      margin-top: 8px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .terms {
      width: 55%;
      font-size: 9.5px;
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
      font-size: 9.5px;
    }
    .summary-table {
      border-collapse: collapse;
      min-width: 230px;
      font-size: 9.5px;
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
      font-size: 10px;
    }
    .signature-name {
      font-weight: 600;
      margin-top: 18px;
    }
    .muted {
      color: #666;
      font-size: 8px;
    }
    .pdf-logo-wrap {
      text-align: center;
      margin-bottom: 14px;
    }
    .pdf-logo {
      width: 135px;
      height: auto;
      max-height: 60px;
      object-fit: contain;
      display: inline-block;
    }
  </style>
</head>
<body>
  <div class="pdf-logo-wrap">
    <img src="https://migti.co.in/assets/images/logo.png" alt="" class="pdf-logo" onerror="this.style.display='none'">
  </div>
  <div class="header-grid">
    <div class="header-cell header-left">
      <div class="gst-label">GST No.</div>
      <div>${escapeHtml(gstNumber || '')}</div>
    </div>
    <div class="header-cell header-right">
      <div class="company-name">${escapeHtml(companyDisplayName || '')}</div>
      ${
        companyAddress
          ? `<div class="company-line">${escapeHtml(companyAddress)}</div>`
          : ''
      }
      ${
        companyPhone
          ? `<div class="company-line">Mobile: ${escapeHtml(companyPhone)}</div>`
          : ''
      }
      ${
        companyEmail
          ? `<div class="company-line">Email: ${escapeHtml(companyEmail)}</div>`
          : ''
      }
      ${
        companyTagline
          ? `<div class="company-tagline">${escapeHtml(companyTagline)}</div>`
          : ''
      }
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
        <div class="meta-small">
          ${queryCode ? `<div><strong>Query No:</strong> ${escapeHtml(queryCode)}</div>` : ''}
          ${
            queryDate
              ? `<div><strong>Query Date:</strong> ${escapeHtml(queryDate)}</div>`
              : ''
          }
          ${
            quotationCode
              ? `<div><strong>Quotation No:</strong> ${escapeHtml(quotationCode)}</div>`
              : ''
          }
          ${
            createdDate
              ? `<div><strong>Quotation Date:</strong> ${escapeHtml(
                  createdDate,
                )}</div>`
              : ''
          }
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
        <th>HSN Code</th>
        <th>Photo</th>
        <th>Expected Delivery</th>
        <th>Qty.</th>
        <th>Unit</th>
        <th>Unit Price</th>
        <th>Total</th>
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
        <li>Validity – Offer valid for 7 days from quotation date.</li>
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
          <td class="summary-value">₹${formatCurrency(freightCharge)}</td>
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
          <td class="summary-label">
            CGST (${effectiveCgstPercent ? effectiveCgstPercent.toFixed(2) : '0.00'}%)
          </td>
          <td class="summary-value">₹${formatCurrency(totalCgst)}</td>
        </tr>
        <tr>
          <td class="summary-label">
            SGST (${effectiveSgstPercent ? effectiveSgstPercent.toFixed(2) : '0.00'}%)
          </td>
          <td class="summary-value">₹${formatCurrency(totalSgst)}</td>
        </tr>
        <tr>
          <td class="summary-label">
            IGST (${effectiveIgstPercent.toFixed(2)}%)
          </td>
          <td class="summary-value">₹${formatCurrency(igstAmount)}</td>
        </tr>
        <tr class="grand-total-row">
          <td class="summary-label">Total Gross Amount</td>
          <td class="summary-value">₹${formatCurrency(grossAmount)}</td>
        </tr>
      </table>
      <div class="signature">
        ${
          companyDisplayName
            ? `<div class="signature-name">For ${escapeHtml(companyDisplayName)}</div>`
            : ''
        }
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
}) => {
  const quotation = await getQuotationById({
    quotationId,
    branchFilter,
    currentUserId,
    isFullAccessRole,
  })

  let branch = null
  let company = null
  if (quotation.branchId) {
    branch = await CompanyBranchModel.findById(quotation.branchId).lean()
    if (branch?.companyId) {
      company = await CompanyModel.findById(branch.companyId).lean()
    }
  }

  const html = buildHtml(quotation, { branch, company })

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
    const quotationCode =
      quotation.quotationCode || `QT-${String(quotation._id).slice(-6)}`
    return { buffer: pdfBuffer, quotationCode }
  } finally {
    await browser.close()
  }
}
