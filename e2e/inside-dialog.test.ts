import { test, expect } from '@playwright/test';
import { sortItems } from '../src/lib/utils/exposed.js';
import { getDefaultItems } from '../src/routes/fixtures.js';

test.describe('Sortable List - Inside Dialog', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the Inside Dialog page
		await page.goto('/inside-dialog');
	});

	test('should maintain sortable list functionality inside dialog using mouse', async ({
		page,
	}) => {
		// Find the dialog element
		const dialog = page.locator('dialog');

		// Open the dialog
		const openButton = page.locator('button', { hasText: 'Open dialog' });
		await openButton.click();
		await expect(dialog).toHaveAttribute('open');

		// Find the root element
		const root = dialog.locator('.ssl-root');

		// Get the initial order of the items to verify the starting state
		const initialItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(initialItems).toEqual(getDefaultItems(5).map((item) => item.text));

		// === FIRST DRAG OPERATION ===
		// Find the dragged item (List Item 1) and target item (List Item 3)
		const draggedItem1 = root.locator('[data-item-id="list-item-1"]');
		const targetItem1 = root.locator('[data-item-id="list-item-3"]');

		// Get the bounding boxes for precise drag operation
		let draggedBox = await draggedItem1.boundingBox();
		let targetBox = await targetItem1.boundingBox();
		if (!draggedBox || !targetBox) throw new Error('Could not get bounding boxes for first drag');

		// Start drag from the center of the dragged item
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			draggedBox.y + draggedBox.height / 2
		);

		// Press the mouse down to start dragging
		await page.mouse.down();

		// Wait for the drag operation to start by checking the drag state
		await expect(draggedItem1).toHaveAttribute('data-drag-state', 'ptr-drag-start');

		// Move to the target position
		await page.mouse.move(
			targetBox.x + targetBox.width / 2,
			targetBox.y + targetBox.height / 2,
			{ steps: 40 } // Smooth movement
		);

		// Release the mouse to drop
		await page.mouse.up();

		// Wait for the drag operation to complete
		await expect(draggedItem1).toHaveAttribute('data-drag-state', 'idle');

		// Verify the order after first drag
		const itemsAfterFirstDrag = await root
			.locator('.ssl-item .ssl-item-content__text')
			.allTextContents();
		expect(itemsAfterFirstDrag).toEqual(sortItems(initialItems, 0, 2));

		// === SECOND DRAG OPERATION ===
		// Find the dragged item (List Item 2) and target item (List Item 4)
		const draggedItem2 = root.locator('[data-item-id="list-item-2"]');
		const targetItem2 = root.locator('[data-item-id="list-item-4"]');

		// Get the bounding boxes for precise drag operation
		draggedBox = await draggedItem2.boundingBox();
		targetBox = await targetItem2.boundingBox();
		if (!draggedBox || !targetBox) throw new Error('Could not get bounding boxes for second drag');

		// Start drag from the center of the dragged item
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			draggedBox.y + draggedBox.height / 2
		);

		// Press the mouse down to start dragging
		await page.mouse.down();

		// Wait for the drag operation to start by checking the drag state
		await expect(draggedItem2).toHaveAttribute('data-drag-state', 'ptr-drag-start');

		// Move to the target position
		await page.mouse.move(
			targetBox.x + targetBox.width / 2,
			targetBox.y + targetBox.height / 2,
			{ steps: 40 } // Smooth movement
		);

		// Release the mouse to drop
		await page.mouse.up();

		// Wait for the drag operation to complete
		await expect(draggedItem2).toHaveAttribute('data-drag-state', 'idle');

		// Verify the final order after both drags
		const finalItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(finalItems).toEqual(sortItems(sortItems(initialItems, 0, 2), 0, 3));
	});

	test('should maintain sortable list functionality inside dialog using keyboard', async ({
		page,
	}) => {
		// Find the dialog element
		const dialog = page.locator('dialog');

		// Open the dialog
		const openButton = page.locator('button', { hasText: 'Open dialog' });
		await openButton.click();
		await expect(dialog).toHaveAttribute('open');

		// Find the root element
		const root = dialog.locator('.ssl-root');

		// Get the initial order of the items to verify the starting state
		const initialItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(initialItems).toEqual(getDefaultItems(5).map((item) => item.text));

		// Focus the root element
		await root.focus();

		// === FIRST DRAG OPERATION ===
		// Navigate to the first item using the arrow keys
		await page.keyboard.press('ArrowDown');

		// Verify the List Item 1 is focused
		let focusedItem = root.locator('.ssl-item[aria-selected="true"]');
		await expect(focusedItem).toContainText('List Item 1');
		await expect(focusedItem).toBeFocused();

		// Start dragging with the Space key
		await page.keyboard.press('Space');

		// Move down twice to reach the List Item 3 position
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('ArrowDown');

		// Drop the item with Space key
		await page.keyboard.press('Space');

		// Wait for the drag operation to complete by checking the drag state returns to idle
		await expect(focusedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify the order after first drag
		const itemsAfterFirstDrag = await root
			.locator('.ssl-item .ssl-item-content__text')
			.allTextContents();
		expect(itemsAfterFirstDrag).toEqual(sortItems(initialItems, 0, 2));

		// === SECOND DRAG OPERATION ===
		// Navigate back to List Item 2 (now at the first position after the previous drag)
		await page.keyboard.press('ArrowUp');
		await page.keyboard.press('ArrowUp');

		// Verify List Item 2 is focused
		focusedItem = root.locator('.ssl-item[aria-selected="true"]');
		await expect(focusedItem).toContainText('List Item 2');
		await expect(focusedItem).toBeFocused();

		// Start dragging with the Space key
		await page.keyboard.press('Space');

		// Move down three times to reach the List Item 4 position
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('ArrowDown');

		// Drop the item with Space key
		await page.keyboard.press('Space');

		// Wait for the drag operation to complete by checking the drag state returns to idle
		await expect(focusedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify the final order after both drags
		const finalItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(finalItems).toEqual(sortItems(sortItems(initialItems, 0, 2), 0, 3));
	});

	test('should cancel keyboard drag with Escape key inside dialog', async ({ page }) => {
		const dialog = page.locator('dialog');

		// Open dialog
		const openButton = page.locator('button', { hasText: 'Open dialog' });
		await openButton.click();
		await expect(dialog).toHaveAttribute('open');

		// Find the root element
		const root = dialog.locator('.ssl-root');

		// Get the initial order of the items to verify the starting state
		const initialItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(initialItems).toEqual(getDefaultItems(5).map((item) => item.text));

		// Focus the root and navigate to the first item
		await root.focus();
		await page.keyboard.press('ArrowDown');

		// Verify the List Item 1 is focused
		const focusedItem = root.locator('.ssl-item[aria-selected="true"]');
		await expect(focusedItem).toContainText('List Item 1');
		await expect(focusedItem).toBeFocused();

		// Start dragging with the Space key
		await page.keyboard.press('Space');

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
});
