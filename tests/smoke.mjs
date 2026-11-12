import assert from 'node:assert/strict'
import { chromium } from 'playwright-core'

const browserPath =
  process.env.EDGE_PATH ||
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const baseUrl = process.env.SMOKE_URL || 'http://127.0.0.1:5173/'

const browser = await chromium.launch({ executablePath: browserPath, headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
page.setDefaultTimeout(10_000)

const errors = []
page.on('pageerror', (error) => errors.push(error.message))
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text())
})

await page.goto(baseUrl, { waitUntil: 'networkidle' })
assert.equal(await page.title(), "SERMS Modern · St. Peter's College")
await page.getByRole('button', { name: 'Open demo', exact: true }).click()
await page.keyboard.press('Control+K')
await page.locator('.command__input').fill('OR-2026')
assert.equal(await page.locator('.command__group-label').filter({ hasText: 'Receipts' }).count(), 1)
await page.keyboard.press('Escape')
await page.locator('.nav-item').filter({ hasText: 'Students' }).click()
assert.equal(await page.locator('.page-title').innerText(), 'Students')

await page.getByRole('textbox', { name: 'Search students' }).fill('Maria')
assert.equal(await page.locator('tbody tr').count(), 1)
const [download] = await Promise.all([
  page.waitForEvent('download'),
  page.getByRole('button', { name: 'Export list' }).click(),
])
assert.match(download.suggestedFilename(), /^serms-students-\d{4}-\d{2}-\d{2}\.csv$/)
await page.locator('tbody tr').first().click()
assert.match(await page.locator('.student-hero__name').innerText(), /Maria Clara/)

for (const tab of ['Enrollment', 'Assessment', 'Payments', 'Grades', 'Documents']) {
  await page.getByRole('tab', { name: new RegExp(tab) }).click()
}
await page.getByRole('tab', { name: 'Overview' }).click()
await page.getByRole('button', { name: 'Print COR' }).click()
assert.equal(await page.locator('.document-sheet').count(), 1)
await page.getByRole('button', { name: 'Close', exact: true }).click()

await page.locator('.nav-item').filter({ hasText: 'Academics' }).click()
await page.getByRole('button', { name: 'Open', exact: true }).first().click()
assert.ok((await page.locator('.modal tbody tr').count()) >= 3)
await page.getByRole('button', { name: 'Save grades' }).click()
assert.match(await page.locator('.toast__title').innerText(), /Grades saved/)
await page.getByRole('button', { name: 'Close dialog' }).click()

await page.locator('.nav-item').filter({ hasText: 'Students' }).click()
await page.locator('tbody tr').filter({ hasText: 'Juan Miguel' }).click()
await page.locator('.student-hero__actions button').filter({ hasText: 'Record payment' }).click()
await page.locator('#payment-amount').fill('2000')
await page.getByRole('button', { name: 'Post payment' }).click()
assert.equal(await page.locator('.modal__title').innerText(), 'Payment posted')
await page.getByRole('button', { name: 'Done' }).click()

await page.keyboard.press('Control+K')
assert.equal(await page.locator('.command__input').count(), 1)
await page.keyboard.press('Escape')
assert.equal(await page.locator('.command__input').count(), 0)

await page.getByLabel('Demo role').selectOption('Administrator')
const screens = [
  ['Registration', 'Registration desk'],
  ['Cashier', 'Cashier'],
  ['Academics', 'Academics'],
  ['Reports', 'Report library'],
  ['Administration', 'Administration'],
]
for (const [nav, title] of screens) {
  await page.locator('.nav-item').filter({ hasText: nav }).first().click()
  await page.waitForTimeout(150)
  assert.equal(await page.locator('.page-title').innerText(), title)
}

await page.locator('.nav-item').filter({ hasText: 'Cashier' }).click()
await page.locator('#or-lookup').fill('OR-2026-41024')
await page.getByRole('button', { name: 'Find receipt' }).click()
assert.equal(await page.locator('.modal__title').innerText(), 'Payment posted')
await page.getByRole('button', { name: 'Done', exact: true }).click()

const mobile = await browser.newPage({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
})
await mobile.goto(baseUrl, { waitUntil: 'networkidle' })
await mobile.getByRole('button', { name: 'Open demo', exact: true }).click()
await mobile.waitForTimeout(250)
let widths = await mobile.evaluate(() => [document.documentElement.scrollWidth, innerWidth])
assert.equal(widths[0], widths[1], 'mobile dashboard has horizontal overflow')
await mobile.getByRole('button', { name: 'Open navigation' }).click()
await mobile.locator('.nav-item').filter({ hasText: 'Students' }).click()
await mobile.locator('tbody tr').first().click()
await mobile.waitForTimeout(250)
widths = await mobile.evaluate(() => [document.documentElement.scrollWidth, innerWidth])
assert.equal(widths[0], widths[1], 'mobile student workspace has horizontal overflow')

assert.deepEqual(errors, [], `browser errors: ${errors.join(' | ')}`)
console.log('Smoke test passed: login, all major screens, student tabs, grade save, payment, OR search, CSV export, command palette, mobile.')
await browser.close()
