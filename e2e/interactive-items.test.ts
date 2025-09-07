import { test, expect } from '@playwright/test';

test.describe('Sortable List - Interactive Items', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the Interactive Items page
		await page.goto('/interactive-items');

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

	test('should be able to drag items with interactive elements', async ({ page }) => {
		// Get all items
		const root = page.locator('.ssl-root');
		const items = await root.locator('.ssl-item').all();

		for (let i = 0; i < items.length - 1; i++) {
			const draggedItem = root.locator(`[data-item-id="list-item-${i + 1}"]`);
			const initialBox = await draggedItem.boundingBox();
			const targetItem = root.locator(`[data-item-id="list-item-${i + 2}"]`);
			const targetBox = await targetItem.boundingBox();

			if (!initialBox || !targetBox) throw new Error('Could not get item bounding box');

			// Start dragging the item from the edge (not on the interactive element)
			await page.mouse.move(
				initialBox.x + 8, // Start from left edge
				initialBox.y + initialBox.height / 2
			);

			// Press the mouse down to start dragging
			await page.mouse.down();

			// Wait for the drag operation to start by checking the drag state
			await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag-start');

			// Move the item down
			await page.mouse.move(
				targetBox.x + 8,
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

	test('should maintain form element state during dragging', async ({ page }) => {
		// Get all items
		const root = page.locator('.ssl-root');
		const items = await root.locator('.ssl-item').all();

		// Find the ghost element
		const ghost = page.locator('.ssl-ghost');

		for (let i = 0; i < items.length - 2; i++) {
			const draggedItem = root.locator(`[data-item-id="list-item-${i + 1}"]`);
			const draggedBox = await draggedItem.boundingBox();

			if (!draggedBox) throw new Error('Could not get item bounding box');

			// Start dragging the item from the edge (not on the interactive element)
			await page.mouse.move(
				draggedBox.x + 8, // Start from left edge
				draggedBox.y + draggedBox.height / 2
			);

			// Press the mouse down to start dragging
			await page.mouse.down();

			// Wait for the drag operation to start by checking the drag state
			await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag-start');

			// Verify the form elements retained their values
			const ghostFormField = ghost
				.locator('input')
				.or(
					ghost
						.locator('textarea')
						.or(ghost.locator('select').or(ghost.locator('input[type="checkbox"]')))
				);
			const ghostText = await ghost.textContent();

			if (ghostText?.includes('List Item 1'))
				await expect(ghostFormField).toHaveValue('Input field');
			else if (ghostText?.includes('List Item 2'))
				await expect(ghostFormField).toHaveValue('Textarea field');
			else if (ghostText?.includes('List Item 3'))
				await expect(ghostFormField).toHaveValue('option-2');
			else if (ghostText?.includes('List Item 4'))
				await expect(ghostFormField.nth(1)).toBeChecked();

			// Release the mouse to drop
			await page.mouse.up();

			// Wait for the drag operation to complete by checking the drag state returns to idle
			await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');
		}
	});

	test('should reset interactive element tabindex after focusing outside the list', async ({
		page,
	}) => {
		// Find the root element and focus it
		const root = page.locator('.ssl-root');
		await root.focus();

		// Navigate to the third item using the arrow keys
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('ArrowDown');

		// Verify the List Item 3 is focused
		const focusedItem = root.locator('.ssl-item[aria-selected="true"]');
		await expect(focusedItem).toBeFocused();

		// Focus the interactive element inside use the Tab key
		await page.keyboard.press('Tab');

		// Verify the interactive element is focused
		const interactiveElement = focusedItem.locator('select');
		await expect(focusedItem).toContainText('List Item 3');
		await expect(interactiveElement).toBeFocused();

		// Tab away from the interactive element
		await page.keyboard.press('Tab');

		// Tab back to the root
		await page.keyboard.press('Shift+Tab');

		// Verify the root element is focused
		await expect(root).toBeFocused();
	});
});
