import { test, expect } from '@playwright/test';
import { getDefaultItems } from '../src/routes/fixtures.js';
import { sortItems } from '../src/lib/utils/exposed.js';

test.describe('Sortable List - Direction Horizontal', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the Direction Horizontal page
		await page.goto('/direction-horizontal');

		// Wait for the root element to be loaded
		await page.locator('.ssl-root').waitFor();
	});

	test('should display all 5 items horizontally next to each other', async ({ page }) => {
		// Find the root element
		const root = page.locator('.ssl-root');

		// Verify the root has horizontal orientation
		await expect(root).toHaveAttribute('aria-orientation', 'horizontal');

		// Get all items
		const items = root.locator('.ssl-item');

		// Verify there are 5 items
		await expect(items).toHaveCount(5);

		// Verify items are on the same horizontal line
		const firstItemBox = await items.nth(0).boundingBox();
		for (let i = 1; i < 5; i++) {
			const currentItemBox = await items.nth(i).boundingBox();
			expect(currentItemBox?.y).toEqual(firstItemBox?.y);
		}
	});

	test('should support side arrows navigation for horizontal direction', async ({ page }) => {
		// Find the root element
		const root = page.locator('.ssl-root');
		const items = root.locator('.ssl-item');

		// Focus the root element
		await root.focus();

		// Navigate to the first item
		await page.keyboard.press('ArrowRight');
		await expect(items.nth(0)).toBeFocused();

		// Move to the second item
		await page.keyboard.press('ArrowRight');
		await expect(items.nth(1)).toBeFocused();

		// Move back to the first item using left arrow
		await page.keyboard.press('ArrowLeft');
		await expect(items.nth(0)).toBeFocused();

		// Should not move beyond the first item
		await page.keyboard.press('ArrowLeft');
		await expect(items.nth(0)).toBeFocused();
	});

	test('should support side arrows dragging for horizontal direction', async ({ page }) => {
		// Find the root element
		const root = page.locator('.ssl-root');

		// Get the initial order of items to verify the starting state
		const initialItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(initialItems).toEqual(getDefaultItems(5).map((item) => item.text));

		// Focus the root element
		await root.focus();

		// Navigate to the first item using the arrow keys (ArrowRight for horizontal)
		await page.keyboard.press('ArrowRight');

		// Verify the List Item 1 is focused
		const focusedItem = root.locator('.ssl-item[aria-selected="true"]');
		await expect(focusedItem).toContainText('List Item 1');

		// Start dragging with the Space key
		await page.keyboard.press('Space');

		// Move right twice to reach the List Item 3 position
		await page.keyboard.press('ArrowRight');
		await page.keyboard.press('ArrowRight');

		// Drop the item with Space key
		await page.keyboard.press('Space');

		// Wait for the drag operation to complete by checking the drag state returns to idle
		await expect(focusedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify the final order
		const finalItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(finalItems).toEqual(sortItems(initialItems, 0, 2));
	});
});
