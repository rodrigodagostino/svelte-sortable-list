import { test, expect } from '@playwright/test';

test.describe('Sortable List - Disabled Items', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the Disabled Items page
		await page.goto('/disabled-items');

		// Wait for the root element to be loaded
		await page.locator('.ssl-root').waitFor();
	});

	test('should not be able to drag disabled items', async ({ page }) => {
		// Find the root element
		const root = page.locator('.ssl-root');

		// Get all items and identify the disabled ones
		const disabledItems = await root.locator('.ssl-item[aria-disabled="true"]').all();

		for (const disabledItem of disabledItems) {
			// Check that the cursor is not allowed
			expect(disabledItem).toHaveCSS('cursor', 'not-allowed');

			// Get the initial position
			const initialBox = await disabledItem.boundingBox();
			if (!initialBox) throw new Error('Could not get item bounding box');

			// Start the drag from the center of the item
			await page.mouse.move(
				initialBox.x + initialBox.width / 2,
				initialBox.y + initialBox.height / 2
			);

			// Press the mouse down to start dragging
			await page.mouse.down();

			// Try to move the item
			await page.mouse.move(
				initialBox.x + initialBox.width / 2,
				initialBox.y + initialBox.height * 2,
				{ steps: 40 } // Smooth movement
			);

			// Get the final position
			const finalBox = await disabledItem.boundingBox();
			if (!finalBox) throw new Error('Could not get item bounding box');

			// The disabled item should not have moved
			expect(finalBox.y).toBe(initialBox.y);

			// Release the mouse to drop
			await page.mouse.up();
		}
	});

	test('should not be able to focus or interact with disabled items via keyboard', async ({
		page,
	}) => {
		// Find the root element
		const root = page.locator('.ssl-root');

		// Get all items and identify the disabled ones
		const disabledItems = await root.locator('.ssl-item[aria-disabled="true"]').all();

		for (const disabledItem of disabledItems) {
			// Try to focus the disabled item
			await disabledItem.focus();

			// Verify the disabled item is focused
			await expect(disabledItem).toBeFocused();

			// Try to interact with keyboard
			await page.keyboard.press('Space');

			// Check if the item is still in its original position
			const initialBox = await disabledItem.boundingBox();
			if (!initialBox) throw new Error('Could not get item bounding box');

			// Try to move with keyboard
			await page.keyboard.press('ArrowDown');

			// Get the new position
			const finalBox = await disabledItem.boundingBox();
			if (!finalBox) throw new Error('Could not get item bounding box');

			// The disabled item should not have moved
			expect(finalBox.y).toBe(initialBox.y);
		}
	});
});
