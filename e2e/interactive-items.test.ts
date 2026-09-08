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

		// Test radio buttons
		const radioButtons = page.getByRole('radio');
		await expect(radioButtons.nth(0)).not.toBeChecked();
		await expect(radioButtons.nth(1)).toBeChecked();
		await expect(radioButtons.nth(2)).not.toBeChecked();

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
						.or(
							draggedItem
								.locator('select')
								.or(draggedItem.locator('input[type="checkbox"]'))
								.or(draggedItem.locator('input[type="radio"]'))
						)
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

		// Verify the textarea is still focused once the items have been sorted
		await expect(textarea).toBeFocused();

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

		// Verify the textarea (List Item 2 is the first item after the pointer drag above) is still
		// focused once the items have been sorted
		await expect(focusedItem).toContainText('List Item 2');
		await expect(textarea).toBeFocused();
	});

	test('should let the pointer interact with the list while an item has keyboard focus', async ({
		page,
	}) => {
		// Find the root element
		const root = page.locator('.ssl-root');

		// Focus the root and navigate to the first item
		await root.focus();
		await page.keyboard.press('ArrowDown');

		// Verify the List Item 1 is focused
		const focusedItem = root.locator('[data-item-id="list-item-1"]:not(.ssl-placeholder)');
		await expect(focusedItem).toBeFocused();

		// Get the bounding box of the input inside List Item 1 for a precise click
		const input = focusedItem.locator('input');
		const inputBox = await input.boundingBox();
		if (!inputBox) throw new Error('Could not get List Item 1 input bounding box');

		// Click the input once
		await page.mouse.click(inputBox.x + inputBox.width / 2, inputBox.y + inputBox.height / 2);

		// Verify the input is focused right away (the click must not fall through the list)
		await expect(input).toBeFocused();

		// Focus the root and navigate to the first item again
		await root.focus();
		await page.keyboard.press('ArrowDown');
		await expect(focusedItem).toBeFocused();

		// Find the dragged item (List Item 2) and the target item (List Item 4)
		const draggedItem = root.locator('[data-item-id="list-item-2"]:not(.ssl-placeholder)');
		const targetItem = root.locator('[data-item-id="list-item-4"]:not(.ssl-placeholder)');

		// Get the bounding boxes for a precise drag operation
		const draggedBox = await draggedItem.boundingBox();
		const targetBox = await targetItem.boundingBox();
		if (!draggedBox || !targetBox)
			throw new Error('Could not get List Item 2 or List Item 4 bounding box');

		// Press the mouse down on the edge of List Item 2 (not on the interactive element)
		await page.mouse.move(draggedBox.x + 8, draggedBox.y + draggedBox.height / 2);
		await page.mouse.down();

		// Wait for the drag operation to start on this first press by checking the drag state
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag-start');

		// Verify the press cleared the keyboard focus from the list
		await expect(focusedItem).not.toBeFocused();
		await expect(focusedItem).toHaveAttribute('aria-selected', 'false');
		await expect(root).not.toHaveAttribute('aria-activedescendant');

		// Move to the target position (edge of List Item 4)
		await page.mouse.move(targetBox.x + 8, targetBox.y + targetBox.height / 2, { steps: 40 });

		// Release the mouse to drop
		await page.mouse.up();

		// Wait for the drag operation to complete by checking the drag state returns to idle
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify List Item 2 moved to the List Item 4 position
		const itemIds = await root
			.locator('.ssl-item')
			.evaluateAll((items) => items.map((item) => item.getAttribute('data-item-id')));
		expect(itemIds.indexOf('list-item-2')).toBe(3);
	});

	test('should follow the focus into an item entered through an interactive element', async ({
		page,
	}) => {
		// Find the root element
		const root = page.locator('.ssl-root');

		// Focus the root and navigate to the first item
		await root.focus();
		await page.keyboard.press('ArrowDown');
		const firstItem = root.locator('[data-item-id="list-item-1"]:not(.ssl-placeholder)');
		await expect(firstItem).toBeFocused();

		// Get the bounding box of the textarea inside List Item 2 for a precise click
		const secondItem = root.locator('[data-item-id="list-item-2"]:not(.ssl-placeholder)');
		const textarea = secondItem.locator('textarea');
		const textareaBox = await textarea.boundingBox();
		if (!textareaBox) throw new Error('Could not get List Item 2 textarea bounding box');

		// Click the textarea, moving the focus into List Item 2 without touching its <li>
		await page.mouse.click(
			textareaBox.x + textareaBox.width / 2,
			textareaBox.y + textareaBox.height / 2
		);
		await expect(textarea).toBeFocused();

		// Verify the list follows the focus into List Item 2
		await expect(root).toHaveAttribute('aria-activedescendant', 'list-item-2');
		await expect(secondItem).toHaveAttribute('tabindex', '0');
		await expect(secondItem).toHaveAttribute('aria-selected', 'true');
		await expect(firstItem).toHaveAttribute('tabindex', '-1');
		await expect(firstItem).toHaveAttribute('aria-selected', 'false');
	});

	test('should clear the focus from an interactive element when a pointer drag starts elsewhere', async ({
		page,
	}) => {
		// Find the root element
		const root = page.locator('.ssl-root');

		// Focus the input inside List Item 1 with the keyboard
		const focusedItem = root.locator('[data-item-id="list-item-1"]:not(.ssl-placeholder)');
		const input = focusedItem.locator('input');
		await input.focus();
		await expect(input).toBeFocused();
		await expect(root).toHaveAttribute('aria-activedescendant', 'list-item-1');

		// Find the dragged item (List Item 3) and the target item (List Item 5)
		const draggedItem = root.locator('[data-item-id="list-item-3"]:not(.ssl-placeholder)');
		const targetItem = root.locator('[data-item-id="list-item-5"]:not(.ssl-placeholder)');
		const draggedBox = await draggedItem.boundingBox();
		const targetBox = await targetItem.boundingBox();
		if (!draggedBox || !targetBox)
			throw new Error('Could not get List Item 3 or List Item 5 bounding box');

		// Press the mouse down on the edge of List Item 3 (not on the interactive element)
		await page.mouse.move(draggedBox.x + 8, draggedBox.y + draggedBox.height / 2);
		await page.mouse.down();
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag-start');

		// Verify the press took the focus away from the input in List Item 1
		await expect(input).not.toBeFocused();
		await expect(root).not.toHaveAttribute('aria-activedescendant');

		// Press Tab in the middle of the pointer drag
		await page.keyboard.press('Tab');

		// Verify the pointer drag survived, instead of being canceled through the keyboard path
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag-start');

		// Move to the target position (edge of List Item 5) and release the mouse to drop
		await page.mouse.move(targetBox.x + 8, targetBox.y + targetBox.height / 2, { steps: 40 });
		await page.mouse.up();

		// Wait for the drag operation to complete by checking the drag state returns to idle
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify List Item 3 moved to the List Item 5 position
		const itemIds = await root
			.locator('.ssl-item')
			.evaluateAll((items) => items.map((item) => item.getAttribute('data-item-id')));
		expect(itemIds.indexOf('list-item-3')).toBe(4);
	});

	test('should show the current form element values inside the placeholder', async ({ page }) => {
		// Find the root element
		const root = page.locator('.ssl-root');

		// Change every form element away from its default value
		const textInput = page.getByRole('textbox', { name: 'List Item 1' });
		const textarea = page.getByRole('textbox', { name: 'List Item 2' });
		const select = page.getByRole('combobox');
		const checkboxes = page.getByRole('checkbox');
		const radioButtons = page.getByRole('radio');
		await textInput.fill('Updated input');
		await textarea.fill('Updated textarea');
		await select.selectOption('option-3');
		await checkboxes.nth(0).uncheck();
		await checkboxes.nth(2).check();
		await radioButtons.nth(0).check();

		// Drag every item with a form element and verify its placeholder shows the current values
		const expectations: Record<
			string,
			(placeholder: import('@playwright/test').Locator) => Promise<void>
		> = {
			'list-item-1': async (placeholder) =>
				expect(placeholder.locator('input')).toHaveValue('Updated input'),
			'list-item-2': async (placeholder) =>
				expect(placeholder.locator('textarea')).toHaveValue('Updated textarea'),
			'list-item-3': async (placeholder) =>
				expect(placeholder.locator('select')).toHaveValue('option-3'),
			'list-item-4': async (placeholder) => {
				await expect(placeholder.locator('input').nth(0)).not.toBeChecked();
				await expect(placeholder.locator('input').nth(1)).toBeChecked();
				await expect(placeholder.locator('input').nth(2)).toBeChecked();
			},
			'list-item-5': async (placeholder) => {
				await expect(placeholder.locator('input').nth(0)).toBeChecked();
				await expect(placeholder.locator('input').nth(1)).not.toBeChecked();
				await expect(placeholder.locator('input').nth(2)).not.toBeChecked();
			},
		};

		for (const [itemId, verifyPlaceholder] of Object.entries(expectations)) {
			// Find the dragged item
			const draggedItem = root.locator(`[data-item-id="${itemId}"]:not(.ssl-placeholder)`);

			// Get the bounding box for a precise drag operation
			const draggedBox = await draggedItem.boundingBox();
			if (!draggedBox) throw new Error(`Could not get ${itemId} bounding box`);

			// Press the mouse down on the edge of the item (not on the interactive element)
			await page.mouse.move(draggedBox.x + 8, draggedBox.y + draggedBox.height / 2);
			await page.mouse.down();

			// Wait for the drag operation to start by checking the drag state
			await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag-start');

			// Verify the placeholder copy shows the current values, without competing ids or names
			const placeholder = root.locator(`.ssl-placeholder[data-item-id="${itemId}"]`);
			await expect(placeholder).toBeVisible();
			await verifyPlaceholder(placeholder);
			await expect(placeholder.locator('[id], [name], [for]')).toHaveCount(0);

			// Release the mouse to drop
			await page.mouse.up();

			// Wait for the drag operation to complete by checking the drag state returns to idle
			await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');
		}

		// Verify the form elements kept their values after all the drags
		await expect(textInput).toHaveValue('Updated input');
		await expect(textarea).toHaveValue('Updated textarea');
		await expect(select).toHaveValue('option-3');
		await expect(checkboxes.nth(0)).not.toBeChecked();
		await expect(checkboxes.nth(2)).toBeChecked();
		await expect(radioButtons.nth(0)).toBeChecked();
	});

	test('should remove interactive elements from the tab sequence when the list is disabled while an item is focused', async ({
		page,
	}) => {
		// Find the root element and focus it
		const root = page.locator('.ssl-root');
		await root.focus();

		// Navigate to the first item using the arrow keys
		await page.keyboard.press('ArrowDown');

		// Verify the List Item 1 is focused and its interactive element is tabbable
		const focusedItem = root.locator('.ssl-item[aria-selected="true"]');
		await expect(focusedItem).toBeFocused();
		await expect(focusedItem).toContainText('List Item 1');
		const interactiveElement = focusedItem.locator('input');
		await expect(interactiveElement).toHaveAttribute('tabindex', '0');

		// Disable the list through the demo controls without moving focus away from the item.
		// The controls panel is inert while collapsed, so the checkbox is toggled programmatically.
		const isDisabledControl = page.locator('#is-disabled');
		await isDisabledControl.evaluate((el) => (el as HTMLInputElement).click());
		await expect(root).toHaveAttribute('data-is-disabled', 'true');
		await expect(focusedItem).toBeFocused();

		// Verify the interactive element left the tab sequence
		await expect(interactiveElement).toHaveAttribute('tabindex', '-1');

		// Enable the list again
		await isDisabledControl.evaluate((el) => (el as HTMLInputElement).click());
		await expect(root).not.toHaveAttribute('data-is-disabled', 'true');

		// Verify the interactive element rejoined the tab sequence
		await expect(interactiveElement).toHaveAttribute('tabindex', '0');
	});
});
