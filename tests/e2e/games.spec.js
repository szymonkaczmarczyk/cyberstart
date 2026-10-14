import { test, expect } from '@playwright/test';
import { gameIds, playGame, resetStorage, trackErrors } from './helpers.js';

test('każda gra da się przejść od startu do ekranu wyniku', async ({ page }) => {
  test.setTimeout(240000);
  const errors = trackErrors(page);
  const ids = await gameIds(page);
  await resetStorage(page);
  const failures = [];
  for (const id of ids) {
    const outcome = await playGame(page, id);
    if (!outcome.done) failures.push(`${id}: ${JSON.stringify(outcome)}`);
  }
  expect(failures).toEqual([]);
  expect(errors).toEqual([]);
  await page.goto('/#/');
  await expect(page.locator('.stat strong').first()).toHaveText(`${ids.length}/${ids.length}`);
});

test('wynik gry zapisuje XP i pokazuje następną grę', async ({ page }) => {
  await resetStorage(page);
  const ids = await gameIds(page);
  const outcome = await playGame(page, ids[0]);
  expect(outcome.done).toBe(true);
  await expect(page.locator('.result')).toContainText('Zapamiętaj');
  await expect(page.locator('.result a.btn-primary')).toContainText('Następna gra');
  const xp = await page.locator('#xp-chip').innerText();
  expect(Number.parseInt(xp, 10)).toBeGreaterThan(0);
});

test('gry z poziomami da się przejść na poziomie zaawansowanym', async ({ page }) => {
  test.setTimeout(240000);
  const errors = trackErrors(page);
  await resetStorage(page);
  const leveled = await page.evaluate(async () => (await import('/js/games/index.js')).GAMES.filter((game) => game.levels).map((game) => game.id));
  expect(leveled.length).toBeGreaterThan(8);
  await page.goto(`/#/gra/${leveled[0]}`);
  await page.locator('label[for="level-zaawansowany"]').click();
  await expect(page.locator('#level-zaawansowany')).toBeChecked();
  const failures = [];
  for (const id of leveled) {
    const outcome = await playGame(page, id);
    if (!outcome.done) failures.push(`${id}: ${JSON.stringify(outcome)}`);
  }
  expect(failures).toEqual([]);
  expect(errors).toEqual([]);
});

test('fiszki zapamiętują powtórki', async ({ page }) => {
  await resetStorage(page);
  await page.goto('/#/gra/slownik');
  await page.locator('.flashcard').click();
  await page.locator('.deck-actions .btn-primary').click();
  await expect(page.locator('.deck-stats')).toContainText('Poznane: 1');
  await page.goto('/#/');
  await expect(page.locator('.game-card .attention')).toContainText('do powtórki');
});
