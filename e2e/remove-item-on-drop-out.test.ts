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
		const draggedItem1 = root.locator('[data-item-id="list-item-2"]:not(.ssl-placeholder)');
		const draggedItem1Content = draggedItem1.locator('.ssl-item-content');

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

		// Drag outside the list bounds
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			viewport.height - 80,
			{ steps: 40 } // Smooth movement
		);

		// Verify the placeholder item has no height
		const placeholderItem = root.locator('.ssl-placeholder');
		await expect(placeholderItem).toHaveCSS('height', '0px');

		// Verify the dragged item content has the correct background color and border
		await expect(draggedItem1Content).toHaveCSS('background-color', 'oklch(0.81 0.117 11.638)');
		await expect(draggedItem1Content).toHaveCSS(
			'box-shadow',
			'oklch(0.712 0.194 13.428) 0px 0px 0px 1px inset, rgba(54, 57, 90, 0.1) 0px 1px 1px 0px, rgba(54, 57, 90, 0.1) 0px 2px 2px 0px, rgba(54, 57, 90, 0.1) 0px 4px 4px 0px, rgba(54, 57, 90, 0.1) 0px 6px 8px 0px, rgba(54, 57, 90, 0.1) 0px 8px 16px 0px'
		);

		// Release the mouse to drop
		await page.mouse.up();

		// Wait for the removal to start by checking the placeholder item state changes to ptr-remove
		await expect(placeholderItem).toHaveAttribute('data-drag-state', 'ptr-remove');

		// Wait for the drag operation to complete by checking the dragged item state changes to ptr-remove
		await expect(draggedItem1).toHaveAttribute('data-drag-state', 'ptr-remove');

		// Wait for the dragged item to be removed from the viewport
		await expect(draggedItem1).not.toBeInViewport();

		// Wait for the DOM to reflect the removal before continuing
		await expect(root.locator('.ssl-item')).toHaveCount(4);

		// Verify the order after first removal
		const itemsAfterFirstRemoval = await root
			.locator('.ssl-item .ssl-item-content__text')
			.allTextContents();
		expect(itemsAfterFirstRemoval).toEqual(removeItem(initialItems, 1));

		// === SECOND REMOVAL OPERATION ===
		// Find the dragged item (List Item 3)
		const draggedItem2 = root.locator('[data-item-id="list-item-3"]:not(.ssl-placeholder)');
		const draggedItem2Content = draggedItem2.locator('.ssl-item-content');

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

		// Drag outside the list bounds
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			viewport.height - 80,
			{ steps: 40 } // Smooth movement
		);

		// Verify the placeholder item has no height
		await expect(placeholderItem).toHaveCSS('height', '0px');

		// Verify the dragged item content has the correct background color and border
		await expect(draggedItem2Content).toHaveCSS('background-color', 'oklch(0.81 0.117 11.638)');
		await expect(draggedItem2Content).toHaveCSS(
			'box-shadow',
			'oklch(0.712 0.194 13.428) 0px 0px 0px 1px inset, rgba(54, 57, 90, 0.1) 0px 1px 1px 0px, rgba(54, 57, 90, 0.1) 0px 2px 2px 0px, rgba(54, 57, 90, 0.1) 0px 4px 4px 0px, rgba(54, 57, 90, 0.1) 0px 6px 8px 0px, rgba(54, 57, 90, 0.1) 0px 8px 16px 0px'
		);

		// Release the mouse to drop
		await page.mouse.up();

		// Wait for the removal to start by checking the placeholder item state changes to ptr-remove
		await expect(placeholderItem).toHaveAttribute('data-drag-state', 'ptr-remove');

		// Wait for the drag operation to complete by checking the dragged item state changes to ptr-remove
		await expect(draggedItem2).toHaveAttribute('data-drag-state', 'ptr-remove');

		// Wait for the dragged item to be removed from the viewport
		await expect(draggedItem2).not.toBeInViewport();

		// Wait for the DOM to reflect the removal before asserting
		await expect(root.locator('.ssl-item')).toHaveCount(3);

		// Verify the final order after both removals
		const finalItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(finalItems).toEqual(removeItem(itemsAfterFirstRemoval, 1));
	});

	test('should not remove List Item 2 when the pointer is canceled outside the list', async ({
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

		// Find the dragged item (List Item 2)
		const draggedItem = root.locator('[data-item-id="list-item-2"]:not(.ssl-placeholder)');

		// Get the bounding box for a precise drag operation
		const draggedBox = await draggedItem.boundingBox();
		if (!draggedBox) throw new Error('Could not get List Item 2 bounding box');

		// Start the drag from the center of the dragged item
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			draggedBox.y + draggedBox.height / 2
		);

		// Press the mouse down to start dragging
		await page.mouse.down();

		// Wait for the drag operation to start by checking the drag state
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag-start');

		// Drag outside the list bounds
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			viewport.height - 80,
			{ steps: 40 } // Smooth movement
		);

		// Verify the dragged item is marked as being outside the list bounds
		await expect(draggedItem).toHaveAttribute('data-is-within-bounds', 'false');

		// Cancel the drag operation (the browser does this on its own, e.g. when a touch is
		// interrupted). Playwright’s mouse can’t emit it, so dispatch it on the document directly.
		await page.evaluate(() => document.dispatchEvent(new PointerEvent('pointercancel')));

		// Wait for the dragged item to return to its slot
		await expect(draggedItem).toHaveAttribute('data-is-within-bounds', 'true');
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify no item was removed and the order is unchanged
		await expect(root.locator('.ssl-item')).toHaveCount(5);
		const itemsAfterCancel = await root
			.locator('.ssl-item .ssl-item-content__text')
			.allTextContents();
		expect(itemsAfterCancel).toEqual(initialItems);
	});

	test('should remove List Item 2 only once when pointer capture is lost right before the pointer is released', async ({
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

		// Find the dragged item (List Item 2)
		const draggedItem = root.locator('[data-item-id="list-item-2"]:not(.ssl-placeholder)');

		// Get the bounding box for a precise drag operation
		const draggedBox = await draggedItem.boundingBox();
		if (!draggedBox) throw new Error('Could not get List Item 2 bounding box');

		// Start the drag from the center of the dragged item
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			draggedBox.y + draggedBox.height / 2
		);

		// Press the mouse down to start dragging
		await page.mouse.down();

		// Wait for the drag operation to start by checking the drag state
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag-start');

		// Drag outside the list bounds
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			viewport.height - 80,
			{ steps: 40 } // Smooth movement
		);

		// Verify the dragged item is marked as being outside the list bounds
		await expect(draggedItem).toHaveAttribute('data-is-within-bounds', 'false');

		// Chromium on macOS can fire `lostpointercapture` before `pointerup`. Both events end the drag,
		// so they must not each run a drop of their own (that fired `ondrop` twice and removed two
		// items). Playwright’s mouse can’t reproduce that ordering, so dispatch the first event on the
		// document directly and then release the mouse.
		await page.evaluate(() => document.dispatchEvent(new PointerEvent('lostpointercapture')));
		await page.mouse.up();

		// Wait for the removal to start and the drag operation to fully complete
		const placeholderItem = root.locator('.ssl-placeholder');
		await expect(placeholderItem).toHaveAttribute('data-drag-state', 'ptr-remove');
		await expect(placeholderItem).toHaveCount(0);

		// Verify exactly one item was removed
		await expect(root.locator('.ssl-item')).toHaveCount(4);
		const itemsAfterRemoval = await root
			.locator('.ssl-item .ssl-item-content__text')
			.allTextContents();
		expect(itemsAfterRemoval).toEqual(removeItem(initialItems, 1));
	});
});
