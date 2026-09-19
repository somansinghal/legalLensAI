import { test, expect } from '@playwright/test';

test('landing page presents the product, logo, disclaimer, and creator links', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/LegalLens AI/);
  await expect(page.getByRole('heading', { name: /Clarity before commitment/i })).toBeVisible();
  await expect(page.getByAltText('LegalLens AI — Understand Before You Sign').first()).toBeVisible();
  await expect(page.getByRole('link', { name: /Explore your document/i })).toBeVisible();
  await expect(page.getByText('LegalLens AI provides legal information')).toBeVisible();
  await expect(page.getByText('Built by Soman Singhal')).toBeVisible();
  for (const name of ['Portfolio', 'GitHub', 'LinkedIn', 'Instagram']) {
    const link = page.getByRole('link', { name: new RegExp(name, 'i') });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  }
  await expect(page).toHaveScreenshot('landing-page.png', { fullPage: true });
});
