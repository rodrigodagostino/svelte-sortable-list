import { test, expect } from '@playwright/test';
import { removeItem } from '../src/lib/utils/exposed.js';
import { getDefaultItems } from '../src/routes/fixtures.js';

test.describe('Sortable List - Dynamic Items', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the Dynamic Items page
		await page.goto('/dynamic-items');

		// Wait for the root element to be loaded
		await page.locator('.ssl-root').waitFor();
	});

	test('should remove List Item 3 by clicking on its remove button', async ({ page }) => {
		// Find the root element
		const root = page.locator('.ssl-root');

		// Get the initial order of items to verify the starting state
		const initialItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(initialItems).toEqual(getDefaultItems(5).map((item) => item.text));

		// Click the remove button for List Item 3
		const listItem3 = root.locator('[data-item-id="list-item-3"]');
		await listItem3.locator('.ssl-item-remove').click();

		// Verify dragged item has been removed
		await listItem3.waitFor({ state: 'detached' });
		await expect(listItem3).toBeHidden();

		// Verify the final order
		const finalItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(finalItems).toEqual(removeItem(initialItems, 2));
	});
});
