import puppeteer from 'puppeteer'
import { getQuotationById } from './quotation.service.js'

const getAssetsBaseUrl = () => {
  const port = process.env.PORT || 7200
  return process.env.APP_BASE_URL || `http://localhost:${port}`
}

const toImageUrl = (img) => {
  if (!img?.path) return ''
  const p = img.path
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

/**
 * Build HTML for quotation PDF: products with rate only, with image column (first product image as <img>).
 */
const buildHtml = (quotation) => {
  const ci = quotation.companyInfo || {}
  const allProducts = quotation.products || []
  const prods = allProducts.filter(hasRate)
  const CGST_RATE = 0.09
  const SGST_RATE = 0.09

  let totalTaxable = 0
  let totalCgst = 0
  let totalSgst = 0
  let grandTotal = 0

  const createdDate = quotation.createdAt
    ? new Date(quotation.createdAt).toLocaleDateString()
    : ''
  const validUntil = quotation.validUntil
    ? new Date(quotation.validUntil).toLocaleDateString()
    : ''

  const productRows = prods
    .map((p, index) => {
      const qty = Number(p.quantity) || 0
      const rate = Number(p.rate) || 0
      const amount = qty * rate
      const cgst = amount * CGST_RATE
      const sgst = amount * SGST_RATE
      const lineTotal = amount + cgst + sgst
      totalTaxable += amount
      totalCgst += cgst
      totalSgst += sgst
      grandTotal += lineTotal

      const imgs = Array.isArray(p.images) ? p.images : []
      const firstImgUrl = imgs[0] ? toImageUrl(imgs[0]) : ''
      const imgHtml = firstImgUrl
        ? `<img src="${escapeHtml(firstImgUrl)}" alt="" style="width:175px;height:175px;object-fit:cover;border:1px solid #ddd;" onerror="this.style.display='none'">`
        : '—'

      const hsn = p.hsnNumber || '—'
      const expDelivery = validUntil || '—'

      return `
        <tr>
          <td style="border:1px solid #333;padding:6px;text-align:center">${index + 1}</td>
          <td style="border:1px solid #333;padding:6px">${escapeHtml((p.productName || '—').slice(0, 50))}</td>
          <td style="border:1px solid #333;padding:6px">${escapeHtml(hsn)}</td>
          <td style="border:1px solid #333;padding:6px;text-align:center;vertical-align:middle">${imgHtml}</td>
          <td style="border:1px solid #333;padding:6px;text-align:center">${qty || '—'}</td>
          <td style="border:1px solid #333;padding:6px">${escapeHtml(p.unit || '—')}</td>
          <td style="border:1px solid #333;padding:6px;text-align:right">${rate ? rate.toFixed(2) : '—'}</td>
          <td style="border:1px solid #333;padding:6px;text-align:right">${amount ? amount.toFixed(2) : '—'}</td>
          <td style="border:1px solid #333;padding:6px">${escapeHtml(expDelivery)}</td>
          <td style="border:1px solid #333;padding:6px;text-align:right">${cgst ? cgst.toFixed(2) : '—'}</td>
          <td style="border:1px solid #333;padding:6px;text-align:right">${sgst ? sgst.toFixed(2) : '—'}</td>
          <td style="border:1px solid #333;padding:6px;text-align:right">${lineTotal ? lineTotal.toFixed(2) : '—'}</td>
        </tr>
      `
    })
    .join('')

  const quotationCode =
    quotation.quotationCode || `QT-${String(quotation._id || quotation.id).slice(-6)}`

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    html, body { width: 100%; margin: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; padding: 16px; }
    h1 { font-size: 16px; margin-bottom: 6px; }
    h2 { font-size: 13px; margin: 12px 0 6px; }
    table { border-collapse: collapse; width: 100%; margin: 8px 0; }
    th, td { border: 1px solid #333; padding: 6px; text-align: left; }
    th { background: #28a745; color: white; font-size: 9px; }
    .products-table td { font-size: 9px; }
    .company-table { width: 100%; margin-bottom: 12px; }
    .company-table td { font-size: 11px; padding: 8px; }
    .company-table td:first-child { font-weight: bold; width: 140px; }
    .totals { margin-top: 12px; font-size: 11px; }
    .totals p { margin: 4px 0; }
  </style>
</head>
<body>
  <h1>Quotation: ${escapeHtml(quotationCode)}</h1>
  ${ci.name ? `<p><strong>Company:</strong> ${escapeHtml(ci.name)}</p>` : ''}
  ${createdDate ? `<p><strong>Created:</strong> ${escapeHtml(createdDate)}</p>` : ''}
  ${validUntil ? `<p><strong>Expected Delivery:</strong> ${escapeHtml(validUntil)}</p>` : ''}

  <h2>Products (with rate)</h2>
  <table class="products-table">
    <thead>
      <tr>
        <th>S.No</th>
        <th>Product</th>
        <th>HSN</th>
        <th>Image</th>
        <th>Qty</th>
        <th>Unit</th>
        <th>Rate</th>
        <th>Amount</th>
        <th>Exp. Delivery</th>
        <th>CGST 9%</th>
        <th>SGST 9%</th>
        <th>Line Total</th>
      </tr>
    </thead>
    <tbody>${productRows || '<tr><td colspan="12" style="border:1px solid #333;padding:8px">No products with rate</td></tr>'}</tbody>
  </table>

  <div class="totals">
    <p><strong>Taxable Amount:</strong> ${totalTaxable.toFixed(2)}</p>
    <p><strong>CGST 9%:</strong> ${totalCgst.toFixed(2)}</p>
    <p><strong>SGST 9%:</strong> ${totalSgst.toFixed(2)}</p>
    <p><strong>Grand Total:</strong> ${grandTotal.toFixed(2)}</p>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Export quotation as PDF (products with rate only), with product images like query PDF.
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
  const html = buildHtml(quotation)

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
