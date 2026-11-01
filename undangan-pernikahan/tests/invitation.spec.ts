import { test, expect, type Page } from '@playwright/test'
async function position(page: Page) { return page.evaluate(() => JSON.parse(localStorage.getItem('janji-sepixel:position') || 'null') as { x: number; y: number } | null) }
async function ready(page: Page) { await expect(page.locator('canvas')).toBeVisible(); await expect(page.locator('.loading-screen')).toHaveCount(0) }

test('mobile: unlock through proximity, pause, persist and reread', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message))
  await page.goto('/?to=Nadia%20%26%20Keluarga'); await ready(page)
  await expect(page.getByRole('button', { name: 'Buka objek terdekat' })).toBeDisabled()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: 'test-results/mobile-start.png' })
  await page.getByRole('button', { name: /Buku Undangan/ }).click()
  await expect(page.locator('.book-list button:disabled')).toHaveCount(7)
  await page.getByRole('button', { name: 'Pandu ke halaman berikutnya' }).click()
  await expect(page.getByRole('button', { name: 'Buka objek terdekat' })).toBeEnabled()
  await page.locator('canvas').focus(); await page.keyboard.press('e')
  await expect(page.getByRole('dialog')).toContainText('Nadia & Keluarga')
  await expect(page.getByRole('heading', { name: 'Surat untukmu' })).toBeVisible()
  const old = await position(page); await page.waitForTimeout(1100); expect(await position(page)).toEqual(old)
  await page.screenshot({ path: 'test-results/mobile-letter.png' })
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.reload(); await ready(page); await expect(page.locator('.book-count')).toHaveText('1/7')
  await page.getByRole('button', { name: /Buku Undangan/ }).click(); await page.locator('.book-list button').first().click()
  await expect(page.getByRole('heading', { name: 'Surat untukmu' })).toBeVisible()
  await page.keyboard.press('Escape')
  // Joystick pointer capture must stop movement when released.
  const stick = (await page.locator('.joystick').boundingBox())!
  await page.mouse.move(stick.x + stick.width / 2, stick.y + stick.height / 2); await page.mouse.down(); await page.mouse.move(stick.x + stick.width - 3, stick.y + stick.height / 2)
  const before = await position(page); await expect.poll(async () => (await position(page))!.x).toBeGreaterThan(before!.x + 20); await page.mouse.up()
  expect(errors).toEqual([])
})

test('all seven checkpoints can be reached with paths and opened', async ({ page }) => {
  await page.goto('/'); await ready(page)
  for (let i = 0; i < 7; i++) {
    await page.getByRole('button', { name: 'Pandu menuju tujuan berikutnya' }).click()
    const open = page.getByRole('button', { name: 'Buka objek terdekat' })
    // Wait for the intended proximity, rather than an old checkpoint on the route.
    const names = ['Surat untukmu', 'Dua karakter utama', 'Hari bahagia', 'Tempat kita bertemu', 'Jejak cerita', 'Kursi untukmu', 'Tanda kasih']
    await expect(page.locator('.quest-card strong')).toHaveText(names[i]!, { timeout: 20000 })
    try { await expect(open).toBeEnabled() } catch (e) { console.log('Checkpoint failed', names[i], await position(page)); await page.screenshot({ path: 'test-results/path-failure.png' }); throw e }; await open.click()
    await expect(page.getByRole('heading', { name: names[i]!, exact: true })).toBeVisible()
    if (i === 1 || i === 4) {
      const photos = page.locator(i === 1 ? '.couple-photo' : '.memory img')
      await expect(photos).toHaveCount(i === 1 ? 2 : 3)
      for (const photo of await photos.all()) {
        await photo.scrollIntoViewIfNeeded()
        await expect.poll(() => photo.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0)
      }
      await page.screenshot({ path: `test-results/${i === 1 ? 'couple-photos' : 'gallery-photos'}.png` })
    }
    if (i === 2) {
      const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Simpan ke kalender' }).click(); expect((await download).suggestedFilename()).toBe('hari-bahagia.ics')
    }
    if (i === 5) {
      await page.getByLabel('Nama tamu').fill('Nadia'); await page.getByLabel('Ucapan & doa').fill('Semoga berbahagia selalu!'); await page.getByRole('button', { name: 'Simpan draf konfirmasi' }).click()
      await expect(page.getByRole('status')).toContainText('Konfirmasi belum dikirim')
    }
    await page.keyboard.press('Escape')
  }
  await expect(page.locator('.book-count')).toHaveText('7/7')
  await page.getByRole('button', { name: /Buku Undangan/ }).click(); await expect(page.locator('.book-list button:disabled')).toHaveCount(0)
})

test('desktop keyboard, narrow phone, landscape and mute', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message))
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto('/'); await ready(page)
  await page.screenshot({ path: 'test-results/desktop.png', fullPage: true })
  await expect.poll(() => position(page)).not.toBeNull(); const initial = (await position(page))!
  await page.locator('canvas').focus(); await page.keyboard.down('d'); await expect.poll(async () => (await position(page))!.x).toBeGreaterThan(initial.x + 30); await page.keyboard.up('d')
  await page.getByRole('button', { name: 'Nyalakan musik' }).click(); await expect(page.getByRole('button', { name: 'Matikan musik' })).toBeVisible(); await page.getByRole('button', { name: 'Matikan musik' }).click()
  for (const viewport of [{ width: 320, height: 568 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.getByRole('button', { name: 'Cara bermain' }).click(); await expect(page.getByRole('dialog')).toBeVisible(); await page.keyboard.press('Escape')
  }
  expect(errors).toEqual([])
})
