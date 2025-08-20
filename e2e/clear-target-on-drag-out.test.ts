import { test, expect } from '@playwright/test';
import { getDefaultItems } from '../src/routes/fixtures.js';

test.describe('Sortable List - Clear Target On Drag Out', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the Clear Target On Drag Out page
		await page.goto('/clear-target-on-drag-out');

		// Wait for the root element to be loaded
		await page.locator('.ssl-root').waitFor();
	});

	test('should clear target by dragging item outside list', async ({ page }) => {
		// Find the root element
		const root = page.locator('.ssl-root');

		// Get the viewport size
		const viewport = page.viewportSize();
		if (!viewport) throw new Error('Could not get viewport size');

		// Get the initial order of the items to verify the starting state
		const initialItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(initialItems).toEqual(getDefaultItems(5).map((item) => item.text));

		// Find the dragged item (List Item 1) and the target item (List Item 3)
		const draggedItem = root.locator('[data-item-id="list-item-1"]');
		const targetItem = root.locator('[data-item-id="list-item-3"]');

		// Get the bounding boxes for a precise drag operation
		const draggedBox = await draggedItem.boundingBox();
		const targetBox = await targetItem.boundingBox();
		if (!draggedBox || !targetBox)
			throw new Error('Could not get List Item 1 or List Item 3 bounding box');

		// Start drag from the center of the dragged item
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			draggedBox.y + draggedBox.height / 2
		);

		// Press the mouse down to start dragging
		await page.mouse.down();

		// Move to the right edge of the viewport
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			viewport.height - 80,
			{ steps: 20 } // Smooth movement
		);

		// Release the mouse to drop
		await page.mouse.up();

		// Wait for the drop to start by checking the drag state changes to ptr-drop
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drop');

		// Wait for the drag operation to complete by checking the drag state returns to idle
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify the final order
		const finalItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(finalItems).toEqual(initialItems);
	});
});
