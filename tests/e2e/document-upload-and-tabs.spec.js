import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const email = process.env.DEMO_EMAIL || 'judge@example.com';
const password = process.env.DEMO_PASSWORD || 'test-password';

test.describe('Dashboard Tabs, Analysis & Document Upload Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login.html');
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);
    await page.getByRole('button', { name: /Sign in/ }).click();
    await expect(page).toHaveURL(/dashboard\.html/);
  });

  test('dashboard tabs switch seamlessly without logging out or redirecting', async ({ page }) => {
    // Initial state: Demo tab is active
    await expect(page.locator('#panelDemo')).toBeVisible();
    await expect(page.locator('#panelPaste')).toBeHidden();
    await expect(page.locator('#panelUpload')).toBeHidden();

    // Switch to Paste text tab
    await page.locator('#tabPaste').click();
    await expect(page.locator('#panelPaste')).toBeVisible();
    await expect(page.locator('#panelDemo')).toBeHidden();
    await expect(page).toHaveURL(/dashboard\.html/);

    // Switch to Upload document tab
    await page.locator('#tabUpload').click();
    await expect(page.locator('#panelUpload')).toBeVisible();
    await expect(page.locator('#panelPaste')).toBeHidden();
    await expect(page).toHaveURL(/dashboard\.html/);

    // Switch back to Demo agreements tab
    await page.locator('#tabDemo').click();
    await expect(page.locator('#panelDemo')).toBeVisible();
    await expect(page.locator('#panelUpload')).toBeHidden();
    await expect(page).toHaveURL(/dashboard\.html/);
  });

  test('synthetic demo agreement runs analysis without "Please sign in" error', async ({ page }) => {
    // Select NDA synthetic demo card
    await page.getByRole('button', { name: /Non-Disclosure Agreement/i }).click();

    // Click Analyze document
    await page.getByRole('button', { name: /Analyze document/i }).click();

    // Verify error is NOT shown
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).not.toContain('Please sign in to access this resource');

    // Verify structured analysis outputs appear
    await expect(page.getByText('ANALYSIS COMPLETE')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('heading', { name: 'Attention radar' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Important clauses' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Questions for a legal professional/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Action checklist' })).toBeVisible();
  });

  test('uploading a DOCX file extracts text and completes analysis', async ({ page }) => {
    // Switch to upload tab
    await page.locator('#tabUpload').click();
    await expect(page.locator('#panelUpload')).toBeVisible();

    // Set file to input
    const docxPath = path.resolve(__dirname, '../fixtures/sample-employment-agreement.docx');
    await page.locator('#fileInput').setInputFiles(docxPath);

    // Verify auto-switch to Paste tab and text population
    await expect(page.locator('#panelPaste')).toBeVisible({ timeout: 5_000 });
    const textareaValue = await page.locator('#documentText').inputValue();
    expect(textareaValue).toContain('EMPLOYMENT AGREEMENT');
    expect(textareaValue).toContain('Non-Solicitation');

    // Run analysis on extracted text
    await page.getByRole('button', { name: /Analyze document/i }).click();

    // Verify analysis succeeds
    await expect(page.getByText('ANALYSIS COMPLETE')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('heading', { name: 'Attention radar' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Action checklist' })).toBeVisible();
  });

  test('footer renders balanced columns, creator credit and legal disclaimer', async ({ page }) => {
    const footer = page.locator('footer.site-footer');
    await expect(footer).toBeVisible();

    // Verify brand
    await expect(footer.locator('.footer-brand')).toBeVisible();

    // Verify headings
    await expect(footer.getByText('PRODUCT', { exact: true })).toBeVisible();
    await expect(footer.getByText('LEGAL', { exact: true })).toBeVisible();
    await expect(footer.getByText('CONNECT', { exact: true })).toBeVisible();

    // Verify creator credit and disclaimer
    await expect(footer.getByText('Built by Soman Singhal')).toBeVisible();
    await expect(footer.locator('.footer-disclaimer')).toContainText('LegalLens AI provides legal information');
  });
});
