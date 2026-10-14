import { test, expect } from '@playwright/test';
import { playGame, resetStorage, trackErrors } from './helpers.js';

test('wyzwanie dnia, seria i odznaki po ukończeniu gry', async ({ page }) => {
  test.setTimeout(120000);
  const errors = trackErrors(page);
  await resetStorage(page);
  await page.goto('/#/');
  await expect(page.locator('.today-daily')).toBeVisible();
  const href = await page.locator('.today-daily a.btn-primary').getAttribute('href');
  const dailyId = href.split('/').pop();

  const outcome = await playGame(page, dailyId);
  expect(outcome.done).toBe(true);
  await expect(page.locator('.result')).toContainText('Wyzwanie dnia zaliczone');
  await expect(page.locator('.result-streak')).toContainText('Seria: 1 dzień');
  await expect(page.locator('.new-badges')).toContainText('Pierwszy krok');
  await expect(page.locator('.new-badges')).toContainText('Wyzwanie przyjęte');

  const links = page.locator('.practice-list a');
  expect(await links.count()).toBeGreaterThan(0);
  await expect(links.first()).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(links.first()).toHaveAttribute('target', '_blank');

  await page.goto('/#/');
  await expect(page.locator('.today-daily')).toHaveClass(/is-done/);
  await expect(page.locator('#xp-chip .xp-streak')).toHaveText('1');
  expect(await page.locator('.badge-item.is-earned').count()).toBeGreaterThanOrEqual(2);
  expect(errors).toEqual([]);
});

test('service worker rejestruje się, a manifest ma ikony', async ({ page, request }) => {
  await page.goto('/');
  const registered = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    return Boolean(registration.active);
  });
  expect(registered).toBe(true);
  const manifest = await (await request.get('/manifest.webmanifest')).json();
  expect(manifest.icons.map((icon) => icon.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']));
});

test('przyciski na ekranie wyniku: zagraj jeszcze raz i następna gra', async ({ page }) => {
  await resetStorage(page);
  const outcome = await playGame(page, 'porty');
  expect(outcome.done).toBe(true);
  await page.getByRole('button', { name: 'Zagraj jeszcze raz' }).click();
  await expect(page.locator('.choice').first()).toBeVisible();
  await expect(page.locator('.game-head .tag', { hasText: 'Najlepszy wynik' })).toBeVisible();
  await playGame(page, 'porty', { resume: true });
  const next = page.locator('.result a.btn-primary');
  const href = await next.getAttribute('href');
  await next.click();
  await expect(page).toHaveURL(new RegExp(`${href.replace('#', '#')}$`));
  await expect(page.locator('h1')).not.toHaveText('Porty i usługi');
});

test('poziom trudności zostaje zapamiętany między grami', async ({ page }) => {
  await resetStorage(page);
  await page.goto('/#/gra/porty');
  await page.locator('label[for="level-zaawansowany"]').click();
  await page.goto('/#/gra/kod');
  await expect(page.locator('#level-zaawansowany')).toBeChecked();
  await page.reload();
  await expect(page.locator('#level-zaawansowany')).toBeChecked();
});
