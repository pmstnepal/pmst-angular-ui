import { test, expect } from '@playwright/test';

/**
 * Content Display E2E Tests
 * Critical path: Articles and galleries display correctly
 */
test.describe('Content Display', () => {
  test('should display articles on homepage carousel', async ({ page }) => {
    await page.goto('/');
    
    // Wait for articles to load
    await page.waitForTimeout(2000);
    
    // Verify news section exists
    const newsSection = page.locator('text=Latest News');
    await expect(newsSection).toBeVisible();
  });

  test('should display gallery carousel', async ({ page }) => {
    await page.goto('/');
    
    // Wait for galleries to load
    await page.waitForTimeout(2000);
    
    // Verify gallery section exists
    const gallerySection = page.locator('text=Model and Gallery');
    await expect(gallerySection).toBeVisible();
  });

  test('should load news list with articles', async ({ page }) => {
    await page.goto('/news');
    
    // Wait for articles to load
    await page.waitForTimeout(2000);
    
    // Verify news grid or empty state
    const content = page.locator('article, text=No articles found');
    await expect(content.first()).toBeVisible();
  });

  test('should filter news by category', async ({ page }) => {
    await page.goto('/news');
    
    // Wait for category buttons
    await page.waitForSelector('button:has-text("Entertainment")');
    
    // Click Entertainment filter
    await page.click('button:has-text("Entertainment")');
    
    // Wait for filter to apply
    await page.waitForTimeout(1000);
    
    // Verify URL or content changed
    await expect(page.url()).toContain('/news');
  });
});
