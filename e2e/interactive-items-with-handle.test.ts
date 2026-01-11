import { test, expect } from '@playwright/test';

test.describe('Sortable List - Interactive Items with Handle', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the Interactive Items with Handle page
		await page.goto('/interactive-items-with-handle');

		// Wait for the root element to be loaded
		await page.locator('.ssl-root').waitFor();
	});

	test('should be able to interact with form elements', async ({ page }) => {
		// Test text input
		const textInput = page.getByRole('textbox', { name: 'List Item 1' });
		await expect(textInput).toHaveValue('Input field');

		// Test textarea
		const textarea = page.getByRole('textbox', { name: 'List Item 2' });
		await expect(textarea).toHaveValue('Textarea field');

		// Test select
		const select = page.getByRole('combobox');
		await expect(select).toHaveValue('option-2');

		// Test checkboxes
		const checkboxes = page.getByRole('checkbox');
		await expect(checkboxes.nth(0)).toBeChecked();
		await expect(checkboxes.nth(1)).toBeChecked();
		await expect(checkboxes.nth(2)).not.toBeChecked();

		// Test button
		const button = page.locator('button.button').first();
		await expect(button).toBeEnabled();
		await button.click();

		// Test link
		const link = page.locator('a.ssl-item-content__text').first();
		await expect(link).toHaveAttribute(
			'href',
			'https://github.com/rodrigodagostino/svelte-sortable-list'
		);
	});

	test('should be able to drag items with interactive elements from their handle', async ({
		page,
	}) => {
		// Get all items
		const root = page.locator('.ssl-root');
		const items = await root.locator('.ssl-item').all();

		for (let i = 0; i < items.length - 1; i++) {
			const draggedItem = root.locator(`[data-item-id="list-item-${i + 1}"]`);
			const initialBox = await draggedItem.boundingBox();
			const draggedHandle = draggedItem.locator('.ssl-item-handle');
			const handleBox = await draggedHandle.boundingBox();
			const targetItem = root.locator(`[data-item-id="list-item-${i + 2}"]`);
			const targetBox = await targetItem.boundingBox();

			if (!initialBox || !handleBox || !targetBox)
				throw new Error('Could not get element bounding box');

			// Start dragging the item from the handle (not on the interactive element)
			await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);

			// Press the mouse down to start dragging
			await page.mouse.down();

			// Wait for the drag operation to start by checking the drag state
			await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag-start');

			// Move the item down
			await page.mouse.move(
				handleBox.x + handleBox.width / 2,
				targetBox.y + targetBox.height / 2,
				{ steps: 40 } // Smooth movement
			);

			// Release the mouse to drop
			await page.mouse.up();

			// Wait for the drag operation to complete by checking the drag state returns to idle
			await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');

			// Get the final position
			const finalBox = await draggedItem.boundingBox();
			expect(finalBox?.y).toBeGreaterThanOrEqual(initialBox.y);
		}
	});
});
