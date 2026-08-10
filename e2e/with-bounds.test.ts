import { test, expect } from '@playwright/test';
import { defaultRootProps } from '../src/routes/fixtures';

test.describe('Sortable List - With Bounds', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the With Bounds page
		await page.goto('/with-bounds');

		// Wait for the root element to be loaded
		await page.locator('.ssl-root').waitFor();
	});

	test('should prevent dragging items outside bounds', async ({ page }) => {
		// Find the dragged item (List Item 1) and its initial position
		const root = page.locator('.ssl-root');
		const draggedItem = root.locator('[data-item-id="list-item-1"]:not(.ssl-placeholder)');

		// Get the viewport size
		const viewport = page.viewportSize();
		if (!viewport) throw new Error('Could not get viewport size');

		// Get the bounding boxes for a precise drag operation
		const rootBox = await root.boundingBox();
		let draggedBox = await draggedItem.boundingBox();
		if (!rootBox || !draggedBox)
			throw new Error('Could not get Root element or List Item 1 bounding box');

		// Start drag from the center of the dragged item
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			draggedBox.y + draggedBox.height / 2
		);

		// Press the mouse down to start dragging
		await page.mouse.down();

		// Wait for the drag operation to start by checking the drag state
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag-start');

		// Try to drag way outside the list (left and up)
		await page.mouse.move(
			40,
			40,
			{ steps: 40 } // Smooth movement
		);

		// The dragged item should be constrained by the left and top bounds
		draggedBox = await draggedItem.boundingBox();
		if (!draggedBox) throw new Error('Could not get ghost bounding box');
		expect(rootBox.x + defaultRootProps.gap / 2).toEqual(draggedBox.x);
		expect(rootBox.y + defaultRootProps.gap / 2).toEqual(draggedBox.y);

		// Try to drag way outside the list (right and up)
		await page.mouse.move(
			viewport.width - 40,
			40,
			{ steps: 40 } // Smooth movement
		);

		// The dragged item should be constrained by the right and top bounds
		draggedBox = await draggedItem.boundingBox();
		if (!draggedBox) throw new Error('Could not get ghost bounding box');
		expect(rootBox.x + rootBox.width - defaultRootProps.gap / 2).toEqual(
			draggedBox.x + draggedBox.width
		);
		expect(rootBox.y + defaultRootProps.gap / 2).toEqual(draggedBox.y);

		// Try to drag way outside the list (right and down)
		await page.mouse.move(
			viewport.width - 40,
			viewport.height - 40,
			{ steps: 40 } // Smooth movement
		);

		// The dragged item should be constrained by the right and bottom bounds
		draggedBox = await draggedItem.boundingBox();
		if (!draggedBox) throw new Error('Could not get ghost bounding box');
		expect(rootBox.x + rootBox.width - defaultRootProps.gap / 2).toEqual(
			draggedBox.x + draggedBox.width
		);
		expect(rootBox.y + rootBox.height - defaultRootProps.gap / 2).toEqual(
			draggedBox.y + draggedBox.height
		);

		// Try to drag way outside the list (left and down)
		await page.mouse.move(
			40,
			viewport.height - 40,
			{ steps: 40 } // Smooth movement
		);

		// The dragged item should be constrained by the left and bottom bounds
		draggedBox = await draggedItem.boundingBox();
		if (!draggedBox) throw new Error('Could not get ghost bounding box');
		expect(rootBox.x + defaultRootProps.gap / 2).toEqual(draggedBox.x);
		expect(rootBox.y + rootBox.height - defaultRootProps.gap / 2).toEqual(
			draggedBox.y + draggedBox.height
		);

		// Release the mouse to drop
		await page.mouse.up();
	});
});
