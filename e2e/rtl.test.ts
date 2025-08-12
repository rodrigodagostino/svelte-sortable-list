import { test, expect } from '@playwright/test';
import { sortItems } from '../src/lib/utils/exposed.js';
import { getDefaultItems } from '../src/routes/fixtures.js';

test.describe('Sortable List - RTL', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the RTL page
		await page.goto('/rtl');

		// Wait for the root element to be loaded
		await page.locator('.ssl-root').waitFor();
	});

	test('should drag List Item 1 to List Item 3 position using keyboard', async ({ page }) => {
		// Find the root element
		const root = page.locator('.ssl-root');

		// Get the initial order of items to verify the starting state
		const initialItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(initialItems).toEqual(getDefaultItems(5).map((item) => item.text));

		// Focus the root element
		await root.focus();

		// Navigate to the first item using the arrow keys
		await page.keyboard.press('ArrowDown');

		// Verify the List Item 1 is focused
		const focusedItem = root.locator('.ssl-item[aria-selected="true"]');
		await expect(focusedItem).toContainText('List Item 1');

		// Start dragging with the Space key
		await page.keyboard.press('Space');

		// Verify the drag state is active
		await expect(focusedItem).toHaveAttribute('data-drag-state', 'kbd-drag');

		// Move down twice to reach the List Item 3 position
		await page.keyboard.press('ArrowLeft');
		await page.keyboard.press('ArrowLeft');

		// Drop the item with Space key
		await page.keyboard.press('Space');

		// Wait for the drag operation to complete by checking the drag state returns to idle
		await expect(focusedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify the final order
		const finalItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(finalItems).toEqual(sortItems(initialItems, 0, 2));
	});
});
