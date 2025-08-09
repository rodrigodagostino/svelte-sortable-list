import { test, expect } from '@playwright/test';
import { sortItems } from '../src/lib/utils/exposed.js';
import { getDefaultItems } from '../src/routes/fixtures.js';

test.describe('Sortable List - Basic', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the Basic page
		await page.goto('/');

		// Wait for the root element to be loaded
		await page.locator('.ssl-root').waitFor();
	});

	test('should drag List Item 1 to List Item 3 position using mouse', async ({ page }) => {
		// Get initial order of items to verify starting state
		const root = page.locator('.ssl-root');
		const initialItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();

		// Verify initial state - expecting List Item 1, 2, 3, 4, 5
		expect(initialItems).toEqual(getDefaultItems(5).map((item) => item.text));

		// Find dragged item (List Item 1) and target item (List Item 3)
		const draggedItem = root.locator('[data-item-id="list-item-1"]');
		const targetItem = root.locator('[data-item-id="list-item-3"]');

		// Find the ghost element
		const ghost = page.locator('.ssl-ghost');

		// Verify both items exist
		await expect(draggedItem).toBeVisible();
		await expect(targetItem).toBeVisible();

		// Verify the ghost element is hidden
		await expect(ghost).toBeHidden();

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

		// Verify the drag state is active
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag');

		// Verify the ghost element appears during drag
		await expect(ghost).toHaveAttribute('data-ghost-state', 'ptr-drag');
		await expect(ghost).toBeVisible();

		// Move to the target position (center of List Item 3)
		await page.mouse.move(
			targetBox.x + targetBox.width / 2,
			targetBox.y + targetBox.height / 2,
			{ steps: 10 } // Smooth movement
		);

		// Release the mouse to drop
		await page.mouse.up();

		// Wait for the drop to start by checking the drag state changes to ptr-drop
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drop');

		// Wait for the drag operation to complete by checking the drag state returns to idle
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify the ghost element disappears after drag completes
		await expect(ghost).toHaveAttribute('data-ghost-state', 'idle');
		await expect(ghost).toBeHidden();

		// Verify final order after drag operation
		const finalItems = await page
			.locator('.ssl-item[data-is-ghost="false"] .ssl-item-content__text')
			.allTextContents();

		// After dragging List Item 1 to position 3, expected order should be:
		// List Item 2, List Item 3, List Item 1, List Item 4, List Item 5
		expect(finalItems).toEqual(sortItems(initialItems, 0, 2));
	});

	test('should show correct cursor when interacting with item', async ({ page }) => {
		// Find the dragged item (List Item 1) and its handle
		const root = page.locator('.ssl-root');
		const draggedItem = root.locator('[data-item-id="list-item-1"]');

		// Get the computed style
		const cursor = await draggedItem.evaluate((el) => {
			return window.getComputedStyle(el).cursor;
		});

		// Should show grab cursor on handle
		expect(cursor).toMatch(/grab/);

		// When dragging, should show grabbing cursor
		const draggedBox = await draggedItem.boundingBox();
		if (!draggedBox) throw new Error('Could not get item bounding box');

		// Start drag from the center of the dragged item
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			draggedBox.y + draggedBox.height / 2
		);

		// Press the mouse down to start dragging
		await page.mouse.down();

		// Check cursor changes to grabbing during drag
		const draggingCursor = await draggedItem.evaluate((el) => {
			return window.getComputedStyle(el).cursor;
		});
		expect(draggingCursor).toMatch(/grabbing/);

		// Release the mouse to drop
		await page.mouse.up();
	});

	test('should drag List Item 1 to List Item 3 position using keyboard', async ({ page }) => {
		// Get initial order of items to verify the starting state
		const initialItems = await page.locator('.ssl-item .ssl-item-content__text').allTextContents();

		// Verify initial state - expecting List Item 1, 2, 3, 4, 5
		expect(initialItems).toEqual(getDefaultItems(5).map((item) => item.text));

		// Focus on root element
		await page.focus('.ssl-root');

		// Navigate to the first item using arrow keys
		await page.keyboard.press('ArrowDown');

		// Verify List Item 1 is focused
		const focusedItem = page.locator('.ssl-item[aria-selected="true"][data-is-ghost="false"]');
		await expect(focusedItem).toContainText('List Item 1');

		// Start dragging with Space key
		await page.keyboard.press('Space');

		// Verify the drag state is active
		await expect(focusedItem).toHaveAttribute('data-drag-state', 'kbd-drag');

		// Move down twice to reach List Item 3 position (past List Item 2 and List Item 3)
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('ArrowDown');

		// Drop the item with Space key
		await page.keyboard.press('Space');

		// Wait for drop to start by checking drag state changes to kbd-drop
		await expect(focusedItem).toHaveAttribute('data-drag-state', 'kbd-drop');

		// Wait for the drag operation to complete by checking the drag state returns to idle
		await expect(focusedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify the final order after the drag operation
		const finalItems = await page
			.locator('.ssl-item[data-is-ghost="false"] .ssl-item-content__text')
			.allTextContents();

		// After dragging List Item 1 to position 3, expected order should be:
		// List Item 2, List Item 3, List Item 1, List Item 4, List Item 5
		expect(finalItems).toEqual(sortItems(initialItems, 0, 2));
	});
});
