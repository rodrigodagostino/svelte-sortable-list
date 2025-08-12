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

		// Get the initial order of the items to verify the starting state
		const initialItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(initialItems).toEqual(getVaryingItems(5).map((item) => item.text));

		// Find the root element, the dragged item (List Item 3) and the ghost element
		const draggedItem = root.locator('[data-item-id="list-item-3"]');
		const ghost = page.locator('.ssl-ghost');

		// Verify root and draggedItem exist
		await expect(root).toBeVisible();
		await expect(draggedItem).toBeVisible();

		// Verify the ghost element is hidden
		await expect(ghost).toBeHidden();

		// Get the bounding boxes for a precise drag operation
		const draggedBox = await draggedItem.boundingBox();
		const rootBox = await root.boundingBox();

		if (!rootBox || !draggedBox) throw new Error('Could not get List Item 3 bounding box');

		// Calculate center of the dragged item
		const draggedCenterX = draggedBox.x + draggedBox.width / 2;
		const draggedCenterY = draggedBox.y + draggedBox.height / 2;

		// Perform the drag and drop operation
		// Start the drag from the center of the dragged item
		await page.mouse.move(draggedCenterX, draggedCenterY);

		// Press the mouse down to start dragging
		await page.mouse.down();

		// Verify the ghost element appears during drag
		await expect(ghost).toHaveAttribute('data-ghost-state', 'ptr-drag');
		await expect(ghost).toBeVisible();

		// Verify the drag state is active
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag');

		// Calculate a drop position outside the list boundaries
		// Drop it to the right of the list container
		const dropX = rootBox.x + rootBox.width + draggedBox.width / 2 + 40;
		const dropY = draggedCenterY; // Keep same Y position

		// Drag outside the list boundaries
		await page.mouse.move(dropX, dropY, { steps: 10 });

		// Release the mouse to drop
		await page.mouse.up();

		// Verify the ghost element switches to the remove state
		await expect(ghost).toHaveAttribute('data-ghost-state', 'ptr-remove');

		// Verify the ghost element disappears after drag completes
		await expect(ghost).toHaveAttribute('data-ghost-state', 'idle');
		await expect(ghost).toBeHidden();

		// Verify dragged item has been removed
		await expect(draggedItem).toBeHidden();

		// Verify the final order
		const finalItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(finalItems).toEqual(removeItem(initialItems, 2));
	});
});
