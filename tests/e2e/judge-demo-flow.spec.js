import { test, expect } from '@playwright/test';

const email = process.env.DEMO_EMAIL || 'judge@example.com';
const password = process.env.DEMO_PASSWORD || 'test-password';

test('judge-demo-flow records the implemented product journey', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /Explore your document/i }).click();
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: /Sign in/ }).click();
  await expect(page).toHaveURL(/dashboard\.html/);
  await page.getByRole('button', { name: /Employment Agreement/i }).click();
  await page.getByRole('button', { name: /Analyze document/i }).click();
  await expect(page.getByText('ANALYSIS COMPLETE')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Attention radar' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Important clauses' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Questions for a legal professional/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Action checklist' })).toBeVisible();
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/login\.html/);
});
