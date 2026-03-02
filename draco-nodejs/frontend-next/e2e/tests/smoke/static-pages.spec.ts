import { test, expect } from '@playwright/test';

test.describe('Static Pages', () => {
  test('privacy policy page loads', async ({ page }) => {
    await page.goto('/privacy-policy');
    await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('terms of service page loads', async ({ page }) => {
    await page.goto('/terms-of-service');
    await expect(page.getByRole('heading', { name: 'Terms of Service' })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('sign up page loads', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByRole('heading', { name: 'Sign Up' })).toBeVisible({ timeout: 15_000 });
  });

  test('sign up page displays form fields', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('textbox', { name: 'Password', exact: true })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Confirm Password' })).toBeVisible();
  });

  test('reset password page loads', async ({ page }) => {
    await page.goto('/reset-password');
    await expect(page.getByRole('heading', { name: 'Password Reset', exact: true })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('reset password page displays stepper', async ({ page }) => {
    await page.goto('/reset-password');
    await expect(page.getByText('Request Reset')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Verify Token')).toBeVisible();
    await expect(page.getByText('Set New Password')).toBeVisible();
  });

  test('reset password page displays email field', async ({ page }) => {
    await page.goto('/reset-password');
    await expect(page.getByLabel('Email Address')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Send Reset Link' })).toBeVisible();
  });
});
