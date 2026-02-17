import { test, expect } from '@playwright/test';

test.describe('Sortable List - Auto Scrolling Dialog', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the Auto Scrolling Dialog page
		await page.goto('/auto-scrolling-dialog');
	});

	test('should handle dialog scrolling when dragging to the bottom and then to the top', async ({
		page,
	}) => {
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

		// === FIRST DRAG OPERATION - SCROLL DOWN ===
		// Get the initial scroll position
		const initialScroll = await dialogInner.evaluate((el) => el.scrollTop);

		// Find the dragged item (List Item 1)
		const draggedItem1 = root.locator('[data-item-id="list-item-1"]');
		let draggedBox = await draggedItem1.boundingBox();
		if (!draggedBox) throw new Error('Could not get List Item 1 bounding box');

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
		const scrollAfterScrollingDown = await dialogInner.evaluate((el) => el.scrollTop);
		expect(scrollAfterScrollingDown).toBeGreaterThan(initialScroll);

		// === SECOND DRAG OPERATION - SCROLL UP ===
		// Scroll to the bottom first
		await dialogInner.evaluate((el) => el.scrollTo(0, el.scrollHeight));

		// Find the dragged item (List Item 100)
		const draggedItem2 = root.locator('[data-item-id="list-item-100"]');
		draggedBox = await draggedItem2.boundingBox();
		if (!draggedBox) throw new Error('Could not get List Item 100 bounding box');

		// Get the scroll position before scrolling up
		const scrollBeforeScrollingUp = await dialogInner.evaluate((el) => el.scrollTop);

		// Hover over the last item
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			draggedBox.y + draggedBox.height / 2
		);

		// Press the mouse down to start dragging
		await page.mouse.down();

		// Wait for the drag operation to start by checking the drag state
		await expect(draggedItem2).toHaveAttribute('data-drag-state', 'ptr-drag-start');

		// Move to the top edge of the viewport to trigger auto scroll
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
		const finalScroll = await dialogInner.evaluate((el) => el.scrollTop);
		expect(finalScroll).toBeLessThan(scrollBeforeScrollingUp);
	});
});
