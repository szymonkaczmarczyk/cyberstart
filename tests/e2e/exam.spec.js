import { test, expect } from '@playwright/test';
import { resetStorage, trackErrors } from './helpers.js';

test('zaliczony egzamin pokazuje wynik i daje odznakę', async ({ page }) => {
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

  await expect(page.locator('.feedback-ok').first()).toContainText('Zaliczone, wynik 100%');
  await expect(page.locator('.progress-label')).toHaveText('25/25');
  await expect(page.locator('.review-list')).toHaveCount(0);
  await page.getByRole('button', { name: 'Zobacz podsumowanie' }).click();
  await expect(page.locator('.new-badges')).toContainText('Egzamin zaliczony');
  expect(errors).toEqual([]);
});

test('niezaliczony egzamin pokazuje tematy do powtórki z linkami do gier', async ({ page }) => {
  test.setTimeout(120000);
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
      [...document.querySelectorAll('.choice')].find((el) => normalize(el.querySelector('.choice-text').innerHTML) !== correct).click();
    });
    await page.locator('.question .btn-primary').click();
  }
  await expect(page.locator('.feedback-warn')).toContainText('Do zaliczenia brakuje: 20 poprawnych odpowiedzi');
  const links = page.locator('.review-list a');
  expect(await links.count()).toBeGreaterThan(10);
  const href = await links.first().getAttribute('href');
  await links.first().click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
});
