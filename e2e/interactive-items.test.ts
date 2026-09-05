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
			const draggedItem = root.locator(`[data-item-id="list-item-${i + 1}"]:not(.ssl-placeholder)`);
			const initialBox = await draggedItem.boundingBox();
			const targetItem = root.locator(`[data-item-id="list-item-${i + 2}"]:not(.ssl-placeholder)`);
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

		for (let i = 0; i < items.length - 2; i++) {
			const draggedItem = root.locator(`[data-item-id="list-item-${i + 1}"]:not(.ssl-placeholder)`);
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
			const draggedFormField = draggedItem
				.locator('input')
				.or(
					draggedItem
						.locator('textarea')
						.or(draggedItem.locator('select').or(draggedItem.locator('input[type="checkbox"]')))
				);
			const draggedText = await draggedItem.textContent();

			if (draggedText?.includes('List Item 1'))
				await expect(draggedFormField).toHaveValue('Input field');
			else if (draggedText?.includes('List Item 2'))
				await expect(draggedFormField).toHaveValue('Textarea field');
			else if (draggedText?.includes('List Item 3'))
				await expect(draggedFormField).toHaveValue('option-2');
			else if (draggedText?.includes('List Item 4'))
				await expect(draggedFormField.nth(1)).toBeChecked();

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

	test('should let interactive elements be focused while a drop transition is running', async ({
		page,
	}) => {
		// Find the root element
		const root = page.locator('.ssl-root');

		// === POINTER ===
		// Find the dragged item (List Item 1) and the target item (List Item 3)
		const draggedItem = root.locator('[data-item-id="list-item-1"]:not(.ssl-placeholder)');
		const targetItem = root.locator('[data-item-id="list-item-3"]:not(.ssl-placeholder)');
		const draggedBox = await draggedItem.boundingBox();
		const targetBox = await targetItem.boundingBox();
		if (!draggedBox || !targetBox) throw new Error('Could not get item bounding box');

		// Drag List Item 1 from its edge (not on the interactive element) onto List Item 3
		await page.mouse.move(draggedBox.x + 8, draggedBox.y + draggedBox.height / 2);
		await page.mouse.down();
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag-start');
		await page.mouse.move(targetBox.x + 8, targetBox.y + targetBox.height / 2, { steps: 40 });

		// Release the mouse and, while the drop transition is still running, click into the
		// textarea of List Item 2. The click must focus it instead of being swallowed.
		await page.mouse.up();
		const textarea = page.getByRole('textbox', { name: 'List Item 2' });
		const textareaBox = await textarea.boundingBox();
		if (!textareaBox) throw new Error('Could not get List Item 2 textarea bounding box');
		await page.mouse.click(textareaBox.x + 8, textareaBox.y + textareaBox.height / 2);
		expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('TEXTAREA');

		// Wait for the drag operation to complete
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');

		// === KEYBOARD ===
		// Focus the root, navigate to the first item and move it one position down with the keyboard
		await root.focus();
		await page.keyboard.press('ArrowDown');
		const focusedItem = root.locator('.ssl-item[aria-selected="true"]');
		await expect(focusedItem).toBeFocused();
		await page.keyboard.press('Space');
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('Space');

		// While the drop transition is still running, press Tab. It must move the focus into the
		// item’s interactive element instead of being swallowed.
		await page.keyboard.press('Tab');
		expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe('LI');

		// Wait for the drag operation to complete
		await expect(focusedItem).toHaveAttribute('data-drag-state', 'idle');
	});
});
