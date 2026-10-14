import { test, expect } from '@playwright/test';

test('kroki da się przeciągać za uchwyt', async ({ page }) => {
  await page.goto('/#/gra/pakiet');
  const items = page.locator('.order-item');
  const firstText = await items.nth(0).locator('.order-text').innerText();
  await page.locator('.lesson summary').click();
  await items.nth(3).scrollIntoViewIfNeeded();
  const grip = items.nth(0).locator('.order-grip');
  const target = items.nth(3);
  const from = await grip.boundingBox();
  const to = await target.boundingBox();
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2, to.y + to.height * 0.8, { steps: 12 });
  await page.mouse.up();
  await expect(items.nth(3).locator('.order-text')).toHaveText(firstText);
});

test('strzałki przesuwają krok i zachowują fokus', async ({ page }) => {
  await page.goto('/#/gra/pakiet');
  const items = page.locator('.order-item');
  const secondText = await items.nth(1).locator('.order-text').innerText();
  await items.nth(1).locator('.order-move').first().click();
  await expect(items.nth(0).locator('.order-text')).toHaveText(secondText);
  await expect(page.locator('.order-item .order-move:focus')).toHaveCount(1);
});

test('skróty klawiszowe działają w quizie', async ({ page }) => {
  await page.goto('/#/gra/porty');
  await page.keyboard.press('1');
  await expect(page.locator('.choice.is-correct')).toHaveCount(1);
  await page.keyboard.press('Enter');
  await expect(page.locator('.tag-accent', { hasText: 'Pytanie 2' })).toBeVisible();
});
