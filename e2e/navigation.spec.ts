import { test, expect } from '@playwright/test';

/**
 * Navigation E2E Tests
 * Critical paths: Homepage, News, Showcase navigation
 */
test.describe('Navigation', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    
    // Verify homepage elements
    await expect(page.locator('text=Creation and Creativity')).toBeVisible();
    await expect(page.locator('text=Latest News')).toBeVisible();
    await expect(page.locator('text=Model and Gallery')).toBeVisible();
  });

  test('should navigate to news page', async ({ page }) => {
    await page.goto('/');
    
    // Click news link
    await page.click('text=VIEW ALL', { hasText: /^VIEW ALL$/ });
    
    // Verify news page loaded
    await expect(page.locator('text=News & Updates')).toBeVisible();
  });

  test('should navigate to showcase page', async ({ page }) => {
    await page.goto('/');
    
    // Click on gallery section
    await page.click('text=VIEW ALL', { has: page.locator('[href="/showcase"]') });
    
    // Verify showcase page loaded
    await expect(page.locator('text=Model & Gallery')).toBeVisible();
  });

  test('should navigate to spotlight page', async ({ page }) => {
    await page.goto('/');
    
    await page.click('text=Spotlight');
    
    await expect(page.locator('h1:has-text("Spotlight")')).toBeVisible();
  });
});
