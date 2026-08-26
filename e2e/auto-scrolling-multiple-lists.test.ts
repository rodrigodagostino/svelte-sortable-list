import { test, expect } from '@playwright/test';

test.describe('Sortable List - Auto Scrolling Multiple Lists', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the Auto Scrolling Multiple Lists page
		await page.goto('/auto-scrolling-multiple-lists');

		// Wait for the root elements to be loaded
		await page.locator('.ssl-root').first().waitFor();
	});

	test('should move an item from one list to another list using mouse', async ({ page }) => {
		// Find the «To Do» and «Doing» list roots
		const toDoList = page.locator('[data-list-id="to-do"]');
		const doingList = page.locator('[data-list-id="doing"]');

		// Find the dragged item (To Do Item 1) and the target item (Doing Item 1), both visible
		// without scrolling
		const draggedItem = page.locator('[data-item-id="to-do-item-1"]:not(.ssl-placeholder)');
		const targetItem = doingList.locator('[data-item-id="doing-item-1"]:not(.ssl-placeholder)');

		// Scroll both items into view before reading their bounding boxes — needed on narrower
		// viewports (e.g. Mobile Chrome), where the three lists overflow horizontally.
		await draggedItem.scrollIntoViewIfNeeded();
		await targetItem.scrollIntoViewIfNeeded();

		const draggedBox = await draggedItem.boundingBox();
		const targetBox = await targetItem.boundingBox();
		if (!draggedBox || !targetBox)
			throw new Error('Could not get To Do Item 1 or Doing Item 1 bounding box');

		// Start the drag from the center of the dragged item
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			draggedBox.y + draggedBox.height / 2
		);
		await page.mouse.down();
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag-start');

		// Move over the target position. A single glide can outrun the per-frame pointer-move
		// throttle in `handlePointerMove()`, so flush it with a rAF wait, then re-issue one
		// precise move at the exact target coordinates and wait one more frame for it to register.
		await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, {
			steps: 40, // Smooth movement
		});
		await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
		await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2);
		await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));

		// Verify the peer list shows a placeholder for the incoming item
		await expect(doingList.locator('.ssl-placeholder')).toBeVisible();

		// Release the mouse to drop
		await page.mouse.up();
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify To Do Item 1 was removed from the «To Do» list and inserted into «Doing»
		await expect(toDoList.locator('[data-item-id="to-do-item-1"]')).toHaveCount(0);
		await expect(doingList.locator('[data-item-id="to-do-item-1"]')).toBeVisible();
	});

	test('should auto scroll the window when dragging to the bottom and then to the top', async ({
		page,
	}) => {
		// Get the viewport size
		const viewport = page.viewportSize();
		if (!viewport) throw new Error('Could not get viewport size');

		const toDoList = page.locator('[data-list-id="to-do"]');

		// === FIRST DRAG OPERATION - SCROLL DOWN ===
		// Find the dragged item (To Do Item 1)
		const draggedItem1 = toDoList.locator('[data-item-id="to-do-item-1"]:not(.ssl-placeholder)');
		const draggedBox1 = await draggedItem1.boundingBox();
		if (!draggedBox1) throw new Error('Could not get To Do Item 1 bounding box');

		// Get the initial scroll position
		const initialScroll = await page.evaluate(() => window.scrollY);

		// Hover over the first item
		await page.mouse.move(
			draggedBox1.x + draggedBox1.width / 2,
			draggedBox1.y + draggedBox1.height / 2
		);
		await page.mouse.down();
		await expect(draggedItem1).toHaveAttribute('data-drag-state', 'ptr-drag-start');

		// Move to the bottom edge of the viewport to trigger auto scroll
		await page.mouse.move(
			draggedBox1.x + draggedBox1.width / 2,
			viewport.height - 80,
			{ steps: 40 } // Smooth movement
		);

		// Wait for the auto scroll to happen
		await page.waitForTimeout(1000);

		// Move back to the middle of the viewport and drop
		await page.mouse.move(
			draggedBox1.x + draggedBox1.width / 2,
			viewport.height / 2,
			{ steps: 40 } // Smooth movement
		);
		await page.mouse.up();
		await expect(draggedItem1).toHaveAttribute('data-drag-state', 'idle');

		// Verify scrolling down occurred
		const scrollAfterScrollingDown = await page.evaluate(() => window.scrollY);
		expect(scrollAfterScrollingDown).toBeGreaterThan(initialScroll);

		// === SECOND DRAG OPERATION - SCROLL UP ===
		// Scroll to the bottom first
		await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

		// Find the dragged item (To Do Item 100)
		const draggedItem2 = toDoList.locator('[data-item-id="to-do-item-100"]:not(.ssl-placeholder)');
		const draggedBox2 = await draggedItem2.boundingBox();
		if (!draggedBox2) throw new Error('Could not get To Do Item 100 bounding box');

		// Get the scroll position before scrolling up
		const scrollBeforeScrollingUp = await page.evaluate(() => window.scrollY);

		// Hover over the last item
		await page.mouse.move(
			draggedBox2.x + draggedBox2.width / 2,
			draggedBox2.y + draggedBox2.height / 2
		);
		await page.mouse.down();
		await expect(draggedItem2).toHaveAttribute('data-drag-state', 'ptr-drag-start');

		// Move to the top to trigger auto scroll
		await page.mouse.move(
			draggedBox2.x + draggedBox2.width / 2,
			80,
			{ steps: 40 } // Smooth movement
		);

		// Wait for the auto scroll to happen
		await page.waitForTimeout(1000);

		// Move back to the middle of the viewport and drop
		await page.mouse.move(
			draggedBox2.x + draggedBox2.width / 2,
			viewport.height / 2,
			{ steps: 40 } // Smooth movement
		);
		await page.mouse.up();
		await expect(draggedItem2).toHaveAttribute('data-drag-state', 'idle');

		// Verify scrolling up occurred (should be less than the scroll position before scrolling up)
		const finalScroll = await page.evaluate(() => window.scrollY);
		expect(finalScroll).toBeLessThan(scrollBeforeScrollingUp);
	});

	test("should scroll a peer list's target item into view while dragging using keyboard", async ({
		page,
	}) => {
		// Find the «To Do» and «Doing» list roots
		const toDoList = page.locator('[data-list-id="to-do"]');
		const doingList = page.locator('[data-list-id="doing"]');

		// Focus the «To Do» root and jump to its last item (To Do Item 100), scrolling the
		// window down to reveal it
		await toDoList.focus();
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('End');
		const draggedItem = page.locator('[data-item-id="to-do-item-100"]:not(.ssl-placeholder)');
		await expect(draggedItem).toBeFocused();

		// Wait for the smooth scroll-into-view to settle
		await page.waitForTimeout(500);
		const scrollAfterFocusingLastItem = await page.evaluate(() => window.scrollY);
		expect(scrollAfterFocusingLastItem).toBeGreaterThan(0);

		// Start dragging with the Space key, then move right to target the «Doing» peer list
		await page.keyboard.press('Space');
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'kbd-drag-start');
		await page.keyboard.press('ArrowRight');
		await expect(doingList).toHaveAttribute('data-is-target', 'true');

		// Verify the dragged item stays visible while floating over the peer list
		await expect(draggedItem).toBeVisible();

		// Jump to the start of the «Doing» peer list — Doing Item 1 sits at the top of the page,
		// far from the current scroll position
		await page.keyboard.press('Home');
		await page.waitForTimeout(500);

		// Verify the window scrolled back up to reveal Doing Item 1, rather than staying put or
		// scrolling relative to a stale target in the source list
		const scrollAfterHome = await page.evaluate(() => window.scrollY);
		expect(scrollAfterHome).toBeLessThan(scrollAfterFocusingLastItem);

		// Verify the dragged item remains visible throughout
		await expect(draggedItem).toBeVisible();

		// Drop the item with the Space key
		await page.keyboard.press('Space');
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify To Do Item 100 was removed from «To Do» and inserted at the start of «Doing»
		await expect(toDoList.locator('[data-item-id="to-do-item-100"]')).toHaveCount(0);
		const doingFirstItemText = await doingList
			.locator('.ssl-item .ssl-item-content__text')
			.first()
			.textContent();
		expect(doingFirstItemText).toBe('To Do Item 100');
	});
});
