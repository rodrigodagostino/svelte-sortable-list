import { test, expect } from '@playwright/test';

test.describe('Sortable List - Auto Scrolling', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the Auto Scrolling page
		await page.goto('/auto-scrolling');

		// Wait for the root element to be loaded
		await page.locator('.ssl-root').waitFor();
	});

	test('should auto scroll when dragging to the bottom', async ({ page }) => {
		// Find the dragged item (List Item 1)
		const root = page.locator('.ssl-root');
		const draggedItem = root.locator('[data-item-id="list-item-1"]');
		const draggedBox = await draggedItem.boundingBox();

		if (!draggedBox) throw new Error('Could not get first item bounding box');

		// Get the initial scroll position
		const initialScroll = await page.evaluate(() => window.scrollY);

		// Hover over the first item
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			draggedBox.y + draggedBox.height / 2
		);

		// Press the mouse down to start dragging
		await page.mouse.down();

		// Verify the drag state is active
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag');

		// Move to the bottom edge of the viewport to trigger auto scroll
		const viewport = page.viewportSize();
		if (!viewport) throw new Error('Could not get viewport size');
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			viewport.height - 80,
			{ steps: 10 } // Smooth movement
		);

		// Wait for the auto scroll to happen
		await page.waitForTimeout(2000);

		// Move back to the middle of the viewport
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			viewport.height / 2,
			{ steps: 10 } // Smooth movement
		);

		// Release the mouse to drop
		await page.mouse.up();

		// Wait for the drag operation to complete by checking the drag state returns to idle
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify scrolling occurred
		const newScroll = await page.evaluate(() => window.scrollY);
		expect(newScroll).toBeGreaterThan(initialScroll);
	});

	test('should auto scroll when dragging to the top', async ({ page }) => {
		// Scroll to the bottom first
		await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

		// Find the dragged item (List Item 100)
		const root = page.locator('.ssl-root');
		const draggedItem = root.locator('[data-item-id="list-item-100"]');
		const draggedBox = await draggedItem.boundingBox();

		if (!draggedBox) throw new Error('Could not get last item bounding box');

		// Get the initial scroll position
		const initialScroll = await page.evaluate(() => window.scrollY);

		// Hover over the last item
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			draggedBox.y + draggedBox.height / 2
		);

		// Press the mouse down to start dragging
		await page.mouse.down();

		// Verify the drag state is active
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag');

		// Move to the top to trigger auto scroll
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			80,
			{ steps: 10 } // Smooth movement
		);

		// Wait for the auto scroll to happen
		await page.waitForTimeout(2000);

		// Move back to the middle of the viewport
		const viewport = page.viewportSize();
		if (!viewport) throw new Error('Could not get viewport size');
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			viewport.height / 2,
			{ steps: 10 } // Smooth movement
		);

		// Release the mouse to drop
		await page.mouse.up();

		// Wait for the drag operation to complete by checking the drag state returns to idle
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify scrolling occurred (should be less than the initial scroll since we're scrolling up)
		const newScroll = await page.evaluate(() => window.scrollY);
		expect(newScroll).toBeLessThan(initialScroll);
	});
});
