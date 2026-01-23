/**
 * Puppeteer utilities for scraping government portals
 * These portals use JavaScript rendering so we need a real browser
 */

import puppeteer, { Browser, Page } from 'puppeteer'

let browserInstance: Browser | null = null

/**
 * Get or create a browser instance (singleton pattern for efficiency)
 */
export async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.connected) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080',
      ],
    })
  }
  return browserInstance
}

/**
 * Close the browser instance
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close()
    browserInstance = null
  }
}

/**
 * Create a new page with common settings
 */
export async function createPage(browser: Browser): Promise<Page> {
  const page = await browser.newPage()

  // Set viewport
  await page.setViewport({ width: 1920, height: 1080 })

  // Set user agent to avoid bot detection
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  )

  // Set default navigation timeout
  page.setDefaultNavigationTimeout(30000)
  page.setDefaultTimeout(30000)

  return page
}

/**
 * Wait for content to load with multiple strategies
 */
export async function waitForContent(
  page: Page,
  options: {
    selector?: string
    text?: string
    timeout?: number
  } = {}
): Promise<void> {
  const { selector, text, timeout = 10000 } = options

  if (selector) {
    await page.waitForSelector(selector, { timeout })
  } else if (text) {
    await page.waitForFunction(
      (searchText) => document.body.innerText.includes(searchText),
      { timeout },
      text
    )
  } else {
    // Wait for network to be idle
    await page.waitForNetworkIdle({ timeout })
  }
}

/**
 * Safe page evaluation with error handling
 */
export async function safeEvaluate<T>(
  page: Page,
  fn: () => T,
  defaultValue: T
): Promise<T> {
  try {
    return await page.evaluate(fn)
  } catch (error) {
    console.error('Evaluation error:', error)
    return defaultValue
  }
}

/**
 * Extract table data from a page
 */
export async function extractTableData(
  page: Page,
  tableSelector: string
): Promise<string[][]> {
  return await page.evaluate((selector) => {
    const table = document.querySelector(selector)
    if (!table) return []

    const rows: string[][] = []
    const rowElements = table.querySelectorAll('tr')

    rowElements.forEach((row) => {
      const cells: string[] = []
      row.querySelectorAll('td, th').forEach((cell) => {
        cells.push((cell.textContent || '').trim())
      })
      if (cells.length > 0) {
        rows.push(cells)
      }
    })

    return rows
  }, tableSelector)
}

/**
 * Handle common CAPTCHA scenarios
 * Returns true if CAPTCHA was detected
 */
export async function detectCaptcha(page: Page): Promise<boolean> {
  const captchaIndicators = [
    'captcha',
    'recaptcha',
    'g-recaptcha',
    'hcaptcha',
    'challenge',
  ]

  const pageContent = await page.content()
  const pageContentLower = pageContent.toLowerCase()

  return captchaIndicators.some((indicator) =>
    pageContentLower.includes(indicator)
  )
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      if (attempt < maxRetries - 1) {
        const delay = baseDelayMs * Math.pow(2, attempt)
        console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

/**
 * Take a screenshot for debugging
 */
export async function debugScreenshot(
  page: Page,
  name: string
): Promise<void> {
  if (process.env.DEBUG_SCREENSHOTS === 'true') {
    await page.screenshot({
      path: `/tmp/debug-${name}-${Date.now()}.png`,
      fullPage: true,
    })
  }
}
