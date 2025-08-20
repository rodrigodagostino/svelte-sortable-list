import { test, expect } from '@playwright/test';
import { removeItem } from '../src/lib/utils/exposed.js';
import { getVaryingItems } from '../src/routes/fixtures.js';

test.describe('Sortable List - Remove Item On Drop Out', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the Remove Item On Drop Out page
		await page.goto('/remove-item-on-drop-out');

		// Wait for the root element to be loaded
		await page.locator('.ssl-root').waitFor();
	});

	test('should remove List Item 3 by dropping it outside list', async ({ page }) => {
		// Find the root element
		const root = page.locator('.ssl-root');

		// Get the viewport size
		const viewport = page.viewportSize();
		if (!viewport) throw new Error('Could not get viewport size');

		// Get the initial order of the items to verify the starting state
		const initialItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(initialItems).toEqual(getVaryingItems(5).map((item) => item.text));

		// Find the dragged item (List Item 3), the ghost element and its content
		const draggedItem = root.locator('[data-item-id="list-item-3"]');
		const ghost = page.locator('.ssl-ghost');
		const ghostItemContent = ghost.locator('.ssl-item-content');

		// Get the bounding boxes for a precise drag operation
		const draggedBox = await draggedItem.boundingBox();
		if (!draggedBox) throw new Error('Could not get List Item 3 bounding box');

		// Start the drag from the center of the dragged item
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			draggedBox.y + draggedBox.height / 2
		);

		// Press the mouse down to start dragging
		await page.mouse.down();

		// Drag outside the list boundaries
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			viewport.height - 80,
			{ steps: 20 } // Smooth movement
		);

		// Verify the dragged item has no height
		await expect(draggedItem).toHaveCSS('height', '0px');

		// Verify the ghost item content has the correct background color and border
		await expect(ghostItemContent).toHaveCSS('background-color', 'rgb(253, 164, 175)');
		await expect(ghostItemContent).toHaveCSS('border', '1px solid rgb(251, 113, 133)');

		// Release the mouse to drop
		await page.mouse.up();

		// Wait for the removal to start by checking the ghost state changes to ptr-remove
		await expect(ghost).toHaveAttribute('data-ghost-state', 'ptr-remove');

		// Wait for the drag operation to complete by checking the ghost state returns to idle
		await expect(ghost).toHaveAttribute('data-ghost-state', 'idle');

		// Verify the final order
		const finalItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(finalItems).toEqual(removeItem(initialItems, 2));
	});
});
