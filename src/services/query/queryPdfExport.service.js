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

const MIN_TABLE_ROWS = 10

/**
 * Build HTML for Query PDF to match reference design (header, company/query info, items table, terms, footer).
 * All values from query and orgContext; no hardcoded data.
 */
const buildHtml = (query, orgContext = {}) => {
  const { branch, company, industry, createdByEmployee, quotation } = orgContext || {}
  const ci = query.companyInfo || {}
  const prods = Array.isArray(query.products) ? query.products : []

  const queryCode = query.queryCode || ''
  const queryDate = query.createdAt
    ? new Date(query.createdAt).toLocaleDateString()
    : ''
  const quotationCode = quotation?.quotationCode || ''
  const finalStatus = query.status || ''

  const companyName = ci.name || (industry && industry.name) || ''
  const customerAddress = ci.address || (industry && industry.address) || ''
  const customerLocation = ci.location || (industry && industry.location) || ''
  const gstin = (industry && industry.gstNumber) || ''
  const queryOwnerName = (createdByEmployee && createdByEmployee.name) || (query.created_by && (query.created_by.name || query.created_by.email)) || ''
  const queryOwnerMobile = (createdByEmployee && createdByEmployee.phone) || ''
  const queryReferenceBy = ''

  const headerGst = branch?.gstNumber || company?.gst || ''
  const headerCompanyName = company?.brandName || company?.name || (branch && branch.name) || ''
  const headerAddress = branch?.fullAddress || branch?.address || company?.address || ''
  const headerCityPincode = branch?.address || ''
  const headerMobile = branch?.phone || company?.mobile || ''
  const headerEmail = branch?.email || company?.email || ''

  const productRows = prods.map((p, index) => {
    const ref = typeof p.product_id === 'object' ? p.product_id : null
    const snapImgs = Array.isArray(p.images) ? p.images : []
    const refImgs = Array.isArray(ref?.images) ? ref.images : []
    const imgs = snapImgs.length ? snapImgs : refImgs
    const firstImg = imgs[0] || null
    const firstImgUrl = firstImg ? toImageUrl(firstImg) : ''
    const imgHtml = firstImgUrl
      ? `<img src="${escapeHtml(firstImgUrl)}" alt="" class="item-img" onerror="this.style.display='none'">`
      : ''
    const itemName = p.productName || '—'
    const materialDesc = ref?.shortDescription || p.remark || formatVariants(p.variants) || '—'
    const qty = p.quantity != null ? p.quantity : ''
    const unit = p.unit || '—'
    const expectedTime = ''
    const clientTargetPrice = ''

    return `
      <tr>
        <td class="cell cell-center">${index + 1}</td>
        <td class="cell">${escapeHtml(itemName)}</td>
        <td class="cell cell-desc">${escapeHtml(String(materialDesc).slice(0, 120))}</td>
        <td class="cell cell-center cell-img">${imgHtml}</td>
        <td class="cell cell-center cell-num">${qty}</td>
        <td class="cell cell-center">${escapeHtml(unit)}</td>
        <td class="cell cell-center">${escapeHtml(expectedTime)}</td>
        <td class="cell cell-right">${escapeHtml(clientTargetPrice)}</td>
      </tr>
    `
  })

  const emptyRowCount = Math.max(0, MIN_TABLE_ROWS - productRows.length)
  const emptyRows = Array(emptyRowCount)
    .fill(0)
    .map(
      () => `
      <tr>
        <td class="cell cell-center"></td>
        <td class="cell"></td>
        <td class="cell"></td>
        <td class="cell cell-center cell-img"></td>
        <td class="cell cell-center cell-num"></td>
        <td class="cell cell-center"></td>
        <td class="cell cell-center"></td>
        <td class="cell cell-right"></td>
      </tr>
    `,
    )
    .join('')

  const itemsBody =
    productRows.length > 0
      ? productRows + emptyRows
      : Array(MIN_TABLE_ROWS)
          .fill(0)
          .map(
            () => `
      <tr>
        <td class="cell cell-center"></td>
        <td class="cell"></td>
        <td class="cell"></td>
        <td class="cell cell-center cell-img"></td>
        <td class="cell cell-center cell-num"></td>
        <td class="cell cell-center"></td>
        <td class="cell cell-center"></td>
        <td class="cell cell-right"></td>
      </tr>
    `,
          )
          .join('')

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
      padding: 12px 14px;
    }
    .header-top {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 0;
    }
    .header-top td {
      vertical-align: middle;
      padding: 8px 10px;
      border: 1px solid #1a3a52;
    }
    .gst-cell {
      width: 22%;
      background: #5b9bd5;
      color: white;
      font-size: 10px;
      font-weight: 600;
    }
    .company-name-cell {
      width: 78%;
      background: #1a3a52;
      color: white;
      font-size: 16px;
      font-weight: 700;
      text-align: center;
      letter-spacing: 0.5px;
    }
    .header-contact {
      margin-top: 4px;
      font-size: 10px;
      text-align: right;
      line-height: 1.4;
      padding-right: 4px;
    }
    .info-section {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      margin-bottom: 8px;
    }
    .info-section td {
      border: 1px solid #333;
      padding: 4px 6px;
      font-size: 10px;
      vertical-align: top;
    }
    .info-label {
      width: 28%;
      font-weight: 600;
      background: #f5f5f5;
    }
    .info-value { width: 72%; }
    .info-section .meta-col .info-label { width: 32%; }
    .info-section .meta-col .info-value { width: 68%; }
    .section-banner {
      background: #1a3a52;
      color: white;
      font-size: 13px;
      font-weight: 700;
      text-align: center;
      padding: 6px 10px;
      margin: 8px 0 0;
      letter-spacing: 0.5px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 0;
      page-break-inside: auto;
    }
    .items-table thead { display: table-header-group; }
    .items-table tr { page-break-inside: avoid; }
    .items-table th {
      background: #5b9bd5;
      color: #222;
      border: 1px solid #333;
      padding: 5px 4px;
      font-size: 9px;
      font-weight: 600;
      text-align: center;
    }
    .items-table .cell {
      border: 1px solid #333;
      padding: 4px 5px;
      font-size: 9px;
      vertical-align: middle;
    }
    .cell-center { text-align: center; }
    .cell-right { text-align: right; }
    .cell-desc { max-width: 140px; word-wrap: break-word; }
    .cell-img { width: 72px; text-align: center; }
    .cell-num { text-align: right; }
    .item-img {
      width: 48px;
      height: 48px;
      object-fit: cover;
      border: 1px solid #ddd;
      display: block;
      margin: 0 auto;
    }
    .terms-section {
      margin-top: 8px;
      border: 1px solid #333;
      padding: 8px 10px;
      min-height: 60px;
    }
    .terms-title {
      font-weight: 700;
      font-size: 11px;
      margin-bottom: 4px;
    }
    .footer-row {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    .footer-row td {
      border: 1px solid #333;
      padding: 8px 6px;
      font-size: 10px;
      font-weight: 600;
      text-align: center;
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
  <table class="header-top">
    <tr>
      <td class="gst-cell">Gst No - ${escapeHtml(headerGst || '')}</td>
      <td class="company-name-cell">${escapeHtml(headerCompanyName || '').toUpperCase()}</td>
    </tr>
  </table>
  <div class="header-contact">
    ${headerAddress ? `Address - ${escapeHtml(headerAddress)}<br>` : ''}
    ${headerCityPincode ? `${escapeHtml(headerCityPincode)}<br>` : ''}
    ${headerMobile ? `Mobile No-${escapeHtml(headerMobile)}<br>` : ''}
    ${headerEmail ? `Email-${escapeHtml(headerEmail)}` : ''}
  </div>

  <table class="info-section">
    <tr>
      <td class="info-label">COMPANY NAME</td>
      <td class="info-value">${escapeHtml(companyName)}</td>
      <td class="info-label meta-col">QUERY NO</td>
      <td class="info-value meta-col">${escapeHtml(queryCode)}</td>
    </tr>
    <tr>
      <td class="info-label">ADDRESS</td>
      <td class="info-value">${escapeHtml(customerAddress)}</td>
      <td class="info-label meta-col">QUOTATION NO</td>
      <td class="info-value meta-col">${escapeHtml(quotationCode)}</td>
    </tr>
    <tr>
      <td class="info-label">GSTIN</td>
      <td class="info-value">${escapeHtml(gstin)}</td>
      <td class="info-label meta-col">FINAL STATUS</td>
      <td class="info-value meta-col">${escapeHtml(finalStatus)}</td>
    </tr>
    <tr>
      <td class="info-label">Query Owner & MOBILE NO</td>
      <td class="info-value">${escapeHtml(queryOwnerName)}${queryOwnerMobile ? ' &nbsp; ' + escapeHtml(queryOwnerMobile) : ''}</td>
      <td class="info-label meta-col"></td>
      <td class="info-value meta-col"></td>
    </tr>
    <tr>
      <td class="info-label">Query Date</td>
      <td class="info-value">${escapeHtml(queryDate)}</td>
      <td class="info-label meta-col"></td>
      <td class="info-value meta-col"></td>
    </tr>
    <tr>
      <td class="info-label">Query Reference by</td>
      <td class="info-value">${escapeHtml(queryReferenceBy)}</td>
      <td class="info-label meta-col"></td>
      <td class="info-value meta-col"></td>
    </tr>
  </table>

  <div class="section-banner">QUERY DETAILS</div>

  <table class="items-table">
    <thead>
      <tr>
        <th>SR. No.</th>
        <th>Item Name</th>
        <th>Material Description</th>
        <th>IMAGE</th>
        <th>Req. Qty.</th>
        <th>UNIT</th>
        <th>Expected Time</th>
        <th>Client Target Price</th>
      </tr>
    </thead>
    <tbody>
      ${itemsBody}
    </tbody>
  </table>

  <div class="terms-section">
    <div class="terms-title">Terms & Conditions</div>
  </div>

  <table class="footer-row">
    <tr>
      <td style="width:25%">DRAFT BY</td>
      <td style="width:25%">CHECK BY</td>
      <td style="width:25%">APPROVE BY</td>
      <td style="width:25%">For ${escapeHtml(headerCompanyName || 'MIGTI INDUSTRIAL PVT LTD').toUpperCase()}</td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

export const exportQueryPdf = async ({ queryId, branchFilter }) => {
  const query = await getQueryById({ queryId, branchFilter })

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
    quotation = await getQuotationByQueryId({ queryId: query._id, branchFilter })
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
