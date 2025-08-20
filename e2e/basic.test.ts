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

		// Find the dragged item (List Item 1), its content and the target item (List Item 3)
		const draggedItem = root.locator('[data-item-id="list-item-1"]');
		const draggedItemContent = draggedItem.locator('.ssl-item-content');
		const targetItem = root.locator('[data-item-id="list-item-3"]');

		// Find the ghost element and its content
		const ghost = page.locator('.ssl-ghost');
		const ghostItemContent = ghost.locator('.ssl-item-content');

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

		// Verify the dragged item content has full opacity
		await expect(draggedItemContent).toHaveCSS('opacity', '1');

		// Start drag from the center of the dragged item
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			draggedBox.y + draggedBox.height / 2
		);

		// Press the mouse down to start dragging
		await page.mouse.down();

		// Verify the ghost element appears during drag
		await expect(ghost).toHaveAttribute('data-ghost-state', 'ptr-drag-start');
		await expect(ghost).toBeVisible();

		// Wait for the drag operation to start by checking the drag state
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag-start');

		// Verify the ghost item content has the correct box-shadow
		await expect(ghostItemContent).toHaveCSS(
			'box-shadow',
			'rgba(54, 57, 90, 0.1) 0px 1px 1px 0px, rgba(54, 57, 90, 0.1) 0px 2px 2px 0px, rgba(54, 57, 90, 0.1) 0px 4px 4px 0px, rgba(54, 57, 90, 0.1) 0px 6px 8px 0px, rgba(54, 57, 90, 0.1) 0px 8px 16px 0px'
		);

		// Verify the dragged item content has reduced opacity
		await expect(draggedItemContent).toHaveCSS('opacity', '0.5');

		// Move to the target position (center of List Item 3)
		await page.mouse.move(
			targetBox.x + targetBox.width / 2,
			targetBox.y + targetBox.height / 2,
			{ steps: 20 } // Smooth movement
		);

		// Verify the ghost item content has the correct box-shadow
		await expect(ghostItemContent).toHaveCSS(
			'box-shadow',
			'rgba(54, 57, 90, 0.1) 0px 1px 1px 0px, rgba(54, 57, 90, 0.1) 0px 2px 2px 0px, rgba(54, 57, 90, 0.1) 0px 4px 4px 0px, rgba(54, 57, 90, 0.1) 0px 6px 8px 0px, rgba(54, 57, 90, 0.1) 0px 8px 16px 0px'
		);

		// Verify the dragged item content has reduced opacity
		await expect(draggedItemContent).toHaveCSS('opacity', '0.5');

		// Release the mouse to drop
		await page.mouse.up();

		// Wait for the drop to start by checking the drag state changes to ptr-drop
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drop');

		// Verify the ghost element disappears after drag completes
		await expect(ghost).toHaveAttribute('data-ghost-state', 'idle');
		await expect(ghost).toBeHidden();

		// Wait for the drag operation to complete by checking the drag state returns to idle
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify the ghost item content has no box-shadow
		await expect(ghostItemContent).toHaveCSS('box-shadow', 'none');

		// Verify the dragged item content has full opacity
		await expect(draggedItemContent).toHaveCSS('opacity', '1');

		// Verify the final order
		const finalItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(finalItems).toEqual(sortItems(initialItems, 0, 2));
	});

	test('should show correct cursor when interacting with item', async ({ page }) => {
		// Find the dragged item (List Item 1) and its handle
		const root = page.locator('.ssl-root');
		const draggedItem = root.locator('[data-item-id="list-item-1"]');

		// Verify the cursor is the grab cursor
		expect(draggedItem).toHaveCSS('cursor', 'grab');

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
		expect(draggedItem).toHaveCSS('cursor', 'grabbing');

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

		// Get the focused item content
		const focusedItemContent = focusedItem.locator('.ssl-item-content');

		// Verify the focused item has the correct outline
		await expect(focusedItem).toHaveCSS('outline', 'rgb(57, 58, 73) solid 2px');

		// Verify the ghost item content has no box-shadow
		await expect(focusedItemContent).toHaveCSS('box-shadow', 'none');

		// Start dragging with the Space key
		await page.keyboard.press('Space');

		// Verify the focused item content has the correct box-shadow
		await expect(focusedItemContent).toHaveCSS(
			'box-shadow',
			'rgba(54, 57, 90, 0.1) 0px 1px 1px 0px, rgba(54, 57, 90, 0.1) 0px 2px 2px 0px, rgba(54, 57, 90, 0.1) 0px 4px 4px 0px, rgba(54, 57, 90, 0.1) 0px 6px 8px 0px, rgba(54, 57, 90, 0.1) 0px 8px 16px 0px'
		);

		// Verify the drag state is active
		await expect(focusedItem).toHaveAttribute('data-drag-state', 'kbd-drag-start');

		// Move down twice to reach the List Item 3 position
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('ArrowDown');

		// Verify the focused item content has the correct box-shadow
		await expect(focusedItemContent).toHaveCSS(
			'box-shadow',
			'rgba(54, 57, 90, 0.1) 0px 1px 1px 0px, rgba(54, 57, 90, 0.1) 0px 2px 2px 0px, rgba(54, 57, 90, 0.1) 0px 4px 4px 0px, rgba(54, 57, 90, 0.1) 0px 6px 8px 0px, rgba(54, 57, 90, 0.1) 0px 8px 16px 0px'
		);

		// Drop the item with Space key
		await page.keyboard.press('Space');

		// Wait for drop to start by checking the drag state changes to kbd-drop
		await expect(focusedItem).toHaveAttribute('data-drag-state', 'kbd-drop');

		// Wait for the drag operation to complete by checking the drag state returns to idle
		await expect(focusedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify the ghost item content has no box-shadow
		await expect(focusedItemContent).toHaveCSS('box-shadow', 'none');

		// Verify the dragged item is still focused
		expect(focusedItem).toBeFocused();

		// Verify the focused item has the correct outline
		await expect(focusedItem).toHaveCSS('outline', 'rgb(57, 58, 73) solid 2px');

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

		// Move down twice to reach the List Item 3 position
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('ArrowDown');

		// Cancel the drag operation with the Escape key
		await page.keyboard.press('Escape');

		// Wait for cancel to start by checking the drag state changes to kbd-cancel
		await expect(focusedItem).toHaveAttribute('data-drag-state', 'kbd-cancel');

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
