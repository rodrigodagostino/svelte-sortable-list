import { test, expect } from '@playwright/test';

test.describe('Sortable List - Auto Scrolling Container Horizontal', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the Auto Scrolling Container Horizontal page
		await page.goto('/auto-scrolling-container-horizontal');

		// Wait for the root element to be loaded
		await page.locator('.ssl-root').waitFor();
	});

	test('should auto scroll when dragging to the right', async ({ page }) => {
		// Find the wrapper element
		const wrapper = page.locator('.wrapper');
		const wrapperBox = await wrapper.boundingBox();
		if (!wrapperBox) throw new Error('Could not get viewport size');

		// Find the dragged item (List Item 1)
		const root = page.locator('.ssl-root');
		const draggedItem = root.locator('[data-item-id="list-item-1"]');

		// Get the bounding box for a precise drag operation
		const draggedBox = await draggedItem.boundingBox();
		if (!draggedBox) throw new Error('Could not get first item bounding box');

		// Get the initial scroll position
		const initialScroll = await wrapper.evaluate((el) => el.scrollLeft);

		// Hover over the first item
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			draggedBox.y + draggedBox.height / 2
		);

		// Press the mouse down to start dragging
		await page.mouse.down();

		// Move to the right edge of the wrapper to trigger auto scroll
		await page.mouse.move(
			wrapperBox.x + wrapperBox.width,
			draggedBox.y + draggedBox.height / 2,
			{ steps: 20 } // Smooth movement
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
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify scrolling occurred
		const finalScroll = await wrapper.evaluate((el) => el.scrollLeft);
		expect(finalScroll).toBeGreaterThan(initialScroll);
	});

	test('should auto scroll when dragging to the left', async ({ page }) => {
		// Find the wrapper element
		const wrapper = page.locator('.wrapper');
		const wrapperBox = await wrapper.boundingBox();
		if (!wrapperBox) throw new Error('Could not get wrapper size');

		// Scroll to the right first
		await wrapper.evaluate((el) => el.scrollTo(el.scrollWidth, 0));

		// Find the dragged item (List Item 100)
		const root = page.locator('.ssl-root');
		const draggedItem = root.locator('[data-item-id="list-item-100"]');

		// Get the bounding box for a precise drag operation
		const draggedBox = await draggedItem.boundingBox();
		if (!draggedBox) throw new Error('Could not get last item bounding box');

		// Get the initial scroll position
		const initialScroll = await wrapper.evaluate((el) => el.scrollLeft);

		// Hover over the last item
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			draggedBox.y + draggedBox.height / 2
		);

		// Press the mouse down to start dragging
		await page.mouse.down();

		// Move to the left edge of the wrapper to trigger auto scroll
		await page.mouse.move(
			wrapperBox.x,
			draggedBox.y + draggedBox.height / 2,
			{ steps: 20 } // Smooth movement
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
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify scrolling occurred (should be less than the initial scroll since we're scrolling up)
		const finalScroll = await wrapper.evaluate((el) => el.scrollLeft);
		expect(finalScroll).toBeLessThan(initialScroll);
	});
});
