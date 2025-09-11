import test, { expect } from '@playwright/test';
import { getDefaultItems } from '../src/routes/fixtures';
import { sortItems } from '../src/lib/utils/exposed';

test.describe('Sortable List - With Delay', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the With Delay page
		await page.goto('/with-delay');

		// Wait for the root element to be loaded
		await page.locator('.ssl-root').waitFor();
	});

	test('should not drag List Item 1 to List Item 3 position using mouse', async ({ page }) => {
		// Find the root element
		const root = page.locator('.ssl-root');

		// Get the initial order of the items to verify the starting state
		const initialItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(initialItems).toEqual(getDefaultItems(5).map((item) => item.text));

		// Find the dragged item (List Item 1), its content and the target item (List Item 3)
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

		// Move to the target position (center of List Item 3)
		await page.mouse.move(
			targetBox.x + targetBox.width / 2,
			targetBox.y + targetBox.height / 2,
			{ steps: 40 } // Smooth movement
		);

		// Release the mouse to drop
		await page.mouse.up();

		// Wait for the drag operation to complete by checking the drag state returns to idle
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify the final order
		const finalItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(finalItems).toEqual(initialItems);
	});

	test('should drag List Item 1 to List Item 3 position using mouse after waiting for delay to complete', async ({
		page,
	}) => {
		// Find the root element
		const root = page.locator('.ssl-root');

		// Get the initial order of the items to verify the starting state
		const initialItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(initialItems).toEqual(getDefaultItems(5).map((item) => item.text));

		// Find the dragged item (List Item 1), its content and the target item (List Item 3)
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

		await page.waitForTimeout(1000);

		// Move to the target position (center of List Item 3)
		await page.mouse.move(
			targetBox.x + targetBox.width / 2,
			targetBox.y + targetBox.height / 2,
			{ steps: 40 } // Smooth movement
		);

		// Release the mouse to drop
		await page.mouse.up();

		// Wait for the drag operation to complete by checking the drag state returns to idle
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify the final order
		const finalItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(finalItems).toEqual(sortItems(initialItems, 0, 2));
	});
});
