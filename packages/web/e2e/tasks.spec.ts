import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test.describe('Create task flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await page.goto('/tasks');
    // Wait for the board to finish loading
    await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();
    await expect(page.getByText('Loading tasks...')).not.toBeVisible({ timeout: 10_000 });
  });

  test('opens the task creation form from the board', async ({ page }) => {
    // Click the first "+ Add Task" button (under the TODO column)
    await page.getByRole('button', { name: '+ Add Task' }).first().click();
    // The slide-over panel should appear with the "New Task" heading
    await expect(page.getByRole('heading', { name: 'New Task' })).toBeVisible();
    await expect(page.getByLabel('Title')).toBeVisible();
  });

  test('creates a new task and it appears on the board', async ({ page }) => {
    const taskTitle = `E2E task ${Date.now()}`;

    await page.getByRole('button', { name: '+ Add Task' }).first().click();
    await expect(page.getByRole('heading', { name: 'New Task' })).toBeVisible();

    // Fill in required fields
    await page.getByLabel('Title').fill(taskTitle);

    // Submit the form
    await page.getByRole('button', { name: 'Create' }).click();

    // Form closes after successful submit
    await expect(page.getByRole('heading', { name: 'New Task' })).not.toBeVisible({ timeout: 5_000 });

    // The new task card should appear on the board
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 10_000 });
  });

  test('create form validates — submit is disabled when title is empty', async ({ page }) => {
    await page.getByRole('button', { name: '+ Add Task' }).first().click();
    await expect(page.getByRole('heading', { name: 'New Task' })).toBeVisible();

    // Title is empty by default — Create button should be disabled
    const createBtn = page.getByRole('button', { name: 'Create' });
    await expect(createBtn).toBeDisabled();

    // Typing something should enable it
    await page.getByLabel('Title').fill('Something');
    await expect(createBtn).toBeEnabled();
  });
});
