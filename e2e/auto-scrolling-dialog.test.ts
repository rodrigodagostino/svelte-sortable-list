import { test, expect } from '@playwright/test';

test.describe('Sortable List - Auto Scrolling Dialog', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the Auto Scrolling Dialog page
		await page.goto('/auto-scrolling-dialog');
	});

	test('should handle dialog scrolling during drag operations', async ({ page }) => {
		// Get the viewport size
		const viewport = page.viewportSize();
		if (!viewport) throw new Error('Could not get viewport size');

		// Get the dialog element
		const dialog = page.locator('dialog');

		// Open dialog
		const openButton = page.locator('button', { hasText: 'Open dialog' });
		await openButton.click();
		await expect(dialog).toHaveAttribute('open');

		// Find the root element
		const root = dialog.locator('.ssl-root');

		// Get the dialog inner container (scrollable area)
		const dialogInner = dialog.locator('.dialog__inner');

		// Check if dialog has scrollable content by getting initial scroll position
		const initialScroll = await dialogInner.evaluate((el) => el.scrollTop);

		// Find the dragged item (List Item 1)
		const draggedItem = root.locator('[data-item-id="list-item-1"]');
		const draggedBox = await draggedItem.boundingBox();
		if (!draggedBox) throw new Error('Could not get first item bounding box');

		// Hover over the first item
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			draggedBox.y + draggedBox.height / 2
		);

		// Press the mouse down to start dragging
		await page.mouse.down();

		// Wait for the drag operation to start by checking the drag state
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag-start');

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
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify scrolling occurred
		const finalScroll = await dialogInner.evaluate((el) => el.scrollTop);
		expect(finalScroll).toBeGreaterThan(initialScroll);
	});
});
