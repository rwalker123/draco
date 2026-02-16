import { test as setup, expect } from '@playwright/test';
import path from 'path';

const ADMIN_AUTH_FILE = path.join(import.meta.dirname, '.auth', 'admin.json');

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel('Email').fill(process.env.E2E_ADMIN_EMAIL!);
  await page.getByLabel('Password').fill(process.env.E2E_ADMIN_PASSWORD!);
  await page.getByRole('main').getByRole('button', { name: 'Sign In' }).click();

  await page.waitForURL(/\/(accounts|account\/)/, { timeout: 15_000 });

  const token = await page.evaluate(() => localStorage.getItem('jwtToken'));
  expect(token).toBeTruthy();

  await page.context().storageState({ path: ADMIN_AUTH_FILE });
});
