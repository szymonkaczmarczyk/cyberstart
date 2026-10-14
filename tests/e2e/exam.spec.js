import { test, expect } from '@playwright/test';
import { resetStorage, trackErrors } from './helpers.js';

test('zaliczony egzamin daje dyplom i odznakę', async ({ page }) => {
  test.setTimeout(120000);
  const errors = trackErrors(page);
  await resetStorage(page);
  await page.goto('/#/gra/egzamin');
  await page.getByRole('button', { name: 'Rozpocznij egzamin' }).click();

  for (let i = 0; i < 25; i += 1) {
    await page.evaluate(async () => {
      const { allExamQuestions } = await import('/js/games/egzamin.js');
      const normalize = (html) => {
        const template = document.createElement('template');
        template.innerHTML = html;
        return template.innerHTML.replace(/\s+/g, ' ').trim();
      };
      const prompt = normalize(document.querySelector('.question-prompt').innerHTML);
      const question = allExamQuestions().find((q) => normalize(q.prompt) === prompt);
      const correct = normalize(question.options.find((option) => option.correct).label);
      const choice = [...document.querySelectorAll('.choice')].find((el) => normalize(el.querySelector('.choice-text').innerHTML) === correct);
      choice.click();
    });
    await page.locator('.question .btn-primary').click();
  }

  await expect(page.locator('.feedback-ok').first()).toContainText('Zaliczone');
  await page.getByRole('button', { name: 'Pokaż dyplom' }).click();
  await expect(page.locator('.field-error')).toBeVisible();
  await page.locator('#diploma-name').fill('Anna Testowa');
  await page.getByRole('button', { name: 'Pokaż dyplom' }).click();
  await expect(page.locator('.diploma-name')).toHaveText('Anna Testowa');
  await expect(page.locator('.field-error')).toBeHidden();
  await expect(page.locator('.progress-label')).toHaveText('25/25');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.diploma')).toBeVisible();
  await expect(page.locator('.topbar')).toBeHidden();
  await expect(page.locator('.diploma-name')).toBeVisible();
  await page.emulateMedia({ media: 'screen' });
  await page.getByRole('button', { name: 'Zobacz podsumowanie' }).click();
  await expect(page.locator('.new-badges')).toContainText('Dyplom');
  expect(errors).toEqual([]);
});
