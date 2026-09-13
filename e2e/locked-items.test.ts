import { test, expect } from '@playwright/test';

test.describe('Sortable List - Locked Items', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the Locked Items page
		await page.goto('/locked-items');

		// Wait for the root element to be loaded
		await page.locator('.ssl-root').waitFor();
	});

	test('should not be able to drag locked items', async ({ page }) => {
		// Find the root element
		const root = page.locator('.ssl-root');

		// Get all items and identify the locked ones
		const lockedItems = await root.locator('.ssl-item[data-is-locked="true"]').all();

		for (const lockedItem of lockedItems) {
			// Get the initial position
			const initialBox = await lockedItem.boundingBox();
			if (!initialBox) throw new Error('Could not get item bounding box');

			// Start the drag from the center of the item
			await page.mouse.move(
				initialBox.x + initialBox.width / 2,
				initialBox.y + initialBox.height / 2
			);

			// Press the mouse down to start dragging
			await page.mouse.down();

			// Try to move the item
			await page.mouse.move(
				initialBox.x + initialBox.width / 2,
				initialBox.y + initialBox.height * 2,
				{ steps: 40 } // Smooth movement
			);

			// Get the final position
			const finalBox = await lockedItem.boundingBox();
			if (!finalBox) throw new Error('Could not get item bounding box');

			// The locked item should not have moved
			expect(finalBox.y).toBe(initialBox.y);

			// Release the mouse to drop
			await page.mouse.up();
		}
	});

	test('should not be able to focus or interact with locked items via keyboard', async ({
		page,
	}) => {
		// Find the root element
		const root = page.locator('.ssl-root');

		// Get all items and identify the locked ones
		const lockedItems = await root.locator('.ssl-item[data-is-locked="true"]').all();

		for (const lockedItem of lockedItems) {
			// Try to focus the locked item
			await lockedItem.focus();

			// Check if it’s really focused
			const isFocused = await lockedItem.evaluate((el) => el === document.activeElement);
			expect(isFocused).toBe(true);

			// Try to interact with keyboard
			await page.keyboard.press('Space');

			// Check if the item is still in its original position
			const initialBox = await lockedItem.boundingBox();
			if (!initialBox) throw new Error('Could not get item bounding box');

			// Try to move with keyboard
			await page.keyboard.press('ArrowDown');

			// Get the new position
			const finalBox = await lockedItem.boundingBox();
			if (!finalBox) throw new Error('Could not get item bounding box');

			// The locked item should not have moved
			expect(finalBox.y).toBe(initialBox.y);
		}
	});

	test('should let the page scroll when swiping over a locked item', async ({ page, hasTouch }) => {
		// Touch gestures can only be emulated through the Chrome DevTools Protocol on a touch device
		test.skip(!hasTouch, 'Requires touch emulation');

		// Find the root element
		const root = page.locator('.ssl-root');

		// Make the page tall enough to scroll without disturbing the layout around the list
		await page.evaluate(() =>
			document.body.insertAdjacentHTML(
				'beforeend',
				'<div style="position: absolute; top: 0; left: 0; width: 1px; height: 300vh; pointer-events: none"></div>'
			)
		);
		expect(await page.evaluate(() => window.scrollY)).toBe(0);

		// Verify the list leaves touch gestures alone while idle, and that only the items
		// that can be dragged take them over
		await expect(root).toHaveCSS('touch-action', 'auto');
		await expect(root.locator('[data-item-id="locked-item-1"]')).toHaveCSS('touch-action', 'auto');
		await expect(root.locator('[data-item-id="list-item-1"]')).toHaveCSS('touch-action', 'none');

		// Open a CDP session to dispatch real touch gestures
		const cdp = await page.context().newCDPSession(page);
		const waitForFrames = () =>
			page.evaluate(
				() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
			);

		// Get the initial order of the items to verify the starting state
		const initialItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();

		// Find the text of Locked Item 1, then swipe up over it
		const lockedText = root.locator('[data-item-id="locked-item-1"] .ssl-item-content__text');
		const lockedBox = await lockedText.boundingBox();
		if (!lockedBox) throw new Error('Could not get Locked Item 1 text bounding box');

		const swipeFinger = {
			x: lockedBox.x + lockedBox.width / 2,
			y: lockedBox.y + lockedBox.height / 2,
			id: 1,
		};
		await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [swipeFinger] });
		for (let i = 0; i < 10; i++) {
			swipeFinger.y -= 15;
			await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [swipeFinger] });
			await waitForFrames();
		}
		await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [swipeFinger] });

		// Verify the page scrolled, no drag was started and the items kept their order
		await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
		await expect(root.locator('.ssl-item[data-drag-state*="ptr"]')).toHaveCount(0);
		expect(await root.locator('.ssl-item .ssl-item-content__text').allTextContents()).toEqual(
			initialItems
		);

		// Return to the top of the page and find the text of List Item 1, which can be dragged
		await page.evaluate(() => window.scrollTo(0, 0));
		await waitForFrames();
		const draggedItem = root.locator('[data-item-id="list-item-1"]:not(.ssl-placeholder)');
		const draggedText = draggedItem.locator('.ssl-item-content__text');
		const draggedBox = await draggedText.boundingBox();
		if (!draggedBox) throw new Error('Could not get List Item 1 text bounding box');

		// Swipe up over it the same way
		const dragFinger = {
			x: draggedBox.x + draggedBox.width / 2,
			y: draggedBox.y + draggedBox.height / 2,
			id: 1,
		};
		await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [dragFinger] });
		for (let i = 0; i < 10; i++) {
			dragFinger.y -= 15;
			await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [dragFinger] });
			await waitForFrames();
		}

		// Verify the swipe started a drag instead of scrolling the page
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag');
		expect(await page.evaluate(() => window.scrollY)).toBe(0);

		// Release the finger and wait for the drag operation to complete
		await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [dragFinger] });
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');
	});
});
