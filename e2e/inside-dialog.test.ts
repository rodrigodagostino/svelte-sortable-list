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

		// Find the dragged item (List Item 1) and target item (List Item 3)
		const draggedItem = root.locator('[data-item-id="list-item-1"]');
		const targetItem = root.locator('[data-item-id="list-item-3"]');

		// Get the bounding boxes for precise drag operation
		const draggedBox = await draggedItem.boundingBox();
		const targetBox = await targetItem.boundingBox();

		if (!draggedBox || !targetBox) throw new Error('Could not get bounding boxes');

		// Start drag from the center of the dragged item
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			draggedBox.y + draggedBox.height / 2
		);

		// Press the mouse down to start dragging
		await page.mouse.down();

		// Verify the drag state is active
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag');

		// Move to the target position
		await page.mouse.move(
			targetBox.x + targetBox.width / 2,
			targetBox.y + targetBox.height / 2,
			{ steps: 10 } // Smooth movement
		);

		// Release the mouse to drop
		await page.mouse.up();

		// Wait for the drag operation to complete
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify the final order
		const finalItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(finalItems).toEqual(sortItems(initialItems, 0, 2));
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

		// Navigate to the first item using the arrow keys
		await page.keyboard.press('ArrowDown');

		// Verify the List Item 1 is focused
		const focusedItem = root.locator('.ssl-item[aria-selected="true"]');
		await expect(focusedItem).toContainText('List Item 1');

		// Start dragging with the Space key
		await page.keyboard.press('Space');

		// Verify the drag state is active
		await expect(focusedItem).toHaveAttribute('data-drag-state', 'kbd-drag');

		// Move down three times to reach the List Item 3 position
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('ArrowDown');

		// Drop the item with Space key
		await page.keyboard.press('Space');

		// Wait for drop to start by checking the drag state changes to kbd-drop
		await expect(focusedItem).toHaveAttribute('data-drag-state', 'kbd-drop');

		// Wait for the drag operation to complete by checking the drag state returns to idle
		await expect(focusedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify the final order
		const finalItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(finalItems).toEqual(sortItems(initialItems, 0, 2));
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
});
