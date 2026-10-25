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
  await page.setViewportSize({ width: 1280, height: 600 });
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await next.click();
  await expect(page).toHaveURL(new RegExp(`${href.replace('#', '#')}$`));
  await expect(page.locator('h1')).not.toHaveText('Porty i usługi');
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.locator('h1')).toBeInViewport();
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

test('audyt SSH ukrywa pasek do audytu i przepuszcza dalej tylko przy komplecie', async ({ page }) => {
  const errors = trackErrors(page);
  await resetStorage(page);
  await page.goto('/#/gra/ssh');
  const progress = page.locator('.stage-progress');
  const audit = page.getByRole('button', { name: 'Uruchom audyt' });
  await expect(progress).toBeHidden();

  await page.locator('label[for="opt-PermitRootLogin-no"]').click();
  await expect(progress).toBeHidden();

  await audit.click();
  await expect(progress).toBeVisible();
  await expect(page.locator('.feedback-bad')).toContainText('wszystkie ustawienia muszą być bezpieczne');
  await expect(page.getByRole('button', { name: /Zakończ/ })).toHaveCount(0);

  const settings = await page.evaluate(async () => (await import('/js/games/ssh.js')).AUDIT_SETTINGS.map(({ id, best }) => ({ id, best })));
  for (const { id, best } of settings.slice(0, -1)) await page.locator(`label[for="opt-${id}-${best}"]`).click();
  await expect(progress).toBeHidden();
  await audit.click();
  await expect(page.locator('.progress-label')).toHaveText(`${settings.length - 1}/${settings.length}`);
  await expect(page.locator('.audit-list li')).toHaveCount(1);
  await expect(page.getByRole('button', { name: /Zakończ/ })).toHaveCount(0);

  const last = settings[settings.length - 1];
  await page.locator(`label[for="opt-${last.id}-${last.best}"]`).click();
  await audit.click();
  await expect(page.locator('.progress-label')).toHaveText(`${settings.length}/${settings.length}`);
  const finish = page.getByRole('button', { name: 'Zakończ konfigurację' });
  const gap = await page.evaluate(() => {
    const box = document.querySelector('.feedback-ok');
    const row = box.nextElementSibling;
    return row.offsetTop - (box.offsetTop + box.offsetHeight);
  });
  expect(gap).toBeGreaterThanOrEqual(12);
  await finish.click();
  await expect(page.locator('.result')).toContainText(`Wynik ${settings.length * 2} z ${settings.length * 2}`);
  expect(errors).toEqual([]);
});

test('powtórka błędów wraca do pytań z błędami i zdejmuje je po dobrej odpowiedzi', async ({ page }) => {
  await resetStorage(page);
  await page.goto('/#/');
  const question = await page.evaluate(async () => {
    const { noteAnswer } = await import('/js/progress.js');
    const { examPool } = await import('/js/games/porty.js');
    const picked = examPool()[0];
    noteAnswer('porty', picked.prompt, false);
    return { prompt: picked.prompt, correct: picked.options.find((option) => option.correct).label };
  });
  await page.reload();
  await expect(page.locator('a.game-card[href="#/gra/powtorka"]')).toContainText('1 do powtórki');

  await page.goto('/#/gra/powtorka');
  await expect(page.locator('.stage .feedback')).toContainText('Do powtórki: 1 pytanie');
  await page.getByRole('button', { name: 'Zacznij powtórkę' }).click();
  const prompt = await page.locator('.question-prompt').innerHTML();
  expect(prompt).toBe(question.prompt);
  const choices = page.locator('.choice');
  const count = await choices.count();
  for (let i = 0; i < count; i += 1) {
    if ((await choices.nth(i).locator('.choice-text').innerHTML()) === question.correct) {
      await choices.nth(i).click();
      break;
    }
  }
  await expect(page.locator('.question .feedback-ok')).toBeVisible();
  await page.locator('.question .btn-primary').click();
  const left = await page.evaluate(async () => Object.keys((await import('/js/progress.js')).getMistakes()).length);
  expect(left).toBe(0);
});

test('import przyjmuje tylko poprawne wpisy powtórki błędów', async ({ page }) => {
  await resetStorage(page);
  await page.goto('/#/');
  const kept = await page.evaluate(async () => {
    const { importProgress, getMistakes } = await import('/js/progress.js');
    const file = JSON.stringify({
      format: 'cyberstart-progress',
      version: 1,
      data: { results: {}, mistakes: { 'porty:abc123': '2026-10-20T10:00:00.000Z', '<img src=x>:1': '2026-10-20T10:00:00.000Z', 'porty:zzz': 'wczoraj' } }
    });
    importProgress(file, ['porty']);
    return Object.keys(getMistakes());
  });
  expect(kept).toEqual(['porty:abc123']);
});
