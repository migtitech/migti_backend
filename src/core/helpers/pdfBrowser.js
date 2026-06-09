import puppeteer from 'puppeteer'

const BROWSER_IDLE_MS = 5 * 60 * 1000
const IMAGE_LOAD_TIMEOUT_MS = 1500

const LAUNCH_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
]

let browserPromise = null
let browserIdleTimer = null

const launchBrowser = () =>
  puppeteer.launch({
    headless: true,
    args: LAUNCH_ARGS,
  })

const getBrowser = async () => {
  if (browserPromise) {
    const existing = await browserPromise
    if (existing.isConnected()) return existing
  }
  browserPromise = launchBrowser()
  return browserPromise
}

const scheduleBrowserClose = () => {
  if (browserIdleTimer) clearTimeout(browserIdleTimer)
  browserIdleTimer = setTimeout(async () => {
    if (!browserPromise) return
    try {
      const browser = await browserPromise
      if (browser.isConnected()) await browser.close()
    } catch (_err) {
      // ignore shutdown errors
    } finally {
      browserPromise = null
    }
  }, BROWSER_IDLE_MS)
}

const waitForImages = async (page) => {
  await page.evaluate(async (timeoutMs) => {
    const imgs = Array.from(document.images || [])
    const pending = imgs.filter(
      (img) => !img.complete && !String(img.src || '').startsWith('data:')
    )
    if (!pending.length) return
    await Promise.all(
      pending.map(
        (img) =>
          new Promise((resolve) => {
            const done = () => resolve()
            img.addEventListener('load', done, { once: true })
            img.addEventListener('error', done, { once: true })
            setTimeout(done, timeoutMs)
          })
      )
    )
  }, IMAGE_LOAD_TIMEOUT_MS)
}

const configurePageForPdf = async (page) => {
  await page.setRequestInterception(true)
  page.on('request', (req) => {
    const type = req.resourceType()
    if (['font', 'stylesheet', 'media'].includes(type)) {
      req.abort()
      return
    }
    req.continue()
  })
}

/**
 * Render HTML to PDF using a reused headless browser instance.
 */
export const renderHtmlToPdf = async (html, pdfOptions = {}) => {
  const browser = await getBrowser()
  const page = await browser.newPage()

  try {
    await configurePageForPdf(page)
    await page.setContent(html, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    })
    await waitForImages(page)

    return await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
      ...pdfOptions,
    })
  } finally {
    await page.close()
    scheduleBrowserClose()
  }
}

/** Warm up Chromium so the first PDF export is not blocked on browser launch. */
export const prewarmPdfBrowser = async () => {
  try {
    const browser = await getBrowser()
    const page = await browser.newPage()
    await page.setContent('<html><body></body></html>', {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    })
    await page.close()
  } catch (err) {
    console.error('PDF browser prewarm failed', err)
  }
}
