import puppeteer from 'puppeteer'
import { getQueryById } from './query.service.js'

const getAssetsBaseUrl = () => {
  const port = process.env.PORT || 7200
  return process.env.APP_BASE_URL || `http://localhost:${port}`
}

const toImageUrl = (img) => {
  if (!img?.path) return ''
  const p = img.path
  if (p.startsWith('http://') || p.startsWith('https://')) return p
  const base = getAssetsBaseUrl()
  return `${base}/assets/${p.startsWith('/') ? p.slice(1) : p}`
}

const formatVariants = (variants) => {
  if (!variants?.length) return '—'
  return variants.map((v) => v.variantName || '—').filter(Boolean).join(', ') || '—'
}

const buildHtml = (query) => {
  const ci = query.companyInfo || {}
  const prods = query.products || []
  const pmList = ci.purchaseManagers || []
  const pmText =
    pmList.length > 0
      ? pmList
          .map((m) => `${m.name || '–'}${m.phone ? ` • ${m.phone}` : ''}${m.email ? ` • ${m.email}` : ''}`)
          .join('; ')
      : ci.purchase_manager_name || ci.purchase_manager_phone
        ? `${ci.purchase_manager_name || '–'} • ${ci.purchase_manager_phone || ''}`
        : '–'

  const productRows = prods
    .map((p, index) => {
      const ref = typeof p.product_id === 'object' ? p.product_id : null
      const snapImgs = Array.isArray(p.images) ? p.images : []
      const refImgs = Array.isArray(ref?.images) ? ref.images : []
      const imgs = snapImgs.length ? snapImgs : refImgs
      const firstImgUrl = imgs[0] ? toImageUrl(imgs[0]) : ''
      const imgHtml = firstImgUrl
        ? `<img src="${firstImgUrl}" alt="" style="width:175px;height:175px;object-fit:cover;border:1px solid #ddd;" onerror="this.style.display='none'">`
        : '—'
      const desc = (ref?.shortDescription || p.description || '—').slice(0, 100)
      const gst =
        ref?.gstPercentage != null ? `${ref.gstPercentage}%` : p.gstPercentage != null ? `${p.gstPercentage}%` : '—'

      return `
        <tr>
          <td style="border:1px solid #333;padding:12px;text-align:center">${index + 1}</td>
          <td style="border:1px solid #333;padding:12px">${escapeHtml(p.productName || '—')}</td>
          <td class="small" style="border:1px solid #333;padding:12px">${escapeHtml(desc)}</td>
          <td style="border:1px solid #333;padding:12px;text-align:center">${p.quantity != null ? p.quantity : '—'}</td>
          <td style="border:1px solid #333;padding:12px">${escapeHtml(p.unit || '—')}</td>
          <td class="small" style="border:1px solid #333;padding:12px">${escapeHtml(formatVariants(p.variants))}</td>
          <td style="border:1px solid #333;padding:12px">${escapeHtml(ref?.hsnNumber || p.hsnNumber || '—')}</td>
          <td style="border:1px solid #333;padding:12px">${gst}</td>
          <td class="small" style="border:1px solid #333;padding:12px">${escapeHtml((p.remark || '—').slice(0, 50))}</td>
          <td style="border:1px solid #333;padding:12px;text-align:center">${imgHtml}</td>
        </tr>
      `
    })
    .join('')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    html, body { width: 100%; margin: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; }
    h1 { font-size: 18px; margin-bottom: 8px; }
    h2 { font-size: 14px; margin: 16px 0 8px; }
    table { border-collapse: collapse; width: 100%; margin: 10px 0; }
    th, td { border: 1px solid #333; padding: 8px; text-align: left; }
    th { background: #428bca; color: white; font-size: 10px; }
    .products-table th { font-size: 20px; }
    .products-table td { font-size: 24px; }
    .products-table td.small { font-size: 20px; }
    .company-table { width: 100%; }
    .company-table td { font-size: 24px; padding: 12px; }
    .company-table td:first-child { font-weight: bold; width: 140px; }
  </style>
</head>
<body>
  <h1>Query Details</h1>
  ${query.queryCode ? `<p><strong>Query Code:</strong> ${escapeHtml(query.queryCode)}</p>` : ''}

  <h2>1. Company Information</h2>
  <table class="company-table">
    <tr><td style="border:1px solid #333;padding:12px">Company name</td><td style="border:1px solid #333;padding:12px">${escapeHtml(ci.name || '-')}</td></tr>
    <tr><td style="border:1px solid #333;padding:12px">Location</td><td style="border:1px solid #333;padding:12px">${escapeHtml(ci.location || '-')}</td></tr>
    <tr><td style="border:1px solid #333;padding:12px">Address</td><td style="border:1px solid #333;padding:12px">${escapeHtml(ci.address || '-')}</td></tr>
    <tr><td style="border:1px solid #333;padding:12px">Purchase managers</td><td style="border:1px solid #333;padding:12px">${escapeHtml(pmText)}</td></tr>
  </table>

  <h2>2. Products</h2>
  <table class="products-table">
    <thead>
      <tr>
        <th>#</th>
        <th>Product name</th>
        <th>Description</th>
        <th>Qty</th>
        <th>Unit</th>
        <th>Variants</th>
        <th>HSN</th>
        <th>GST %</th>
        <th>Remark</th>
        <th>Image</th>
      </tr>
    </thead>
    <tbody>${productRows || '<tr><td colspan="10" style="border:1px solid #333;padding:8px">No products</td></tr>'}</tbody>
  </table>
</body>
</html>
  `.trim()
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

export const exportQueryPdf = async ({ queryId, branchFilter }) => {
  const query = await getQueryById({ queryId, branchFilter })
  const html = buildHtml(query)

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
