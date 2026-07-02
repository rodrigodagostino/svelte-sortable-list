import { test, expect } from '@playwright/test';
import { announce } from '../src/lib/utils';

test.describe('Sortable List - Basic', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the Basic page
		await page.goto('/');

		// Wait for the root element to be loaded
		await page.locator('.ssl-root').waitFor();
	});

	test('should read correct announcements when navigating and dragging using arrow keys', async ({
		page,
	}) => {
		// Find the root element
		const root = page.locator('.ssl-root');

		// Find the ARIA live region
		const liveRegion = page.locator('.ssl-live-region');

		// Focus the root element
		await root.focus();

		// Verify root’s aria-description
		await expect(root).toHaveAttribute(
			'aria-description',
			'Press the arrow keys to move through the list items. Press Space to start dragging an item. When dragging, use the arrow keys to move the item around. Press Space again to drop the item, or Escape to cancel.'
		);

		// Navigate to the first item using the arrow keys
		await page.keyboard.press('ArrowDown');

		// Verify the List Item 1 is focused
		const focusedItem = root.locator('.ssl-item[aria-selected="true"]');
		await expect(focusedItem).toContainText('List Item 1');

		// Start dragging with the Space key
		await page.keyboard.press('Space');
		// Verify the announcer reads the lifted announcement
		await expect(liveRegion).toContainText(announce.lifted(focusedItem, 0));

		// Move down once to reach the List Item 2 position
		await page.keyboard.press('ArrowDown');
		// Verify the announcer reads the dragged announcement
		await expect(liveRegion).toContainText(
			announce.dragged(focusedItem, 0, root.locator('.ssl-item'), 1)
		);

		// Move down once to reach the List Item 3 position
		await page.keyboard.press('ArrowDown');
		// Verify the announcer reads the dragged announcement
		await expect(liveRegion).toContainText(
			announce.dragged(focusedItem, 0, root.locator('.ssl-item'), 2)
		);

		// Drop the item with Space key
		await page.keyboard.press('Space');
		// Verify the announcer reads the dropped announcement
		await expect(liveRegion).toContainText(
			announce.dropped(focusedItem, 0, root.locator('.ssl-item'), 2)
		);
	});

	test('should read correct announcements when navigating and dragging using Home and End keys', async ({
		page,
	}) => {
		// Find the root element
		const root = page.locator('.ssl-root');

		// Find the ARIA live region
		const liveRegion = page.locator('.ssl-live-region');

		// Focus the root element
		await root.focus();

		// Navigate to the first item using the arrow keys
		await page.keyboard.press('ArrowDown');

		// Verify the List Item 1 is focused
		const focusedItem = root.locator('.ssl-item[aria-selected="true"]');
		await expect(focusedItem).toContainText('List Item 1');

		// Start dragging with the Space key
		await page.keyboard.press('Space');
		// Verify the announcer reads the lifted announcement
		await expect(liveRegion).toContainText(announce.lifted(focusedItem, 0));

		// Move down to the end of the list to reach the List Item 5 position
		await page.keyboard.press('End');
		// Verify the announcer reads the dragged announcement
		await expect(liveRegion).toContainText(
			announce.dragged(focusedItem, 0, root.locator('.ssl-item'), 4)
		);

		// Drop the item with Space key
		await page.keyboard.press('Space');
		// Verify the announcer reads the dropped announcement
		await expect(liveRegion).toContainText(
			announce.dropped(focusedItem, 0, root.locator('.ssl-item'), 4)
		);

		// Start dragging with the Space key
		await page.keyboard.press('Space');
		// Verify the announcer reads the lifted announcement
		await expect(liveRegion).toContainText(announce.lifted(focusedItem, 4));

		// Move up to the start of the list to reach the List Item 2 position
		await page.keyboard.press('Home');
		// Verify the announcer reads the dragged announcement
		await expect(liveRegion).toContainText(
			announce.dragged(focusedItem, 4, root.locator('.ssl-item'), 0)
		);

		// Drop the item with Space key
		await page.keyboard.press('Space');
		// Verify the announcer reads the dropped announcement
		await expect(liveRegion).toContainText(
			announce.dropped(focusedItem, 4, root.locator('.ssl-item'), 0)
		);
	});

	test('should read correct announcements when canceling keyboard drag with Escape key', async ({
		page,
	}) => {
		// Find the root element
		const root = page.locator('.ssl-root');

		// Find the ARIA live region
		const liveRegion = page.locator('.ssl-live-region');

		// Focus the root element
		await root.focus();

		// Navigate to the first item using the arrow keys
		await page.keyboard.press('ArrowDown');

		// Verify the List Item 1 is focused
		const focusedItem = root.locator('.ssl-item[aria-selected="true"]');
		await expect(focusedItem).toContainText('List Item 1');

		// Start dragging with the Space key
		await page.keyboard.press('Space');
		// Verify the announcer reads the lifted announcement
		await expect(liveRegion).toContainText(announce.lifted(focusedItem, 0));

		// Move down 4 times to reach the List Item 5 position
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('ArrowDown');
		// Verify the announcer reads the dragged announcement
		await expect(liveRegion).toContainText(
			announce.dragged(focusedItem, 0, root.locator('.ssl-item'), 4)
		);

		// Cancel the drag operation with the Escape key
		await page.keyboard.press('Escape');
		// Verify the announcer reads the dropped announcement
		await expect(liveRegion).toContainText(announce.canceled(focusedItem, 0));
	});
});
