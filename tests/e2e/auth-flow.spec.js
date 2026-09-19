import { test, expect } from '@playwright/test';

const email = process.env.DEMO_EMAIL || 'judge@example.com';
const password = process.env.DEMO_PASSWORD || 'test-password';

test('login, protected workspace, and logout work', async ({ page }) => {
  await page.goto('/login.html');
  await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();
  await expect(page.getByAltText('LegalLens AI — Understand Before You Sign')).toBeVisible();
  await page.getByLabel('Email').fill('wrong@example.com');
  await page.getByLabel('Password').fill('wrong-password');
  await page.getByRole('button', { name: /Sign in/ }).click();
  await expect(page.getByRole('alert')).toContainText(/incorrect|valid email/i);
  await expect(page).toHaveScreenshot('login.png', { fullPage: true });
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /Sign in/ }).click();
  await expect(page).toHaveURL(/dashboard\.html/);
  await expect(page.getByRole('heading', { name: /See what matters/i })).toBeVisible();
  await expect(page.getByText('START AN ANALYSIS')).toBeVisible();
  await expect(page).toHaveScreenshot('dashboard.png', { fullPage: true });
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/login\.html/);
  await page.goto('/api/protected/workspace');
  expect(await page.locator('body').textContent()).toContain('UNAUTHORIZED');
});
