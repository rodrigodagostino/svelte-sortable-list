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

	test('should remove List Item 2 and List Item 3 by dropping them outside the list', async ({
		page,
	}) => {
		// Find the root element
		const root = page.locator('.ssl-root');

		// Get the viewport size
		const viewport = page.viewportSize();
		if (!viewport) throw new Error('Could not get viewport size');

		// Get the initial order of the items to verify the starting state
		const initialItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(initialItems).toEqual(getVaryingItems(5).map((item) => item.text));

		// === FIRST REMOVAL OPERATION ===
		// Find the dragged item (List Item 2), the ghost element and its content
		const draggedItem1 = root.locator('[data-item-id="list-item-2"]');
		const ghost = page.locator('.ssl-ghost');
		const ghostItemContent = ghost.locator('.ssl-item-content');

		// Get the bounding box for a precise drag operation
		let draggedBox = await draggedItem1.boundingBox();
		if (!draggedBox) throw new Error('Could not get List Item 2 bounding box');

		// Start the drag from the center of the dragged item
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			draggedBox.y + draggedBox.height / 2
		);

		// Press the mouse down to start dragging
		await page.mouse.down();

		// Wait for the drag operation to start by checking the drag state
		await expect(draggedItem1).toHaveAttribute('data-drag-state', 'ptr-drag-start');

		// Drag outside the list boundaries
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			viewport.height - 80,
			{ steps: 40 } // Smooth movement
		);

		// Verify the dragged item has no height
		await expect(draggedItem1).toHaveCSS('height', '0px');

		// Verify the ghost item content has the correct background color and border
		await expect(ghostItemContent).toHaveCSS('background-color', 'rgb(253, 164, 175)');
		await expect(ghostItemContent).toHaveCSS(
			'box-shadow',
			'rgb(251, 113, 133) 0px 0px 0px 1px inset, rgba(54, 57, 90, 0.1) 0px 1px 1px 0px, rgba(54, 57, 90, 0.1) 0px 2px 2px 0px, rgba(54, 57, 90, 0.1) 0px 4px 4px 0px, rgba(54, 57, 90, 0.1) 0px 6px 8px 0px, rgba(54, 57, 90, 0.1) 0px 8px 16px 0px'
		);

		// Release the mouse to drop
		await page.mouse.up();

		// Wait for the removal to start by checking the ghost state changes to ptr-remove
		await expect(ghost).toHaveAttribute('data-ghost-state', 'ptr-remove');

		// Wait for the drag operation to complete by checking the ghost state returns to idle
		await expect(ghost).toHaveAttribute('data-ghost-state', 'idle');

		// Verify the order after first removal
		const itemsAfterFirstRemoval = await root
			.locator('.ssl-item .ssl-item-content__text')
			.allTextContents();
		expect(itemsAfterFirstRemoval).toEqual(removeItem(initialItems, 1));

		// === SECOND REMOVAL OPERATION ===
		// Find the dragged item (List Item 3)
		const draggedItem2 = root.locator('[data-item-id="list-item-3"]');

		// Get the bounding box for a precise drag operation
		draggedBox = await draggedItem2.boundingBox();
		if (!draggedBox) throw new Error('Could not get List Item 3 bounding box');

		// Start the drag from the center of the dragged item
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			draggedBox.y + draggedBox.height / 2
		);

		// Press the mouse down to start dragging
		await page.mouse.down();

		// Wait for the drag operation to start by checking the drag state
		await expect(draggedItem2).toHaveAttribute('data-drag-state', 'ptr-drag-start');

		// Drag outside the list boundaries
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			viewport.height - 80,
			{ steps: 40 } // Smooth movement
		);

		// Verify the dragged item has no height
		await expect(draggedItem2).toHaveCSS('height', '0px');

		// Verify the ghost item content has the correct background color and border
		await expect(ghostItemContent).toHaveCSS('background-color', 'rgb(253, 164, 175)');
		await expect(ghostItemContent).toHaveCSS(
			'box-shadow',
			'rgb(251, 113, 133) 0px 0px 0px 1px inset, rgba(54, 57, 90, 0.1) 0px 1px 1px 0px, rgba(54, 57, 90, 0.1) 0px 2px 2px 0px, rgba(54, 57, 90, 0.1) 0px 4px 4px 0px, rgba(54, 57, 90, 0.1) 0px 6px 8px 0px, rgba(54, 57, 90, 0.1) 0px 8px 16px 0px'
		);

		// Release the mouse to drop
		await page.mouse.up();

		// Wait for the removal to start by checking the ghost state changes to ptr-remove
		await expect(ghost).toHaveAttribute('data-ghost-state', 'ptr-remove');

		// Wait for the drag operation to complete by checking the ghost state returns to idle
		await expect(ghost).toHaveAttribute('data-ghost-state', 'idle');

		// Verify the final order after both removals
		const finalItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(finalItems).toEqual(removeItem(itemsAfterFirstRemoval, 1));
	});
});
