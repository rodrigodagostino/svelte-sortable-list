import { test, expect } from '@playwright/test';

test.describe('Sortable List - Auto Scrolling Container', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the Auto Scrolling Container page
		await page.goto('/auto-scrolling-container');

		// Wait for the root element to be loaded
		await page.locator('.ssl-root').waitFor();
	});

	test('should auto scroll when dragging to the bottom and then to the top', async ({ page }) => {
		// Find the wrapper element
		const wrapper = page.locator('.wrapper');
		const wrapperBox = await wrapper.boundingBox();
		if (!wrapperBox) throw new Error('Could not get wrapper size');

		const root = page.locator('.ssl-root');

		// === FIRST DRAG OPERATION - SCROLL DOWN ===
		// Find the dragged item (List Item 1)
		const draggedItem1 = root.locator('[data-item-id="list-item-1"]');

		// Get the bounding box for a precise drag operation
		let draggedBox = await draggedItem1.boundingBox();
		if (!draggedBox) throw new Error('Could not get List Item 1 bounding box');

		// Get the initial scroll position
		const initialScroll = await wrapper.evaluate((el) => el.scrollTop);

		// Hover over the first item
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			draggedBox.y + draggedBox.height / 2
		);

		// Press the mouse down to start dragging
		await page.mouse.down();

		// Wait for the drag operation to start by checking the drag state
		await expect(draggedItem1).toHaveAttribute('data-drag-state', 'ptr-drag-start');

		// Move to the bottom edge of the wrapper to trigger auto scroll
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			wrapperBox.y + wrapperBox.height,
			{ steps: 40 } // Smooth movement
		);

		// Wait for the auto scroll to happen
		await page.waitForTimeout(1000);

		// Move back to the middle of the wrapper
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			wrapperBox.y + wrapperBox.height / 2,
			{ steps: 40 } // Smooth movement
		);

		// Release the mouse to drop
		await page.mouse.up();

		// Wait for the drag operation to complete by checking the drag state returns to idle
		await expect(draggedItem1).toHaveAttribute('data-drag-state', 'idle');

		// Verify scrolling down occurred
		const scrollAfterScrollingDown = await wrapper.evaluate((el) => el.scrollTop);
		expect(scrollAfterScrollingDown).toBeGreaterThan(initialScroll);

		// === SECOND DRAG OPERATION - SCROLL UP ===
		// Scroll to the bottom first
		await wrapper.evaluate((el) => el.scrollTo(0, el.scrollHeight));

		// Find the dragged item (List Item 100)
		const draggedItem2 = root.locator('[data-item-id="list-item-100"]');

		// Get the bounding box for a precise drag operation
		draggedBox = await draggedItem2.boundingBox();
		if (!draggedBox) throw new Error('Could not get List Item 100 bounding box');

		// Get the scroll position before scrolling up
		const scrollBeforeScrollingUp = await wrapper.evaluate((el) => el.scrollTop);

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
			wrapperBox.y,
			{ steps: 40 } // Smooth movement
		);

		// Wait for the auto scroll to happen
		await page.waitForTimeout(1000);

		// Move back to the middle of the wrapper
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			wrapperBox.y + wrapperBox.height / 2,
			{ steps: 40 } // Smooth movement
		);

		// Release the mouse to drop
		await page.mouse.up();

		// Wait for the drag operation to complete by checking the drag state returns to idle
		await expect(draggedItem2).toHaveAttribute('data-drag-state', 'idle');

		// Verify scrolling up occurred (should be less than the scroll position before scrolling up)
		const finalScroll = await wrapper.evaluate((el) => el.scrollTop);
		expect(finalScroll).toBeLessThan(scrollBeforeScrollingUp);
	});
});
