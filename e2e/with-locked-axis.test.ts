import { test, expect } from '@playwright/test';

test.describe('Sortable List - With Locked Axis', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the With Locked Axis page
		await page.goto('/with-locked-axis');

		// Wait for the root element to be loaded
		await page.locator('.ssl-root').waitFor();
	});

	test('should only allow vertical movement when axis is locked', async ({ page }) => {
		// Find the dragged item (List Item 1) and its initial position
		const root = page.locator('.ssl-root');
		const draggedItem = root.locator('[data-item-id="list-item-1"]');

		// Get bounding box for precise drag operation
		const initialBox = await draggedItem.boundingBox();

		if (!initialBox) throw new Error('Could not get item bounding box');

		const initialX = initialBox.x;

		// Get bounding box for precise drag operation
		const draggedBox = await draggedItem.boundingBox();

		if (!draggedBox) throw new Error('Could not get List Item 1 or List Item 3 bounding box');

		// Start drag from the center of the dragged item
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			draggedBox.y + draggedBox.height / 2
		);

		// Press the mouse down to start dragging
		await page.mouse.down();

		// Move down a bit
		await page.mouse.move(
			draggedBox.x,
			initialBox.y + 100,
			{ steps: 10 } // Smooth movement
		);

		// Move back up
		await page.mouse.move(
			draggedBox.x + draggedBox.width,
			initialBox.y + 50,
			{ steps: 10 } // Smooth movement
		);

		// Move down again
		await page.mouse.move(
			draggedBox.x,
			initialBox.y + 150,
			{ steps: 10 } // Smooth movement
		);

		// Get final position
		const finalBox = await draggedItem.boundingBox();

		// X position should remain consistent throughout drag
		if (finalBox) {
			const xDrift = Math.abs(finalBox.x - initialX);
			expect(xDrift).toBeLessThan(2); // Allow for subpixel rendering
		}

		// Release the mouse to drop
		await page.mouse.up();
	});
});
