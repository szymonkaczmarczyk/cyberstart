import { test, expect } from '@playwright/test';
import { gameIds, playGame, resetStorage, trackErrors } from './helpers.js';

test('mapa nauki pokazuje wszystkie gry i CTA', async ({ page }) => {
  const errors = trackErrors(page);
  const ids = await gameIds(page);
  await resetStorage(page);
  await page.goto('/#/');
  await expect(page.locator('.game-card')).toHaveCount(ids.length);
  await expect(page.locator('.hero .btn-primary')).toBeVisible();
  await expect(page.locator('h1')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('każda gra ma własny tytuł strony i lekcję', async ({ page }) => {
  const ids = await gameIds(page);
  const titles = new Set();
  for (const id of ids) {
    await page.goto(`/#/gra/${id}`);
    await expect(page.locator('.lesson-body').first()).not.toBeEmpty();
    titles.add(await page.title());
  }
  expect(titles.size).toBe(ids.length);
});

test('nieznany adres pokazuje widok 404', async ({ page }) => {
  await page.goto('/#/gra/nie-ma-takiej');
  await expect(page.locator('h1')).toHaveText('Tej strony nie ma na mapie');
  const response = await page.goto('/404.html');
  expect(response.status()).toBe(200);
});

test('pliki obowiązkowe są dostępne', async ({ request }) => {
  for (const path of ['/favicon.ico', '/img/og.png', '/img/icon.svg', '/robots.txt', '/sitemap.xml', '/polityka-prywatnosci.html', '/regulamin.html', '/manifest.webmanifest', '/sw.js', '/img/icon-192.png', '/img/icon-512.png']) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
  }
});

test('przełącznik motywu zapamiętuje wybór', async ({ page }) => {
  await resetStorage(page);
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/#/');
  await page.locator('#theme-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('eksport i import postępu', async ({ page }, testInfo) => {
  await resetStorage(page);
  const ids = await gameIds(page);
  await playGame(page, ids[1]);
  await page.goto('/#/');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#export-progress').click();
  const download = await downloadPromise;
  const file = testInfo.outputPath('postep.json');
  await download.saveAs(file);

  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('.stat strong').first()).toHaveText(`0/${ids.length}`);

  page.on('dialog', (dialog) => dialog.accept());
  await page.locator('#import-file').setInputFiles(file);
  await expect(page.locator('.stat strong').first()).toHaveText(`1/${ids.length}`);
});

test('import odrzuca obcy plik', async ({ page }, testInfo) => {
  await resetStorage(page);
  await page.goto('/#/');
  const messages = [];
  page.on('dialog', (dialog) => {
    messages.push(dialog.message());
    dialog.accept();
  });
  const file = testInfo.outputPath('zly.json');
  await import('node:fs').then((fs) => fs.writeFileSync(file, JSON.stringify({ results: { terminal: { xp: 9999 } } })));
  await page.locator('#import-file').setInputFiles(file);
  await expect.poll(() => messages.length).toBe(2);
  expect(messages[1]).toContain('nie pochodzi z eksportu');
});
