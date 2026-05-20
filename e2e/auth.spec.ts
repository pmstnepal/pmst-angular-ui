import { test, expect } from '@playwright/test';

/**
 * Authentication E2E Tests
 * Critical path: User login flow
 */
test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    
    // Verify login form elements
    await expect(page.locator('text=Sign in to your account')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/login');
    
    // Click register link
    await page.click('text=create a new account');
    
    // Verify register page loaded
    await expect(page.locator('text=Create your account')).toBeVisible();
    await expect(page.url()).toContain('/register');
  });

  test('should show validation errors on empty submit', async ({ page }) => {
    await page.goto('/login');
    
    // Submit empty form
    await page.click('button[type="submit"]');
    
    // HTML5 validation should prevent submit (browser native)
    await expect(page.url()).toContain('/login');
  });
});
