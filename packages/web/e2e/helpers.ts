import { Page } from '@playwright/test';

/**
 * Test credentials — these match the seeded dev database.
 * Override via env vars if needed.
 */
export const TEST_USER = {
  username: process.env.TEST_USERNAME || 'admin',
  password: process.env.TEST_PASSWORD || 'password',
};

/**
 * Log in via the login form and wait for the dashboard to load.
 */
export async function loginAs(page: Page, username = TEST_USER.username, password = TEST_USER.password) {
  await page.goto('/login');
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  // Dashboard is the root route — wait for navigation away from /login
  await page.waitForURL('/');
}
