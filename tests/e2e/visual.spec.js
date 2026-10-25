import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { playGame, resetStorage } from './helpers.js';
import { GAMES } from '../../js/games/index.js';

const SCREENSHOT = {
  maxDiffPixels: 100,
  stylePath: fileURLToPath(new URL('./visual.css', import.meta.url))
};

async function freeze(page, scheme) {
  await page.clock.setFixedTime(new Date('2026-10-20T10:00:00'));
  await page.addInitScript(() => {
    let seed = 20261020;
    Math.random = () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  });
  await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
  await resetStorage(page);
}

async function open(page, route) {
  await page.goto(route);
  await page.reload();
}

async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await page.waitForTimeout(100);
}

for (const scheme of ['light', 'dark']) {
  test.describe(`wygląd, motyw ${scheme}`, () => {
    test('mapa nauki', async ({ page }) => {
      await freeze(page, scheme);
      await open(page, '/#/');
      await settle(page);
      await expect(page).toHaveScreenshot(`mapa-${scheme}.png`, { ...SCREENSHOT, fullPage: true });
    });

    for (const game of GAMES) {
      test(`gra ${game.id}`, async ({ page }) => {
        await freeze(page, scheme);
        await open(page, `/#/gra/${game.id}`);
        await expect(page.locator('#game-stage')).toBeVisible();
        await settle(page);
        await expect(page.locator('#main')).toHaveScreenshot(`${game.id}-start-${scheme}.png`, SCREENSHOT);
        await playGame(page, game.id, { resume: true, stopAfter: 1 });
        await settle(page);
        await expect(page.locator('#main')).toHaveScreenshot(`${game.id}-ruch-${scheme}.png`, SCREENSHOT);
      });
    }

    test('ekran wyniku', async ({ page }) => {
      await freeze(page, scheme);
      await open(page, '/#/gra/porty');
      const outcome = await playGame(page, 'porty', { resume: true });
      expect(outcome.done).toBe(true);
      await settle(page);
      await expect(page.locator('#main')).toHaveScreenshot(`wynik-${scheme}.png`, SCREENSHOT);
    });
  });
}
