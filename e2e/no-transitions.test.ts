import { test, expect } from '@playwright/test';
import { sortItems } from '../src/lib/utils/exposed.js';
import { getDefaultItems } from '../src/routes/fixtures.js';

test.describe('Sortable List - No Transitions', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the No Transitions page
		await page.goto('/no-transitions');

		// Wait for the root element to be loaded
		await page.locator('.ssl-root').waitFor();
	});

	test('should reorder two items instantly without transition delays', async ({ page }) => {
		// Find the root element
		const root = page.locator('.ssl-root');

		// Get the initial order of the items to verify the starting state
		const initialItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(initialItems).toEqual(getDefaultItems(5).map((item) => item.text));

		// === FIRST DRAG OPERATION ===
		// Find the dragged item (List Item 1) and the target item (List Item 3)
		const draggedItem1 = root.locator('[data-item-id="list-item-1"]');
		const targetItem1 = root.locator('[data-item-id="list-item-3"]');

		// Verify both items exist
		await expect(draggedItem1).toBeVisible();
		await expect(targetItem1).toBeVisible();

		// Get the bounding boxes for a precise drag operation
		let draggedBox = await draggedItem1.boundingBox();
		let targetBox = await targetItem1.boundingBox();
		if (!draggedBox || !targetBox)
			throw new Error('Could not get List Item 1 or List Item 3 bounding box');

		// Start drag from the center of the dragged item
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			draggedBox.y + draggedBox.height / 2
		);

		// Press the mouse down to start dragging
		await page.mouse.down();

		// Wait for the drag operation to start by checking the drag state
		await expect(draggedItem1).toHaveAttribute('data-drag-state', 'ptr-drag-start');

		// Move to the target position (center of List Item 3)
		await page.mouse.move(
			targetBox.x + targetBox.width / 2,
			targetBox.y + targetBox.height / 2,
			{ steps: 40 } // Smooth movement
		);

		// Release the mouse to drop
		await page.mouse.up();

		// Record the start time for first drag
		const startTime1 = Date.now();

		// Wait for the drag operation to complete by checking the drag state returns to idle
		await expect(draggedItem1).toHaveAttribute('data-drag-state', 'idle');

		// Record the end time for first drag
		const endTime1 = Date.now();

		// Verify the first drag operation completed instantly
		expect(endTime1 - startTime1).toBeLessThan(120);

		// Verify the order after first drag
		const itemsAfterFirstDrag = await root
			.locator('.ssl-item .ssl-item-content__text')
			.allTextContents();
		expect(itemsAfterFirstDrag).toEqual(sortItems(initialItems, 0, 2));

		// === SECOND DRAG OPERATION ===
		// Find the dragged item (List Item 2) and the target item (List Item 4)
		const draggedItem2 = root.locator('[data-item-id="list-item-2"]');
		const targetItem2 = root.locator('[data-item-id="list-item-4"]');

		// Verify both items exist
		await expect(draggedItem2).toBeVisible();
		await expect(targetItem2).toBeVisible();

		// Get the bounding boxes for the second drag operation
		draggedBox = await draggedItem2.boundingBox();
		targetBox = await targetItem2.boundingBox();
		if (!draggedBox || !targetBox)
			throw new Error('Could not get List Item 2 or List Item 4 bounding box');

		// Start drag from the center of the dragged item
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			draggedBox.y + draggedBox.height / 2
		);

		// Press the mouse down to start dragging
		await page.mouse.down();

		// Wait for the drag operation to start by checking the drag state
		await expect(draggedItem2).toHaveAttribute('data-drag-state', 'ptr-drag-start');

		// Move to the target position (center of List Item 4)
		await page.mouse.move(
			targetBox.x + targetBox.width / 2,
			targetBox.y + targetBox.height / 2,
			{ steps: 40 } // Smooth movement
		);

		// Release the mouse to drop
		await page.mouse.up();

		// Record the start time for second drag
		const startTime2 = Date.now();

		// Wait for the drag operation to complete by checking the drag state returns to idle
		await expect(draggedItem2).toHaveAttribute('data-drag-state', 'idle');

		// Record the end time for second drag
		const endTime2 = Date.now();

		// Verify the second drag operation completed instantly
		expect(endTime2 - startTime2).toBeLessThan(120);

		// Verify the final order after both drags
		const finalItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		const expectedItems = sortItems(sortItems(initialItems, 0, 2), 0, 3);
		expect(finalItems).toEqual(expectedItems);
	});
});
