import { test, expect } from '@playwright/test';
import { getDefaultItems } from '../src/routes/fixtures.js';
import { sortItems } from '../src/lib/utils/exposed.js';

test.describe('Sortable List - With Handle', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the With Handle page
		await page.goto('/with-handle');

		// Wait for the root element to be loaded
		await page.locator('.ssl-root').waitFor();
	});

	test('should show drag handle for each item', async ({ page }) => {
		// Find list items
		const root = page.locator('.ssl-root');
		const items = await root.locator('.ssl-item').all();

		// Check that each item has a handle
		for (const item of items) {
			const handle = item.locator('.ssl-item-handle');
			await expect(handle).toBeVisible();
		}
	});

	test('should only allow dragging from handle', async ({ page }) => {
		// Find the dragged item (List Item 1)
		const root = page.locator('.ssl-root');
		const draggedItem = root.locator('[data-item-id="list-item-1"]');
		const initialBox = await draggedItem.boundingBox();

		if (!initialBox) throw new Error('Could not get item bounding box');

		// Try to drag from the text (not the handle)
		await page.mouse.move(
			initialBox.x + initialBox.width / 2,
			initialBox.y + initialBox.height / 2
		);
		await page.mouse.down();

		// Move the mouse to trigger any potential drag
		await page.mouse.move(
			initialBox.x + initialBox.width / 2,
			initialBox.y + initialBox.height * 2
		);

		// Release the mouse to drop
		await page.mouse.up();

		// The item should not have moved
		const finalBox = await draggedItem.boundingBox();
		expect(finalBox?.y).toBe(initialBox.y);
	});

	test('should drag List Item 1 to List Item 3 position and List Item 2 to List Item 4 position using the handle', async ({
		page,
	}) => {
		// Find the root element
		const root = page.locator('.ssl-root');

		// Get the initial order of items to verify the starting state
		const initialItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(initialItems).toEqual(getDefaultItems(5).map((item) => item.text));

		// === FIRST DRAG OPERATION ===
		// Find the dragged item (List Item 1), its handle and the target item (List Item 3)
		const draggedItem1 = root.locator('[data-item-id="list-item-1"]');
		const draggedHandle1 = draggedItem1.locator('.ssl-item-handle');
		const targetItem1 = root.locator('[data-item-id="list-item-3"]');

		// Verify elements exist
		await expect(draggedItem1).toBeVisible();
		await expect(draggedHandle1).toBeVisible();
		await expect(targetItem1).toBeVisible();

		// Get the bounding boxes for a precise drag operation
		let targetBox = await targetItem1.boundingBox();
		let handleBox = await draggedHandle1.boundingBox();
		if (!targetBox || !handleBox) throw new Error('Could not get bounding boxes for first drag');

		// Start drag from the center of the handle
		await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);

		// Press the mouse down to start dragging
		await page.mouse.down();

		// Wait for the drag operation to start by checking the drag state
		await expect(draggedItem1).toHaveAttribute('data-drag-state', 'ptr-drag-start');

		// Move to the target position (center of List Item 3)
		await page.mouse.move(
			handleBox.x + handleBox.width / 2,
			targetBox.y + targetBox.height / 2,
			{ steps: 40 } // Smooth movement
		);

		// Release the mouse to drop
		await page.mouse.up();

		// Wait for the drag operation to complete by checking the drag state returns to idle
		await expect(draggedItem1).toHaveAttribute('data-drag-state', 'idle');

		// Verify the order after first drag
		const itemsAfterFirstDrag = await root
			.locator('.ssl-item .ssl-item-content__text')
			.allTextContents();
		expect(itemsAfterFirstDrag).toEqual(sortItems(initialItems, 0, 2));

		// === SECOND DRAG OPERATION ===
		// Find the dragged item (List Item 2), its handle and the target item (List Item 4)
		const draggedItem2 = root.locator('[data-item-id="list-item-2"]');
		const draggedHandle2 = draggedItem2.locator('.ssl-item-handle');
		const targetItem2 = root.locator('[data-item-id="list-item-4"]');

		// Verify elements exist
		await expect(draggedItem2).toBeVisible();
		await expect(draggedHandle2).toBeVisible();
		await expect(targetItem2).toBeVisible();

		// Get the bounding boxes for the second drag operation
		targetBox = await targetItem2.boundingBox();
		handleBox = await draggedHandle2.boundingBox();
		if (!targetBox || !handleBox) throw new Error('Could not get bounding boxes for second drag');

		// Start drag from the center of the handle
		await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);

		// Press the mouse down to start dragging
		await page.mouse.down();

		// Wait for the drag operation to start by checking the drag state
		await expect(draggedItem2).toHaveAttribute('data-drag-state', 'ptr-drag-start');

		// Move to the target position (center of List Item 4)
		await page.mouse.move(
			handleBox.x + handleBox.width / 2,
			targetBox.y + targetBox.height / 2,
			{ steps: 40 } // Smooth movement
		);

		// Release the mouse to drop
		await page.mouse.up();

		// Wait for the drag operation to complete by checking the drag state returns to idle
		await expect(draggedItem2).toHaveAttribute('data-drag-state', 'idle');

		// Verify the final order after both drags
		const finalItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(finalItems).toEqual(sortItems(sortItems(initialItems, 0, 2), 0, 3));
	});

	test('should show correct cursor when interacting with handle', async ({ page }) => {
		// Find the dragged item (List Item 1) and its handle
		const root = page.locator('.ssl-root');
		const draggedItem = root.locator('[data-item-id="list-item-1"]');
		const draggedHandle = draggedItem.locator('.ssl-item-handle');
		const targetItem = root.locator('[data-item-id="list-item-3"]');

		// When dragging, should show grabbing cursor
		const targetBox = await targetItem.boundingBox();
		const handleBox = await draggedHandle.boundingBox();
		if (!targetBox || !handleBox) throw new Error('Could not get handle bounding box');

		// Start drag from the center of the dragged item
		await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);

		// Verify the cursor is the grab cursor
		await expect(draggedHandle).toHaveCSS('cursor', 'grab');

		// Press the mouse down to start dragging
		await page.mouse.down();

		// Wait for the drag operation to start by checking the drag state
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag-start');

		// Check cursor changes to grabbing during drag
		await expect(draggedHandle).toHaveCSS('cursor', 'grabbing');

		// Move to the target position (below List Item 3)
		await page.mouse.move(
			handleBox.x + handleBox.width / 2,
			targetBox.y + targetBox.height / 2,
			{ steps: 40 } // Smooth movement
		);

		// Release the mouse to drop
		await page.mouse.up();

		// Wait for the drag operation to complete by checking the drag state returns to idle
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');

		// Check cursor changes to grabbing during drag
		await expect(draggedHandle).toHaveCSS('cursor', 'grab');
	});
});
