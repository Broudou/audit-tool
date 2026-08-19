import { expect, test } from '@playwright/test';

test('app shell loads and shows the brand header', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Audit Platform')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Foundation ready' })).toBeVisible();
});
