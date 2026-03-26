import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';
import { format } from 'date-fns';

/**
 * Find today's day cell in the calendar grid.
 *
 * DayCell renders today's date number inside a span with class
 * "bg-primary-600 text-white font-bold". We locate that span and
 * then click the parent cell div.
 */
async function clickTodayCell(page: import('@playwright/test').Page) {
  // The today span has bg-primary-600 applied — click its parent cell
  const todaySpan = page.locator('span.bg-primary-600.text-white.font-bold').first();
  await expect(todaySpan).toBeVisible({ timeout: 5_000 });
  // Click the parent div (the day cell)
  await todaySpan.locator('..').click();
}

test.describe('Calendar view', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await page.goto('/calendar');
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible();
  });

  test('renders the calendar view with month/week toggle', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Month' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Week' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Today' })).toBeVisible();
    // Should show current month heading (e.g. "March 2026")
    const monthYear = format(new Date(), 'MMMM yyyy');
    await expect(page.getByText(monthYear)).toBeVisible();
  });
});

test.describe('Create calendar event flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await page.goto('/calendar');
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible();
    // Wait for calendar grid to render
    await expect(page.locator('span.bg-primary-600.text-white.font-bold').first()).toBeVisible({ timeout: 10_000 });
  });

  test('opens the event creation form by clicking today', async ({ page }) => {
    await clickTodayCell(page);
    await expect(page.getByRole('heading', { name: 'New Event' })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByLabel('Title')).toBeVisible();
    await expect(page.getByLabel('Date')).toBeVisible();
  });

  test('creates a new event and it appears on the calendar', async ({ page }) => {
    const eventTitle = `E2E event ${Date.now()}`;
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    await clickTodayCell(page);
    await expect(page.getByRole('heading', { name: 'New Event' })).toBeVisible({ timeout: 5_000 });

    // Fill in event details
    await page.getByLabel('Title').fill(eventTitle);

    // Confirm date defaults to today
    await expect(page.getByLabel('Date')).toHaveValue(todayStr);

    // Submit
    await page.getByRole('button', { name: 'Create' }).click();

    // Form closes after submit
    await expect(page.getByRole('heading', { name: 'New Event' })).not.toBeVisible({ timeout: 5_000 });

    // The event title should appear on the calendar grid
    await expect(page.getByText(eventTitle)).toBeVisible({ timeout: 10_000 });
  });

  test('create form is disabled when title is empty', async ({ page }) => {
    await clickTodayCell(page);
    await expect(page.getByRole('heading', { name: 'New Event' })).toBeVisible({ timeout: 5_000 });

    // Create button should be disabled until title is filled
    const createBtn = page.getByRole('button', { name: 'Create' });
    await expect(createBtn).toBeDisabled();

    await page.getByLabel('Title').fill('Team standup');
    await expect(createBtn).toBeEnabled();
  });
});
