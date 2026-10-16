import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { gameIds, resetStorage, trackErrors } from './helpers.js';

async function terminalRun(page, command) {
  const input = page.locator('#term-input');
  await input.fill(command);
  await input.press('Enter');
}

async function lastLines(page, count = 6) {
  return page.locator('.term-output .term-line').evaluateAll((lines, n) => lines.slice(-n).map((line) => line.textContent), count);
}

test('silnik terminala: potoki, wzorce, przekierowania i uprawnienia', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/#/gra/ctf');
  await terminalRun(page, 'cat ./poziom1/-flaga');
  expect((await lastLines(page, 1))[0]).toBe('FLAGA{myslnik_to_nie_opcja}');

  await terminalRun(page, 'cat -flaga');
  expect((await lastLines(page, 1))[0]).toContain('cat ./-nazwa');

  await terminalRun(page, 'cat "poziom2/moja notatka.txt"');
  expect((await lastLines(page, 1))[0]).toBe('FLAGA{spacje_w_cudzyslowie}');

  await terminalRun(page, 'cat poziom2/moja\\ notatka.txt');
  expect((await lastLines(page, 1))[0]).toBe('FLAGA{spacje_w_cudzyslowie}');

  await terminalRun(page, 'file poziom4/*');
  const fileLines = await lastLines(page, 10);
  expect(fileLines.filter((line) => line.endsWith('tekst ASCII'))).toEqual(['poziom4/plik07: tekst ASCII']);

  await terminalRun(page, 'find /srv -name klucz.txt');
  expect((await lastLines(page, 1))[0]).toBe('/srv/archiwum/2025/q3/stare/klucz.txt');

  await terminalRun(page, 'sort poziom7/lista.txt | uniq -u');
  expect((await lastLines(page, 1))[0]).toBe('FLAGA{sort_i_uniq_razem}');

  await terminalRun(page, 'grep -c 203.0.113.45 poziom11/dostep.log');
  expect((await lastLines(page, 1))[0]).toBe('40');

  await terminalRun(page, 'sort poziom12/wyciek.txt | uniq -c | sort -n -r | head -n 1');
  expect((await lastLines(page, 1))[0].trim()).toBe('41 kochanie');

  await terminalRun(page, 'cat poziom10/sejf.txt');
  expect((await lastLines(page, 1))[0]).toContain('Brak dostępu');
  await terminalRun(page, 'chmod u+r poziom10/sejf.txt');
  await terminalRun(page, 'cat poziom10/sejf.txt');
  expect((await lastLines(page, 1))[0]).toBe('FLAGA{chmod_otwiera_drzwi}');

  await terminalRun(page, 'echo tajne > notatka.txt');
  await terminalRun(page, 'echo dopisek >> notatka.txt');
  await terminalRun(page, 'cat notatka.txt | wc -l');
  expect((await lastLines(page, 1))[0]).toBe('2');

  await terminalRun(page, 'base64 -d poziom8/zakodowane.txt');
  expect((await lastLines(page, 1))[0]).toBe('FLAGA{base64_to_nie_szyfr}');

  await terminalRun(page, 'rm -rf /');
  expect((await lastLines(page, 1))[0]).toContain('Tutaj nic się nie stało');

  await terminalRun(page, 'nieznane');
  expect((await lastLines(page, 1))[0]).toContain('nie znaleziono polecenia');

  await terminalRun(page, 'cat /etc/hostname | grep');
  expect((await lastLines(page, 1))[0]).toContain('grep: użycie');

  const input = page.locator('#term-input');
  await input.fill('cd pozi');
  await input.press('Tab');
  await expect(input).toHaveValue(/^cd pozi/);
  await input.fill('cat poziom2/moj');
  await input.press('Tab');
  await expect(input).toHaveValue('cat poziom2/moja\\ notatka.txt ');
  await input.fill('');
  await input.press('ArrowUp');
  await expect(input).toHaveValue('cat /etc/hostname | grep');
  expect(errors).toEqual([]);
});

test('obsługa samą klawiaturą: skip link, karta gry, quiz, motyw', async ({ page }) => {
  await resetStorage(page);
  await page.goto('/#/');
  await page.reload();
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
  await expect(page).toHaveURL(/#\/$/);
  await expect(page.locator('.hero')).toBeVisible();

  const card = page.locator('a.game-card[href="#/gra/porty"]');
  await card.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#\/gra\/porty$/);
  for (let i = 0; i < 12; i += 1) {
    await expect(page.locator('.tag-accent', { hasText: `Pytanie ${i + 1} z 12` })).toBeVisible();
    await page.keyboard.press('2');
    await expect(page.locator('.question .btn-primary')).toBeVisible();
    await page.keyboard.press('Enter');
  }
  await expect(page.locator('.result')).toBeVisible();
  await expect(page.locator('.result a.btn-primary')).toBeVisible();

  await page.locator('#theme-toggle').focus();
  const before = await page.evaluate(() => document.documentElement.dataset.theme ?? 'system');
  await page.keyboard.press('Enter');
  const after = await page.evaluate(() => document.documentElement.dataset.theme);
  expect(after).not.toBe(before);
});

test('aplikacja działa offline po pierwszej wizycie', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect(page.locator('.game-card').first()).toBeVisible();
  await page.goto('/#/gra/porty');
  await expect(page.locator('.choice').first()).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.hero, .game-view').first()).toBeVisible();
  await page.goto('/#/gra/firewall');
  await expect(page.locator('h1')).toHaveText('Jesteś firewallem');
  await context.setOffline(false);
});

test('import odrzuca zmanipulowane wartości', async ({ page }, testInfo) => {
  await resetStorage(page);
  await page.goto('/#/');
  page.on('dialog', (dialog) => dialog.accept());
  const file = testInfo.outputPath('zmanipulowany.json');
  fs.writeFileSync(
    file,
    JSON.stringify({
      format: 'cyberstart-progress',
      version: 1,
      data: {
        results: {
          terminal: { score: 5, max: 10, xp: 9999, date: new Date().toISOString() },
          porty: { score: 10, max: 12, xp: 83, date: new Date().toISOString() },
          nieistniejaca: { score: 1, max: 1, xp: 100, date: new Date().toISOString() }
        },
        badges: { '<img src=x onerror=alert(1)>': new Date().toISOString(), 'bez-pudla': 'nie-data' },
        cards: { Phishing: { box: 99, due: '2026-01-01' } }
      }
    })
  );
  await page.locator('#import-file').setInputFiles(file);
  await expect(page.locator('.stat strong').first()).toContainText('1/');
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('cyberstart:v1')));
  expect(Object.keys(stored.results)).toEqual(['porty']);
  expect(stored.badges).toEqual({});
  expect(stored.cards).toEqual({});
});

test('wszystkie trasy i strony statyczne bez błędów w konsoli', async ({ page }) => {
  const errors = trackErrors(page);
  const ids = await gameIds(page);
  for (const route of ['/#/', '/#mapa', '/#odznaki', ...ids.map((id) => `/#/gra/${id}`), '/#/gra/x', '/#/cokolwiek', '/404.html', '/polityka-prywatnosci.html', '/regulamin.html']) {
    await page.goto(route);
    await page.waitForTimeout(100);
  }
  expect(errors).toEqual([]);
});

test('otwarcie pliku z dysku pokazuje instrukcję uruchomienia', async ({ page }) => {
  const url = new URL('../../index.html', import.meta.url).href;
  await page.goto(url);
  await expect(page.locator('#file-warning')).toBeVisible();
  await expect(page.locator('#file-warning')).toContainText('npm start');
  await expect(page.locator('#main .loading')).toHaveCount(0);
});

test('przez serwer instrukcja uruchomienia się nie pokazuje', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.hero')).toBeVisible();
  await expect(page.locator('#file-warning')).toBeHidden();
});
