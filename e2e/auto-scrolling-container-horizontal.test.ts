import { test, expect } from '@playwright/test';

test.describe('Sortable List - Auto Scrolling Container Horizontal', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the Auto Scrolling Container Horizontal page
		await page.goto('/auto-scrolling-container-horizontal');

		// Wait for the root element to be loaded
		await page.locator('.ssl-root').waitFor();
	});

	test('should auto scroll when dragging to the right and then to the left', async ({ page }) => {
		// Find the wrapper element
		const wrapper = page.locator('.wrapper');
		const wrapperBox = await wrapper.boundingBox();
		if (!wrapperBox) throw new Error('Could not get wrapper size');

		const root = page.locator('.ssl-root');

		// === FIRST DRAG OPERATION - SCROLL RIGHT ===
		// Find the dragged item (List Item 1)
		const draggedItem1 = root.locator('[data-item-id="list-item-1"]');

		// Get the bounding box for a precise drag operation
		let draggedBox = await draggedItem1.boundingBox();
		if (!draggedBox) throw new Error('Could not get List Item 1 bounding box');

		// Get the initial scroll position
		const initialScroll = await wrapper.evaluate((el) => el.scrollLeft);

		// Hover over the first item
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			draggedBox.y + draggedBox.height / 2
		);

		// Press the mouse down to start dragging
		await page.mouse.down();

		// Wait for the drag operation to start by checking the drag state
		await expect(draggedItem1).toHaveAttribute('data-drag-state', 'ptr-drag-start');

		// Move to the right edge of the wrapper to trigger auto scroll
		await page.mouse.move(
			wrapperBox.x + wrapperBox.width,
			draggedBox.y + draggedBox.height / 2,
			{ steps: 40 } // Smooth movement
		);

		// Wait for the auto scroll to happen
		await page.waitForTimeout(2000);

		// Move back to the middle of the wrapper
		await page.mouse.move(
			wrapperBox.x + wrapperBox.width / 2,
			draggedBox.y + draggedBox.height / 2,
			{ steps: 40 } // Smooth movement
		);

		// Release the mouse to drop
		await page.mouse.up();

		// Wait for the drag operation to complete by checking the drag state returns to idle
		await expect(draggedItem1).toHaveAttribute('data-drag-state', 'idle');

		// Verify scrolling right occurred
		const scrollAfterScrollingRight = await wrapper.evaluate((el) => el.scrollLeft);
		expect(scrollAfterScrollingRight).toBeGreaterThan(initialScroll);

		// === SECOND DRAG OPERATION - SCROLL LEFT ===
		// Scroll to the right first
		await wrapper.evaluate((el) => el.scrollTo(el.scrollWidth, 0));

		// Find the dragged item (List Item 100)
		const draggedItem2 = root.locator('[data-item-id="list-item-100"]');

		// Get the bounding box for a precise drag operation
		draggedBox = await draggedItem2.boundingBox();
		if (!draggedBox) throw new Error('Could not get List Item 100 bounding box');

		// Get the scroll position before scrolling left
		const scrollBeforeScrollingLeft = await wrapper.evaluate((el) => el.scrollLeft);

		// Hover over the last item
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			draggedBox.y + draggedBox.height / 2
		);

		// Press the mouse down to start dragging
		await page.mouse.down();

		// Wait for the drag operation to start by checking the drag state
		await expect(draggedItem2).toHaveAttribute('data-drag-state', 'ptr-drag-start');

		// Move to the left edge of the wrapper to trigger auto scroll
		await page.mouse.move(
			wrapperBox.x,
			draggedBox.y + draggedBox.height / 2,
			{ steps: 40 } // Smooth movement
		);

		// Wait for the auto scroll to happen
		await page.waitForTimeout(2000);

		// Move back to the middle of the wrapper
		await page.mouse.move(
			wrapperBox.x + wrapperBox.width / 2,
			draggedBox.y + draggedBox.height / 2,
			{ steps: 40 } // Smooth movement
		);

		// Release the mouse to drop
		await page.mouse.up();

		// Wait for the drag operation to complete by checking the drag state returns to idle
		await expect(draggedItem2).toHaveAttribute('data-drag-state', 'idle');

		// Verify scrolling left occurred (should be less than the scroll position before scrolling left)
		const finalScroll = await wrapper.evaluate((el) => el.scrollLeft);
		expect(finalScroll).toBeLessThan(scrollBeforeScrollingLeft);
	});
});
