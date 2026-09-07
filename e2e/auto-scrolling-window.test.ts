import { test, expect } from '@playwright/test';

test.describe('Sortable List - Auto Scrolling Window', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the Auto Scrolling Window page
		await page.goto('/auto-scrolling-window');

		// Wait for the root element to be loaded
		await page.locator('.ssl-root').waitFor();
	});

	test('should auto scroll when dragging to the bottom and then to the top', async ({ page }) => {
		// Get the viewport size
		const viewport = page.viewportSize();
		if (!viewport) throw new Error('Could not get viewport size');

		const root = page.locator('.ssl-root');

		// === FIRST DRAG OPERATION - SCROLL DOWN ===
		// Find the dragged item (List Item 1)
		const draggedItem1 = root.locator('[data-item-id="list-item-1"]:not(.ssl-placeholder)');
		let draggedBox = await draggedItem1.boundingBox();
		if (!draggedBox) throw new Error('Could not get List Item 1 bounding box');

		// Get the initial scroll position
		const initialScroll = await page.evaluate(() => window.scrollY);

		// Hover over the first item
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			draggedBox.y + draggedBox.height / 2
		);

		// Press the mouse down to start dragging
		await page.mouse.down();

		// Wait for the drag operation to start by checking the drag state
		await expect(draggedItem1).toHaveAttribute('data-drag-state', 'ptr-drag-start');

		// Move to the bottom edge of the viewport to trigger auto scroll
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			viewport.height - 80,
			{ steps: 40 } // Smooth movement
		);

		// Wait for the auto scroll to happen
		await page.waitForTimeout(1000);

		// Move back to the middle of the viewport
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			viewport.height / 2,
			{ steps: 40 } // Smooth movement
		);

		// Release the mouse to drop
		await page.mouse.up();

		// Wait for the drag operation to complete by checking the drag state returns to idle
		await expect(draggedItem1).toHaveAttribute('data-drag-state', 'idle');

		// Verify scrolling down occurred
		const scrollAfterScrollingDown = await page.evaluate(() => window.scrollY);
		expect(scrollAfterScrollingDown).toBeGreaterThan(initialScroll);

		// === SECOND DRAG OPERATION - SCROLL UP ===
		// Scroll to the bottom first
		await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

		// Find the dragged item (List Item 100)
		const draggedItem2 = root.locator('[data-item-id="list-item-100"]:not(.ssl-placeholder)');
		draggedBox = await draggedItem2.boundingBox();
		if (!draggedBox) throw new Error('Could not get List Item 100 bounding box');

		// Get the scroll position before scrolling up
		const scrollBeforeScrollingUp = await page.evaluate(() => window.scrollY);

		// Hover over the last item
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			draggedBox.y + draggedBox.height / 2
		);

		// Press the mouse down to start dragging
		await page.mouse.down();

		// Wait for the drag operation to start by checking the drag state
		await expect(draggedItem2).toHaveAttribute('data-drag-state', 'ptr-drag-start');

		// Move to the top to trigger auto scroll
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			80,
			{ steps: 40 } // Smooth movement
		);

		// Wait for the auto scroll to happen
		await page.waitForTimeout(1000);

		// Move back to the middle of the viewport
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			viewport.height / 2,
			{ steps: 40 } // Smooth movement
		);

		// Release the mouse to drop
		await page.mouse.up();

		// Wait for the drag operation to complete by checking the drag state returns to idle
		await expect(draggedItem2).toHaveAttribute('data-drag-state', 'idle');

		// Verify scrolling up occurred (should be less than the scroll position before scrolling up)
		const finalScroll = await page.evaluate(() => window.scrollY);
		expect(finalScroll).toBeLessThan(scrollBeforeScrollingUp);
	});

	test('should keep the drop target when the window is scrolled during the drop transition', async ({
		page,
	}) => {
		const root = page.locator('.ssl-root');

		// Find the dragged item (List Item 1) and the target item (List Item 3)
		const draggedItem = root.locator('[data-item-id="list-item-1"]:not(.ssl-placeholder)');
		const targetItem = root.locator('[data-item-id="list-item-3"]:not(.ssl-placeholder)');

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
		await page.mouse.down();
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag-start');

		// Move to the target position (center of List Item 3)
		await page.mouse.move(
			targetBox.x + targetBox.width / 2,
			targetBox.y + targetBox.height / 2,
			{ steps: 40 } // Smooth movement
		);
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag');

		// Release the mouse to drop
		await page.mouse.up();

		// Scroll the window while the drop transition is still running
		await page.mouse.wheel(0, 400);

		// Wait for the drag operation to complete by checking the drag state returns to idle
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify the window actually scrolled
		expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

		// Verify the item landed at the position it was dropped on, not where the scroll moved it
		const finalItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(finalItems.slice(0, 4)).toEqual([
			'List Item 2',
			'List Item 3',
			'List Item 1',
			'List Item 4',
		]);
	});
});
