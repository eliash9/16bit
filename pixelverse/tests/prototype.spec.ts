import { test, expect, type Page } from '@playwright/test'
async function position(page: Page) { return page.evaluate(() => JSON.parse(localStorage.getItem('pixelverse:position') || 'null') as { x: number; y: number } | null) }
test('desktop world, keyboard movement, collision, tap path, interaction and cleanup', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  const canvas = page.locator('canvas')
  await expect(canvas).toBeVisible()
  await expect(page.locator('.game-loading')).toHaveCount(0)
  await expect.poll(() => position(page)).not.toBeNull()
  await page.screenshot({ path: 'test-results/desktop.png', fullPage: true })
  const initial = (await position(page))!
  await canvas.focus()
  await page.keyboard.down('d')
  await expect.poll(async () => (await position(page))!.x).toBeGreaterThan(initial.x + 70)
  await page.keyboard.up('d')
  // Return to the square and click the path in front of HQ.
  await page.getByRole('button', { name: 'Return player to town square' }).click()
  await expect.poll(async () => Math.abs((await position(page))!.x - 512)).toBeLessThan(2)
  const box = (await canvas.boundingBox())!
  // Phaser camera zoom .75: town coordinate (304, 288) from centered player (512,400).
  await canvas.click({ position: { x: box.width / 2 + (304 - 512) * 0.75, y: box.height / 2 + (288 - 400) * 0.75 } })
  await expect(page.getByRole('button', { name: 'Enter Agency HQ' })).toBeVisible({ timeout: 10000 })
  await canvas.focus()
  await page.keyboard.press('e')
  await expect(page).toHaveURL(/\/agency$/)
  await expect(page.locator('canvas')).toHaveCount(0)
  await page.getByRole('link', { name: 'Back to the world' }).click()
  await expect(canvas).toHaveCount(1)
  await expect(page.locator('.game-loading')).toHaveCount(0)
  expect(errors).toEqual([])
})
test('direct routes, form preview, mute persistence and semantic content', async ({ page }) => {
  await page.goto('/services')
  await expect(page).toHaveTitle(/Design & development services/)
  await expect(page.getByRole('heading', { name: 'Creative development' })).toBeVisible()
  await expect(page.locator('canvas')).toHaveCount(0)
  await page.getByRole('button', { name: 'Enable interaction sounds' }).click()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Mute interaction sounds' })).toBeVisible()
  await page.goto('/portfolio')
  await page.getByRole('button', { name: /orbit.*Explore concept/i }).click()
  await expect(page.getByText('A concept finance dashboard', { exact: false })).toBeVisible()
  await page.goto('/contact')
  await page.getByLabel('Your name').fill('Alex Explorer')
  await page.getByLabel('Email address').fill('alex@example.com')
  await page.getByLabel('What can we help you with?').selectOption('Creative development')
  await page.getByLabel('A little about your project').fill('A playful and accessible website for a creative studio.')
  await page.getByRole('button', { name: 'Preview your project request' }).click()
  await expect(page.getByRole('status')).toContainText('No message has been sent')
})
test('mobile portrait joystick, layout and landscape', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
  const page = await context.newPage()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('http://127.0.0.1:5173/')
  await expect(page.locator('canvas')).toBeVisible()
  await expect(page.locator('.game-loading')).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: 'test-results/mobile.png', fullPage: true })
  await expect(page.locator('.joystick')).toBeVisible()
  await expect.poll(() => position(page)).not.toBeNull()
  const initial = (await position(page))!
  const stick = (await page.locator('.joystick').boundingBox())!
  await page.mouse.move(stick.x + stick.width / 2 + 30, stick.y + stick.height / 2)
  await page.mouse.down()
  await expect.poll(async () => (await position(page))!.x).toBeGreaterThan(initial.x + 30)
  await page.mouse.up()
  await page.setViewportSize({ width: 844, height: 390 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await context.close()
})
test('canvas renderer works when WebGL is unavailable', async ({ browser }) => {
  const context = await browser.newContext()
  await context.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
      if (type.toLowerCase().includes('webgl')) return null
      return Reflect.apply(original, this, [type, ...args])
    } as typeof original
  })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:5173/')
  await expect(page.locator('canvas')).toBeVisible()
  await expect(page.locator('.game-loading')).toHaveCount(0)
  await expect(page.locator('.game-fallback')).toHaveCount(0)
  await context.close()
})
