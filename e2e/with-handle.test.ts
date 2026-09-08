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
		const draggedItem = root.locator('[data-item-id="list-item-1"]:not(.ssl-placeholder)');
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
		const draggedItem1 = root.locator('[data-item-id="list-item-1"]:not(.ssl-placeholder)');
		const draggedHandle1 = draggedItem1.locator('.ssl-item-handle');
		const targetItem1 = root.locator('[data-item-id="list-item-3"]:not(.ssl-placeholder)');

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
		const draggedItem2 = root.locator('[data-item-id="list-item-2"]:not(.ssl-placeholder)');
		const draggedHandle2 = draggedItem2.locator('.ssl-item-handle');
		const targetItem2 = root.locator('[data-item-id="list-item-4"]:not(.ssl-placeholder)');

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
		const draggedItem = root.locator('[data-item-id="list-item-1"]:not(.ssl-placeholder)');
		const draggedHandle = draggedItem.locator('.ssl-item-handle');
		const targetItem = root.locator('[data-item-id="list-item-3"]:not(.ssl-placeholder)');

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

	test('should let the page scroll when swiping over item content while still dragging from the handle', async ({
		page,
		hasTouch,
	}) => {
		// Touch gestures can only be emulated through the Chrome DevTools Protocol on a touch device
		test.skip(!hasTouch, 'Requires touch emulation');

		// Find the root element
		const root = page.locator('.ssl-root');

		// Get the initial order of the items to verify the starting state
		const initialItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(initialItems).toEqual(getDefaultItems(5).map((item) => item.text));

		// Make the page tall enough to scroll without disturbing the layout around the list
		await page.evaluate(() =>
			document.body.insertAdjacentHTML(
				'beforeend',
				'<div style="position: absolute; top: 0; left: 0; width: 1px; height: 300vh; pointer-events: none"></div>'
			)
		);
		expect(await page.evaluate(() => window.scrollY)).toBe(0);
		const rootBox = await root.boundingBox();
		const viewport = page.viewportSize();
		if (!rootBox || !viewport) throw new Error('Could not get root bounding box or viewport size');
		expect(rootBox.y + rootBox.height).toBeLessThanOrEqual(viewport.height);

		// Verify the list leaves touch gestures alone while idle
		await expect(root).toHaveCSS('touch-action', 'auto');

		// Open a CDP session to dispatch real touch gestures
		const cdp = await page.context().newCDPSession(page);
		const waitForFrames = () =>
			page.evaluate(
				() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
			);

		// === DRAG FROM THE HANDLE ===
		// Find the handle of List Item 1 and the target item (List Item 3)
		const handle = root.locator('[data-item-id="list-item-1"] .ssl-item-handle');
		const draggedItem = root.locator('[data-item-id="list-item-1"]:not(.ssl-placeholder)');
		const targetItem = root.locator('[data-item-id="list-item-3"]:not(.ssl-placeholder)');
		const handleBox = await handle.boundingBox();
		const targetBox = await targetItem.boundingBox();
		if (!handleBox || !targetBox)
			throw new Error('Could not get List Item 1 handle or List Item 3 bounding box');

		// Drag List Item 1 to the List Item 3 position with a touch on its handle
		const dragFinger = {
			x: handleBox.x + handleBox.width / 2,
			y: handleBox.y + handleBox.height / 2,
			id: 1,
		};
		const startY = dragFinger.y;
		const targetY = targetBox.y + targetBox.height / 2;
		await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [dragFinger] });
		for (let i = 1; i <= 10; i++) {
			dragFinger.y = startY + ((targetY - startY) * i) / 10;
			await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [dragFinger] });
			await waitForFrames();
		}
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag');

		// Verify the whole list blocks touch gestures while the drag is in progress
		await expect(root).toHaveCSS('touch-action', 'none');

		// Release the finger and wait for the drag operation to complete
		await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [dragFinger] });
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify the page did not scroll during the drag and the items were sorted
		expect(await page.evaluate(() => window.scrollY)).toBe(0);
		const sortedItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(sortedItems).toEqual(sortItems(getDefaultItems(5), 0, 2).map((item) => item.text));
		await expect(root).toHaveCSS('touch-action', 'auto');

		// === SWIPE OVER THE ITEM CONTENT ===
		// Find the text of List Item 2, which lies outside of its handle
		const itemText = root.locator('[data-item-id="list-item-2"] .ssl-item-content__text');
		const textBox = await itemText.boundingBox();
		if (!textBox) throw new Error('Could not get List Item 2 text bounding box');

		// Swipe up over the item text
		const swipeFinger = {
			x: textBox.x + textBox.width / 2,
			y: textBox.y + textBox.height / 2,
			id: 1,
		};
		await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [swipeFinger] });
		for (let i = 0; i < 10; i++) {
			swipeFinger.y -= 15;
			await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [swipeFinger] });
			await waitForFrames();
		}
		await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [swipeFinger] });

		// Verify the page scrolled and no drag was started
		await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
		await expect(root.locator('.ssl-item[data-drag-state*="ptr"]')).toHaveCount(0);
		expect(await root.locator('.ssl-item .ssl-item-content__text').allTextContents()).toEqual(
			sortedItems
		);
	});
});
