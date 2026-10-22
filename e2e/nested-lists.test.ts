import { test, expect } from '@playwright/test';

const listItemTexts: Record<string, string[]> = {
	'to-do': ['To Do Item 1', 'To Do Item 2', 'To Do Item 3', 'To Do Item 4', 'To Do Item 5'],
	doing: ['Doing Item 1', 'Doing Item 2', 'Doing Item 3'],
	done: ['Done Item 1', 'Done Item 2', 'Done Item 3', 'Done Item 4'],
};

test.describe('Sortable List - Nested Lists', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the Nested Lists page
		await page.goto('/nested-lists');

		// Wait for the root elements to be loaded
		await page.locator('.ssl-root').first().waitFor();
	});

	test('should fall back to the plain list roles when a list holds nested lists', async ({
		page,
	}) => {
		// Find the board root and the «To Do» list root
		const board = page.locator('[data-list-id="board"]');
		const toDoList = page.locator('[data-list-id="to-do"]');

		// Verify the board and its items dropped the listbox pair, since an option
		// may not hold interactive content
		await expect(board).toHaveAttribute('role', 'list');
		await expect(board.locator('> [data-item-id="column-to-do"]')).toHaveAttribute(
			'role',
			'listitem'
		);
		await expect(board).not.toHaveAttribute('aria-activedescendant', /.*/);

		// Verify the nested lists and their items keep it
		await expect(toDoList).toHaveAttribute('role', 'listbox');
		await expect(toDoList.locator('> [data-item-id="to-do-item-1"]')).toHaveAttribute(
			'role',
			'option'
		);

		// Verify the board describes itself in terms of lists rather than items
		await expect(board).toHaveAttribute('aria-description', /move through the lists/);
	});

	test('should reorder a list within the board using mouse', async ({ page }) => {
		// Find the board root
		const board = page.locator('[data-list-id="board"]');

		// Get the initial order of the lists to verify the starting state
		const lists = board.locator('> .ssl-item:not(.ssl-placeholder)');
		expect(await lists.evaluateAll((items) => items.map((item) => item.id))).toEqual([
			'column-to-do',
			'column-doing',
			'column-done',
		]);

		// Find the dragged list («To Do»), its handle and the target list («Doing»)
		const draggedList = board.locator('> [data-item-id="column-to-do"]:not(.ssl-placeholder)');
		const handle = draggedList.locator('.ssl-handle').first();
		const targetList = board.locator('> [data-item-id="column-doing"]:not(.ssl-placeholder)');

		// Scroll both lists into view before reading their bounding boxes — needed on narrower
		// viewports (e.g. Mobile Chrome), where the three lists overflow horizontally
		await draggedList.scrollIntoViewIfNeeded();
		await targetList.scrollIntoViewIfNeeded();

		// Get the bounding boxes for a precise drag operation
		const draggedBox = await draggedList.boundingBox();
		const handleBox = await handle.boundingBox();
		const targetBox = await targetList.boundingBox();
		if (!draggedBox || !handleBox || !targetBox)
			throw new Error('Could not get the «To Do» handle or the «Doing» bounding box');

		// Keep the grab offset inside the handle, so the dragged list lands centered on its target
		const offsetX = handleBox.x + handleBox.width / 2 - draggedBox.x;
		const offsetY = handleBox.y + handleBox.height / 2 - draggedBox.y;

		// Start the drag from the center of the handle
		await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);

		// Press the mouse down to start dragging
		await page.mouse.down();

		// Wait for the drag operation to start by checking the drag state
		await expect(draggedList).toHaveAttribute('data-drag-state', 'ptr-drag-start');

		// Move over the target position. A single glide can outrun the per-frame pointer-move
		// throttle in `handlePointerMove()`, so flush it with a rAF wait, then re-issue one
		// precise move at the exact target coordinates and wait one more frame for it to register.
		await page.mouse.move(targetBox.x + offsetX, targetBox.y + offsetY, {
			steps: 40, // Smooth movement
		});
		await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
		await page.mouse.move(targetBox.x + offsetX, targetBox.y + offsetY);
		await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));

		// Verify the board shows a single placeholder for the dragged list
		await expect(draggedList).toHaveAttribute('data-drag-state', 'ptr-drag');
		await expect(board.locator('> .ssl-placeholder')).toHaveCount(1);

		// Release the mouse to drop
		await page.mouse.up();

		// Wait for the drag operation to complete by checking the drag state returns to idle
		await expect(draggedList).toHaveAttribute('data-drag-state', 'idle');

		// Verify «To Do» and «Doing» swapped places
		expect(await lists.evaluateAll((items) => items.map((item) => item.id))).toEqual([
			'column-doing',
			'column-to-do',
			'column-done',
		]);

		// Verify every list kept its own items
		expect(
			await page
				.locator('[data-list-id="to-do"] .ssl-item .ssl-item-content__text')
				.allTextContents()
		).toEqual(listItemTexts['to-do']);
		expect(
			await page
				.locator('[data-list-id="doing"] .ssl-item .ssl-item-content__text')
				.allTextContents()
		).toEqual(listItemTexts['doing']);
	});

	test('should reorder a list within the board using keyboard', async ({ page }) => {
		// Find the board root and its lists
		const board = page.locator('[data-list-id="board"]');
		const lists = board.locator('> .ssl-item:not(.ssl-placeholder)');

		// Focus the board and select its first list («To Do»)
		await board.focus();
		await page.keyboard.press('ArrowRight');
		const draggedList = board.locator('> [data-item-id="column-to-do"]:not(.ssl-placeholder)');
		await expect(draggedList).toBeFocused();

		// Start dragging with the Space key
		await page.keyboard.press('Space');
		await expect(draggedList).toHaveAttribute('data-drag-state', 'kbd-drag-start');

		// Verify the announcement reads out a list rather than an item
		const liveRegion = page.locator('.ssl-live-region').last();
		await expect(liveRegion).toHaveText('You have lifted a list at position 1.');

		// Move right — the main axis of a horizontal board — to target the «Doing» list
		await page.keyboard.press('ArrowRight');
		await expect(draggedList).toHaveAttribute('data-drag-state', 'kbd-drag');
		await expect(liveRegion).toHaveText('You have moved the list from position 1 to position 2.');

		// Drop the list with the Space key
		await page.keyboard.press('Space');
		await expect(draggedList).toHaveAttribute('data-drag-state', 'idle');

		// Verify «To Do» and «Doing» swapped places
		expect(await lists.evaluateAll((items) => items.map((item) => item.id))).toEqual([
			'column-doing',
			'column-to-do',
			'column-done',
		]);

		// Verify the moved list retained focus, and that the lists were renumbered
		await expect(draggedList).toBeFocused();
		await expect(page.locator('[data-list-id="doing"]')).toHaveAttribute('data-list-index', '0');
		await expect(page.locator('[data-list-id="to-do"]')).toHaveAttribute('data-list-index', '1');
	});

	test('should not move a list when one of its items is dragged using mouse', async ({ page }) => {
		// Find the board root and the «To Do» list root
		const board = page.locator('[data-list-id="board"]');
		const toDoList = page.locator('[data-list-id="to-do"]');

		// Find the dragged item (To Do Item 1), the target item (To Do Item 3) and the list holding them
		const draggedItem = toDoList.locator('[data-item-id="to-do-item-1"]:not(.ssl-placeholder)');
		const targetItem = toDoList.locator('[data-item-id="to-do-item-3"]:not(.ssl-placeholder)');
		const draggedItemList = board.locator('> [data-item-id="column-to-do"]:not(.ssl-placeholder)');

		// Scroll both items into view before reading their bounding boxes
		await draggedItem.scrollIntoViewIfNeeded();
		await targetItem.scrollIntoViewIfNeeded();

		// Get the bounding boxes for a precise drag operation
		const draggedBox = await draggedItem.boundingBox();
		const targetBox = await targetItem.boundingBox();
		if (!draggedBox || !targetBox)
			throw new Error('Could not get To Do Item 1 or To Do Item 3 bounding box');

		// Start the drag from the center of the dragged item
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			draggedBox.y + draggedBox.height / 2
		);

		// Press the mouse down to start dragging
		await page.mouse.down();

		// Verify the item took the gesture and its list stayed idle
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag-start');
		await expect(draggedItemList).toHaveAttribute('data-drag-state', 'idle');
		await expect(board).toHaveAttribute('data-drag-state', 'idle');

		// Move to the target position (center of To Do Item 3)
		await page.mouse.move(
			targetBox.x + targetBox.width / 2,
			targetBox.y + targetBox.height / 2,
			{ steps: 40 } // Smooth movement
		);

		// Release the mouse to drop
		await page.mouse.up();

		// Wait for the drag operation to complete by checking the drag state returns to idle
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify the item moved inside its own list
		expect(await toDoList.locator('.ssl-item .ssl-item-content__text').allTextContents()).toEqual([
			'To Do Item 2',
			'To Do Item 3',
			'To Do Item 1',
			'To Do Item 4',
			'To Do Item 5',
		]);

		// Verify the lists kept their order
		expect(
			await board
				.locator('> .ssl-item:not(.ssl-placeholder)')
				.evaluateAll((items) => items.map((item) => item.id))
		).toEqual(['column-to-do', 'column-doing', 'column-done']);
	});

	test('should only drag a list from its handle', async ({ page }) => {
		// Find the board root and the «To Do» list, which holds a handle in its header
		const board = page.locator('[data-list-id="board"]');
		const draggedList = board.locator('> [data-item-id="column-to-do"]:not(.ssl-placeholder)');

		// Find the list title, a piece of the list’s own chrome that is not the handle
		const title = draggedList.locator('.column__title');
		await title.scrollIntoViewIfNeeded();

		// Get its bounding box to press the mouse down on it
		const titleBox = await title.boundingBox();
		if (!titleBox) throw new Error('Could not get the «To Do» title bounding box');

		// Press the mouse down on the title and move away from it
		await page.mouse.move(titleBox.x + titleBox.width / 2, titleBox.y + titleBox.height / 2);
		await page.mouse.down();
		await page.mouse.move(
			titleBox.x + titleBox.width / 2 + 60,
			titleBox.y + titleBox.height / 2,
			{ steps: 20 } // Smooth movement
		);

		// Verify no drag started
		await expect(draggedList).toHaveAttribute('data-drag-state', 'idle');
		await expect(board).toHaveAttribute('data-drag-state', 'idle');
		await page.mouse.up();

		// Get the handle bounding box to press the mouse down on it
		const handleBox = await draggedList.locator('.ssl-handle').first().boundingBox();
		if (!handleBox) throw new Error('Could not get the «To Do» handle bounding box');

		// Press the mouse down on the handle
		await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
		await page.mouse.down();

		// Verify the drag started this time
		await expect(draggedList).toHaveAttribute('data-drag-state', 'ptr-drag-start');
		await page.mouse.up();
	});

	test('should refuse to drag a list while one of its items is being dragged using keyboard', async ({
		page,
	}) => {
		// Find the board root, the «To Do» list root and the list holding it
		const board = page.locator('[data-list-id="board"]');
		const toDoList = page.locator('[data-list-id="to-do"]');
		const draggedItemList = board.locator('> [data-item-id="column-to-do"]:not(.ssl-placeholder)');

		// Focus the «To Do» list and start dragging its first item with the Space key
		await toDoList.focus();
		await page.keyboard.press('ArrowDown');
		const draggedItem = toDoList.locator('[data-item-id="to-do-item-1"]:not(.ssl-placeholder)');
		await expect(draggedItem).toBeFocused();
		await page.keyboard.press('Space');
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'kbd-drag-start');

		// Get the handle bounding box to press the mouse down on it
		const handleBox = await draggedItemList.locator('.ssl-handle').first().boundingBox();
		if (!handleBox) throw new Error('Could not get the «To Do» handle bounding box');

		// Press the mouse down on the handle of the list holding the dragged item
		await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
		await page.mouse.down();

		// Verify the list refused the drag, and the item kept hold of the keyboard one
		await expect(draggedItemList).toHaveAttribute('data-drag-state', 'idle');
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'kbd-drag-start');
		await page.mouse.up();
	});

	test('should move an item across lists using keyboard after the lists were reordered', async ({
		page,
	}) => {
		// Find the board root, and the «To Do» and «Doing» list roots
		const board = page.locator('[data-list-id="board"]');
		const toDoList = page.locator('[data-list-id="to-do"]');
		const doingList = page.locator('[data-list-id="doing"]');

		// Send «To Do» past «Doing» with the keyboard, so both lists are renumbered
		await board.focus();
		await page.keyboard.press('ArrowRight');
		await page.keyboard.press('Space');
		await page.keyboard.press('ArrowRight');
		await page.keyboard.press('Space');
		await expect(doingList).toHaveAttribute('data-list-index', '0');
		await expect(toDoList).toHaveAttribute('data-list-index', '1');

		// Focus the «To Do» list and select its first item (To Do Item 1)
		await toDoList.focus();
		await page.keyboard.press('ArrowDown');
		const draggedItem = page.locator('[data-item-id="to-do-item-1"]:not(.ssl-placeholder)');
		await expect(draggedItem).toBeFocused();

		// Start dragging with the Space key
		await page.keyboard.press('Space');
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'kbd-drag-start');

		// Move left — the axis perpendicular to a vertical list — to target the «Doing» peer list,
		// which now sits before «To Do»
		await page.keyboard.press('ArrowLeft');
		await expect(doingList).toHaveAttribute('data-is-target', 'true');
		await expect(doingList.locator('.ssl-placeholder')).toBeVisible();

		// Drop the item with the Space key
		await page.keyboard.press('Space');
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify To Do Item 1 left the «To Do» list and reached the «Doing» one
		expect(await toDoList.locator('.ssl-item .ssl-item-content__text').allTextContents()).toEqual(
			listItemTexts['to-do'].slice(1)
		);
		expect(
			await doingList.locator('.ssl-item .ssl-item-content__text').allTextContents()
		).toContain('To Do Item 1');

		// Verify the lists kept their new order
		expect(
			await board
				.locator('> .ssl-item:not(.ssl-placeholder)')
				.evaluateAll((items) => items.map((item) => item.id))
		).toEqual(['column-doing', 'column-to-do', 'column-done']);
	});

	test('should navigate focus across lists using arrow keys after the lists were reordered', async ({
		page,
	}) => {
		// Find the board root, and the «To Do», «Doing» and «Done» list roots
		const board = page.locator('[data-list-id="board"]');
		const toDoList = page.locator('[data-list-id="to-do"]');
		const doingList = page.locator('[data-list-id="doing"]');
		const doneList = page.locator('[data-list-id="done"]');

		// Send «To Do» past «Doing» with the keyboard, so both lists are renumbered
		await board.focus();
		await page.keyboard.press('ArrowRight');
		await page.keyboard.press('Space');
		await page.keyboard.press('ArrowRight');
		await page.keyboard.press('Space');
		await expect(doingList).toHaveAttribute('data-list-index', '0');

		// Focus the «To Do» list, now the one in the middle, and select its first item
		await toDoList.focus();
		await page.keyboard.press('ArrowDown');
		await expect(toDoList.locator('[data-item-id="to-do-item-1"]')).toBeFocused();

		// Move left to reach «Doing», which was pushed to the front of the board
		await page.keyboard.press('ArrowLeft');
		await expect(doingList.locator('.ssl-item[aria-selected="true"]')).toBeFocused();

		// Attempting to move left from the first list in the group should have no effect
		await page.keyboard.press('ArrowLeft');
		await expect(doingList.locator('.ssl-item[aria-selected="true"]')).toBeFocused();

		// Move right twice to walk through «To Do» and reach «Done»
		await page.keyboard.press('ArrowRight');
		await expect(toDoList.locator('.ssl-item[aria-selected="true"]')).toBeFocused();
		await page.keyboard.press('ArrowRight');
		await expect(doneList.locator('.ssl-item[aria-selected="true"]')).toBeFocused();
	});
});
