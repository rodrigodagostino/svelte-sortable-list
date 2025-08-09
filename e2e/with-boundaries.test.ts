import { test, expect } from '@playwright/test';
import { defaultRootProps } from '../src/routes/fixtures';

test.describe('Sortable List - With Boundaries', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the With Boundaries page
		await page.goto('/with-boundaries');

		// Wait for the root element to be loaded
		await page.locator('.ssl-root').waitFor();
	});

	test('should prevent dragging items outside boundaries', async ({ page }) => {
		// Find the dragged item (List Item 1) and its initial position
		const root = page.locator('.ssl-root');
		const draggedItem = root.locator('[data-item-id="list-item-1"]');

		// Find the ghost element
		const ghost = page.locator('.ssl-ghost');

		// Get the viewport size
		const viewport = page.viewportSize();

		if (!viewport) throw new Error('Could not get viewport size');

		// Get the bounding boxes for a precise drag operation
		const rootBox = await root.boundingBox();
		const draggedBox = await draggedItem.boundingBox();

		if (!rootBox || !draggedBox)
			throw new Error('Could not get Root element or List Item 1 bounding box');

		// Start drag from the center of the dragged item
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			draggedBox.y + draggedBox.height / 2
		);

		// Press the mouse down to start dragging
		await page.mouse.down();

		// Try to drag way outside the container (left and up)
		await page.mouse.move(
			40,
			40,
			{ steps: 10 } // Smooth movement
		);

		// Item should be constrained by left and top boundaries
		let ghostBox = await ghost.boundingBox();
		if (!ghostBox) throw new Error('Could not get ghost bounding box');
		expect(rootBox.x + defaultRootProps.gap / 2).toEqual(ghostBox.x);
		expect(rootBox.y + defaultRootProps.gap / 2).toEqual(ghostBox.y);

		// Try to drag way outside the container (right and up)
		await page.mouse.move(
			viewport.width - 40,
			40,
			{ steps: 10 } // Smooth movement
		);

		// Item should be constrained by right and top boundaries
		ghostBox = await ghost.boundingBox();
		if (!ghostBox) throw new Error('Could not get ghost bounding box');
		expect(rootBox.x + rootBox.width - defaultRootProps.gap / 2).toEqual(
			ghostBox.x + ghostBox.width
		);
		expect(rootBox.y + defaultRootProps.gap / 2).toEqual(ghostBox.y);

		// Try to drag way outside the container (right and down)
		await page.mouse.move(
			viewport.width - 40,
			viewport.height - 40,
			{ steps: 10 } // Smooth movement
		);

		// Item should be constrained by right and bottom boundaries
		ghostBox = await ghost.boundingBox();
		if (!ghostBox) throw new Error('Could not get ghost bounding box');
		expect(rootBox.x + rootBox.width - defaultRootProps.gap / 2).toEqual(
			ghostBox.x + ghostBox.width
		);
		expect(rootBox.y + rootBox.height - defaultRootProps.gap / 2).toEqual(
			ghostBox.y + ghostBox.height
		);

		// Try to drag way outside the container (left and down)
		await page.mouse.move(
			40,
			viewport.height - 40,
			{ steps: 10 } // Smooth movement
		);

		// Item should be constrained by left and bottom boundaries
		ghostBox = await ghost.boundingBox();
		if (!ghostBox) throw new Error('Could not get ghost bounding box');
		expect(rootBox.x + defaultRootProps.gap / 2).toEqual(ghostBox.x);
		expect(rootBox.y + rootBox.height - defaultRootProps.gap / 2).toEqual(
			ghostBox.y + ghostBox.height
		);

		// Release the mouse to drop
		await page.mouse.up();
	});
});
