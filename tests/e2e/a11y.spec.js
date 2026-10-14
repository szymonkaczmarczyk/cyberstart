import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { gameIds, playGame, resetStorage } from './helpers.js';

const STATIC_PAGES = ['/404.html', '/polityka-prywatnosci.html', '/regulamin.html'];

async function scan(page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  return results.violations.map((violation) => `${violation.id} (${violation.impact}): ${violation.nodes.slice(0, 3).map((node) => node.target.join(' ')).join(' | ')}`);
}

for (const scheme of ['light', 'dark']) {
  test(`brak błędów dostępności WCAG AA, motyw ${scheme}`, async ({ page }) => {
    test.setTimeout(300000);
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
    await resetStorage(page);
    const ids = await gameIds(page);
    const routes = ['/#/', ...ids.map((id) => `/#/gra/${id}`), '/#/gra/nie-ma', ...STATIC_PAGES];
    const problems = [];
    for (const route of routes) {
      await page.goto(route);
      await page.waitForTimeout(200);
      const found = await scan(page);
      problems.push(...found.map((item) => `${route} ${item}`));
    }
    expect(problems).toEqual([]);
  });
}

for (const scheme of ['light', 'dark']) {
  test(`dostępność w trakcie gry i na ekranie wyniku, motyw ${scheme}`, async ({ page }) => {
    test.setTimeout(600000);
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
    await resetStorage(page);
    const ids = await gameIds(page);
    const problems = [];
    for (const id of ids) {
      await playGame(page, id, { stopAfter: 3 });
      await page.waitForTimeout(250);
      problems.push(...(await scan(page)).map((item) => `${id} w trakcie: ${item}`));
      const outcome = await playGame(page, id, { resume: true });
      if (!outcome.done) problems.push(`${id}: nie ukończono`);
      await page.waitForTimeout(250);
      problems.push(...(await scan(page)).map((item) => `${id} wynik: ${item}`));
    }
    await page.goto('/#/');
    problems.push(...(await scan(page)).map((item) => `mapa z postępem: ${item}`));
    expect(problems).toEqual([]);
  });
}
