import { test, expect } from '@playwright/test';

test.describe('Sortable List - Locked Items', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the Locked Items page
		await page.goto('/locked-items');

		// Wait for the root element to be loaded
		await page.locator('.ssl-root').waitFor();
	});

	test('should not be able to drag locked items', async ({ page }) => {
		// Get all items and identify the locked ones
		const lockedItems = await page.locator('.ssl-item[data-is-locked="true"]').all();

		for (const lockedItem of lockedItems) {
			// Get the initial position
			const initialBox = await lockedItem.boundingBox();

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
				{ steps: 10 } // Smooth movement
			);

			// Get the final position
			const finalBox = await lockedItem.boundingBox();

			if (!finalBox) throw new Error('Could not get item bounding box');

			// The locked item should not have moved
			expect(finalBox.y).toBe(initialBox.y);

			// Release the mouse to drop
			await page.mouse.up();
		}
	});

	test('should not be able to focus or interact with locked items via keyboard', async ({
		page,
	}) => {
		// Get all items and identify the locked ones
		const lockedItems = await page.locator('.ssl-item[data-is-locked="true"]').all();

		for (const lockedItem of lockedItems) {
			// Try to focus the locked item
			await lockedItem.focus();

			// Check if it’s really focused
			const isFocused = await lockedItem.evaluate((el) => el === document.activeElement);
			expect(isFocused).toBe(true);

			// Try to interact with keyboard
			await page.keyboard.press('Space');

			// Check if the item is still in its original position
			const initialBox = await lockedItem.boundingBox();

			if (!initialBox) throw new Error('Could not get item bounding box');

			// Try to move with keyboard
			await page.keyboard.press('ArrowDown');

			// Get the new position
			const finalBox = await lockedItem.boundingBox();

			if (!finalBox) throw new Error('Could not get item bounding box');

			// The locked item should not have moved
			expect(finalBox.y).toBe(initialBox.y);
		}
	});
});
