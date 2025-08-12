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
		// Find the root element
		const root = page.locator('.ssl-root');

		// Get the initial order of the items to verify the starting state
		const initialItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(initialItems).toEqual(getDefaultItems(5).map((item) => item.text));

		// Find the dragged item (List Item 1) and the target item (List Item 3)
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

		// Verify the ghost element appears during drag
		await expect(ghost).toHaveAttribute('data-ghost-state', 'ptr-drag');
		await expect(ghost).toBeVisible();

		// Verify the drag state is active
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag');

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

		// Verify the ghost element disappears after drag completes
		await expect(ghost).toHaveAttribute('data-ghost-state', 'idle');
		await expect(ghost).toBeHidden();

		// Wait for the drag operation to complete by checking the drag state returns to idle
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify the final order
		const finalItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
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
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('ArrowDown');

		// Drop the item with Space key
		await page.keyboard.press('Space');

		// Wait for drop to start by checking the drag state changes to kbd-drop
		await expect(focusedItem).toHaveAttribute('data-drag-state', 'kbd-drop');

		// Wait for the drag operation to complete by checking the drag state returns to idle
		await expect(focusedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify the dragged item is still focused
		expect(focusedItem).toBeFocused();

		// Verify the final order
		const finalItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(finalItems).toEqual(sortItems(initialItems, 0, 2));
	});

	test('should cancel keyboard drag with Escape key', async ({ page }) => {
		// Find the root element
		const root = page.locator('.ssl-root');

		// Get the initial order of the items to verify the starting state
		const initialItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(initialItems).toEqual(getDefaultItems(5).map((item) => item.text));

		// Focus the root and navigate to the first item
		await root.focus();
		await page.keyboard.press('ArrowDown');

		// Verify the List Item 1 is focused
		const focusedItem = root.locator('.ssl-item[aria-selected="true"]');
		await expect(focusedItem).toContainText('List Item 1');

		// Start dragging with the Space key
		await page.keyboard.press('Space');

		// Verify the drag state is active
		await expect(focusedItem).toHaveAttribute('data-drag-state', 'kbd-drag');

		// Move down twice to reach the List Item 3 position
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('ArrowDown');

		// Cancel the drag operation with the Escape key
		await page.keyboard.press('Escape');

		// Wait for cancel to start by checking the drag state changes to kbd-cancel
		await expect(focusedItem).toHaveAttribute('data-drag-state', 'kbd-cancel');

		// Wait for the drag operation to complete by checking the drag state returns to idle
		await expect(focusedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify original order is maintained
		const finalItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(finalItems).toEqual(initialItems);
	});

	test('should support keyboard navigation with Home and End keys', async ({ page }) => {
		// Find the root element and its items
		const root = page.locator('.ssl-root');
		const items = root.locator('.ssl-item');

		// Focus on the root element
		await root.focus();

		// Navigate to the first item using the arrow keys
		await page.keyboard.press('ArrowDown');

		// Press End to go to the last item
		await page.keyboard.press('End');
		await expect(items.nth(4)).toBeFocused();

		// Press Home to go to the first item
		await page.keyboard.press('Home');
		await expect(items.nth(0)).toBeFocused();
	});

	test('should support keyboard drag with Home and End keys', async ({ page }) => {
		// Find the root element
		const root = page.locator('.ssl-root');

		// Get the initial order of the items to verify the starting state
		const initialItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(initialItems).toEqual(getDefaultItems(5).map((item) => item.text));

		// Focus on the root element
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

		// Move down to the end of the list
		await page.keyboard.press('End');

		// Drop the item with Space key
		await page.keyboard.press('Space');

		// Wait for the drag operation to complete by checking the drag state returns to idle
		await expect(focusedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify the midway order
		const midwayItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(midwayItems).toEqual(sortItems(initialItems, 0, 4));

		// Start dragging with the Space key
		await page.keyboard.press('Space');

		// Verify the drag state is active
		await expect(focusedItem).toHaveAttribute('data-drag-state', 'kbd-drag');

		// Move down to the start of the list
		await page.keyboard.press('Home');

		// Drop the item with Space key
		await page.keyboard.press('Space');

		// Wait for the drag operation to complete by checking the drag state returns to idle
		await expect(focusedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify the final order
		const finalItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(finalItems).toEqual(sortItems(midwayItems, 4, 0));
	});
});
