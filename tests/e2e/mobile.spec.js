import { test, expect } from '@playwright/test';

test('landing page remains usable on mobile', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Clarity before commitment/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Sign in/i })).toBeVisible();
  await expect(page.getByText('Built by Soman Singhal')).toBeVisible();
  await expect(page).toHaveScreenshot('landing-mobile.png', { fullPage: true });
});
