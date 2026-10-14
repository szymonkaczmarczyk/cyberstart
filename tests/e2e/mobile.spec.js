import { test, expect } from '@playwright/test';
import { gameIds } from './helpers.js';

test('żaden ekran nie przewija się w poziomie na telefonie', async ({ page }) => {
  const ids = await gameIds(page);
  const routes = ['#/', ...ids.map((id) => `#/gra/${id}`), '#/gra/brak'];
  const overflow = [];
  for (const route of routes) {
    await page.goto(`/${route}`);
    await page.waitForTimeout(150);
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    if (width > 375) overflow.push(`${route}: ${width}`);
  }
  expect(overflow).toEqual([]);
});

test('przyciski w grach mają co najmniej 44 px wysokości', async ({ page }) => {
  const ids = await gameIds(page);
  const small = [];
  for (const id of ids) {
    await page.goto(`/#/gra/${id}`);
    await page.waitForTimeout(150);
    const found = await page.evaluate(() =>
      [...document.querySelectorAll('.stage button:not(.btn-sm):not(.url-token):not(:disabled)')]
        .filter((el) => el.getClientRects().length)
        .filter((el) => el.getBoundingClientRect().height < 43.5)
        .map((el) => `${el.className}: ${el.textContent.trim().slice(0, 30)}`)
    );
    small.push(...found.map((item) => `${id} ${item}`));
  }
  expect(small).toEqual([]);
});

test('każdą grę da się przejść na telefonie bez przewijania w poziomie', async ({ page }) => {
  test.setTimeout(600000);
  const { playGame, resetStorage, trackErrors } = await import('./helpers.js');
  const errors = trackErrors(page);
  await resetStorage(page);
  const ids = await gameIds(page);
  const problems = [];
  const width = () => page.evaluate(() => document.documentElement.scrollWidth);
  for (const id of ids) {
    await playGame(page, id, { stopAfter: 3 });
    if ((await width()) > 375) problems.push(`${id} w trakcie: ${await width()}`);
    const outcome = await playGame(page, id, { resume: true });
    if (!outcome.done) problems.push(`${id}: nie ukończono ${JSON.stringify(outcome)}`);
    if ((await width()) > 375) problems.push(`${id} wynik: ${await width()}`);
  }
  expect(problems).toEqual([]);
  expect(errors).toEqual([]);
});
