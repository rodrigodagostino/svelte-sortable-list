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

	test('should not drag List Item 1 to List Item 3 position and List Item 2 to List Item 4 position using mouse', async ({
		page,
	}) => {
		// Find the root element
		const root = page.locator('.ssl-root');

		// Get the initial order of the items to verify the starting state
		const initialItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(initialItems).toEqual(getDefaultItems(5).map((item) => item.text));

		// === FIRST (FAILED) DRAG OPERATION ===
		// Find the dragged item (List Item 1) and the target item (List Item 3)
		const draggedItem1 = root.locator('[data-item-id="list-item-1"]:not(.ssl-placeholder)');
		const targetItem1 = root.locator('[data-item-id="list-item-3"]:not(.ssl-placeholder)');

		// Get the bounding boxes for a precise drag operation
		let draggedBox = await draggedItem1.boundingBox();
		let targetBox = await targetItem1.boundingBox();

		if (!draggedBox || !targetBox)
			throw new Error('Could not get List Item 1 or List Item 3 bounding box');

		// Start drag from the center of the dragged item
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			draggedBox.y + draggedBox.height / 2
		);

		// Press the mouse down to start dragging
		await page.mouse.down();

		// Move to the target position without waiting for the delay (center of List Item 3)
		await page.mouse.move(
			targetBox.x + targetBox.width / 2,
			targetBox.y + targetBox.height / 2,
			{ steps: 40 } // Smooth movement
		);

		// Verify a drag operation was not started
		await expect(draggedItem1).toHaveAttribute('data-drag-state', 'idle');
		// Verify no placeholder is present
		await expect(root.locator('.ssl-placeholder')).toHaveCount(0);

		// Release the mouse to drop
		await page.mouse.up();

		// Verify the order is unchanged after the failed first drag
		const itemsAfterFirstDrag = await root
			.locator('.ssl-item .ssl-item-content__text')
			.allTextContents();
		expect(itemsAfterFirstDrag).toEqual(initialItems);

		// === SECOND (FAILED) DRAG OPERATION ===
		// Find the dragged item (List Item 2) and the target item (List Item 4)
		const draggedItem2 = root.locator('[data-item-id="list-item-2"]:not(.ssl-placeholder)');
		const targetItem2 = root.locator('[data-item-id="list-item-4"]:not(.ssl-placeholder)');

		// Get the bounding boxes for a precise drag operation
		draggedBox = await draggedItem2.boundingBox();
		targetBox = await targetItem2.boundingBox();

		if (!draggedBox || !targetBox)
			throw new Error('Could not get List Item 2 or List Item 4 bounding box');

		// Start drag from the center of the dragged item
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			draggedBox.y + draggedBox.height / 2
		);

		// Press the mouse down to start dragging
		await page.mouse.down();

		// Move to the target position without waiting for the delay (center of List Item 4)
		await page.mouse.move(
			targetBox.x + targetBox.width / 2,
			targetBox.y + targetBox.height / 2,
			{ steps: 40 } // Smooth movement
		);

		// Verify a drag operation was not started
		await expect(draggedItem1).toHaveAttribute('data-drag-state', 'idle');
		// Verify no placeholder is present
		await expect(root.locator('.ssl-placeholder')).toHaveCount(0);

		// Release the mouse to drop
		await page.mouse.up();

		// Verify the final order remains unchanged after both failed drags
		const finalItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(finalItems).toEqual(initialItems);
	});

	test('should drag List Item 1 to List Item 3 position and List Item 2 to List Item 4 position using mouse after waiting for delay to complete', async ({
		page,
	}) => {
		// Find the root element
		const root = page.locator('.ssl-root');

		// Get the initial order of the items to verify the starting state
		const initialItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(initialItems).toEqual(getDefaultItems(5).map((item) => item.text));

		// === FIRST DRAG OPERATION ===
		// Find the dragged item (List Item 1) and the target item (List Item 3)
		const draggedItem1 = root.locator('[data-item-id="list-item-1"]:not(.ssl-placeholder)');
		const targetItem1 = root.locator('[data-item-id="list-item-3"]:not(.ssl-placeholder)');

		// Get the bounding boxes for a precise drag operation
		let draggedBox = await draggedItem1.boundingBox();
		let targetBox = await targetItem1.boundingBox();

		if (!draggedBox || !targetBox)
			throw new Error('Could not get List Item 1 or List Item 3 bounding box');

		// Start drag from the center of the dragged item
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			draggedBox.y + draggedBox.height / 2
		);

		// Press the mouse down to start dragging
		await page.mouse.down();

		// Wait for the delay to complete before moving
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
		await expect(draggedItem1).toHaveAttribute('data-drag-state', 'idle');

		// Verify the order after first drag
		const itemsAfterFirstDrag = await root
			.locator('.ssl-item .ssl-item-content__text')
			.allTextContents();
		expect(itemsAfterFirstDrag).toEqual(sortItems(initialItems, 0, 2));

		// === SECOND DRAG OPERATION ===
		// Find the dragged item (List Item 2) and the target item (List Item 4)
		const draggedItem2 = root.locator('[data-item-id="list-item-2"]:not(.ssl-placeholder)');
		const targetItem2 = root.locator('[data-item-id="list-item-4"]:not(.ssl-placeholder)');

		// Get the bounding boxes for the second drag operation
		draggedBox = await draggedItem2.boundingBox();
		targetBox = await targetItem2.boundingBox();

		if (!draggedBox || !targetBox)
			throw new Error('Could not get List Item 2 or List Item 4 bounding box');

		// Start drag from the center of the dragged item
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			draggedBox.y + draggedBox.height / 2
		);

		// Press the mouse down to start dragging
		await page.mouse.down();

		// Wait for the delay to complete before moving
		await page.waitForTimeout(1000);

		// Move to the target position (center of List Item 4)
		await page.mouse.move(
			targetBox.x + targetBox.width / 2,
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

	test('should not start dragging when the pointer is canceled or loses capture before the delay completes', async ({
		page,
	}) => {
		// Find the root element
		const root = page.locator('.ssl-root');

		// Get the initial order of the items to verify the starting state
		const initialItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(initialItems).toEqual(getDefaultItems(5).map((item) => item.text));

		// Find the item to press (List Item 1)
		const pressedItem = root.locator('[data-item-id="list-item-1"]:not(.ssl-placeholder)');

		// Get the bounding box for a precise press
		const pressedBox = await pressedItem.boundingBox();
		if (!pressedBox) throw new Error('Could not get List Item 1 bounding box');

		// Neither event is followed by a `pointerup`, and Playwright’s mouse can’t emit them,
		// so they are dispatched on the document directly.
		for (const type of ['pointercancel', 'lostpointercapture']) {
			// Press the mouse down on the center of the item
			await page.mouse.move(
				pressedBox.x + pressedBox.width / 2,
				pressedBox.y + pressedBox.height / 2
			);
			// Record the id of the pointer that presses, so the synthetic events below come from that pointer
			await page.evaluate(() =>
				document.addEventListener(
					'pointerdown',
					(e) => (document.documentElement.dataset.pointerId = String(e.pointerId)),
					{ once: true, capture: true }
				)
			);
			await page.mouse.down();

			// End the pointer before the delay (400ms) completes
			await page.waitForTimeout(100);
			await page.evaluate(
				(type) =>
					document.dispatchEvent(
						new PointerEvent(type, {
							pointerId: Number(document.documentElement.dataset.pointerId),
						})
					),
				type
			);

			// Wait past the delay and verify no drag operation was started
			await page.waitForTimeout(600);
			await expect(pressedItem).toHaveAttribute('data-drag-state', 'idle');
			await expect(root.locator('.ssl-placeholder')).toHaveCount(0);

			// Release the mouse
			await page.mouse.up();
		}

		// Verify the order is unchanged
		const finalItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(finalItems).toEqual(initialItems);
	});

	test('should not leave a drag pending when a second touch presses another item before the delay completes', async ({
		page,
		hasTouch,
	}) => {
		// Multi-touch can only be emulated through the Chrome DevTools Protocol on a touch device
		test.skip(!hasTouch, 'Requires touch emulation');

		// Find the root element
		const root = page.locator('.ssl-root');

		// Get the initial order of the items to verify the starting state
		const initialItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(initialItems).toEqual(getDefaultItems(5).map((item) => item.text));

		// Find the item each finger will press (List Item 1 and List Item 3)
		const firstItem = root.locator('[data-item-id="list-item-1"]:not(.ssl-placeholder)');
		const secondItem = root.locator('[data-item-id="list-item-3"]:not(.ssl-placeholder)');
		const firstBox = await firstItem.boundingBox();
		const secondBox = await secondItem.boundingBox();
		if (!firstBox || !secondBox)
			throw new Error('Could not get List Item 1 or List Item 3 bounding box');

		// Open a CDP session to dispatch touch events with more than one touch point
		const cdp = await page.context().newCDPSession(page);
		const finger1 = {
			x: firstBox.x + firstBox.width / 2,
			y: firstBox.y + firstBox.height / 2,
			id: 1,
		};
		const finger2 = {
			x: secondBox.x + secondBox.width / 2,
			y: secondBox.y + secondBox.height / 2,
			id: 2,
		};

		// Press the first finger down on List Item 1
		await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [finger1] });

		// Press a second finger down on List Item 3 while the first delay is still pending
		await page.waitForTimeout(60);
		await cdp.send('Input.dispatchTouchEvent', {
			type: 'touchStart',
			touchPoints: [finger1, finger2],
		});

		// Lift both fingers before either delay completes
		await page.waitForTimeout(60);
		await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [finger2] });
		await page.waitForTimeout(60);
		await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

		// Wait past both delays and verify neither press started or left a drag pending
		await page.waitForTimeout(600);
		await expect(root.locator('.ssl-item:not([data-drag-state="idle"])')).toHaveCount(0);
		await expect(root.locator('.ssl-placeholder')).toHaveCount(0);
		expect(await root.locator('.ssl-item .ssl-item-content__text').allTextContents()).toEqual(
			initialItems
		);

		// Verify a normal touch drag still works afterwards
		const waitForFrames = () =>
			page.evaluate(
				() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
			);
		const dragFinger = { ...finger1, id: 1 };
		await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [dragFinger] });
		await expect(firstItem).toHaveAttribute('data-drag-state', 'ptr-drag-start', {
			timeout: 2000,
		});

		// Drag List Item 1 down to the List Item 3 position and release
		const startY = dragFinger.y;
		const targetY = secondBox.y + secondBox.height / 2;
		for (let step = 1; step <= 10; step++) {
			dragFinger.y = startY + ((targetY - startY) * step) / 10;
			await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [dragFinger] });
			await waitForFrames();
		}
		await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

		// Wait for the drag operation to complete and verify the items were sorted
		await expect(firstItem).toHaveAttribute('data-drag-state', 'idle');
		await expect(root.locator('.ssl-item .ssl-item-content__text')).toHaveText(
			sortItems(initialItems, 0, 2)
		);
	});
});
