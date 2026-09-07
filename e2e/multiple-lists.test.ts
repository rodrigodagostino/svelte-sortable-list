import { test, expect } from '@playwright/test';
import { sortItems } from '../src/lib/utils/exposed.js';

const listItemTexts: Record<string, string[]> = {
	'to-do': ['To Do Item 1', 'To Do Item 2', 'To Do Item 3', 'To Do Item 4', 'To Do Item 5'],
	doing: ['Doing Item 1', 'Doing Item 2', 'Doing Item 3'],
	done: ['Done Item 1', 'Done Item 2', 'Done Item 3', 'Done Item 4'],
};

test.describe('Sortable List - Multiple Lists', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the Multiple Lists page
		await page.goto('/multiple-lists');

		// Wait for the root elements to be loaded
		await page.locator('.ssl-root').first().waitFor();
	});

	test('should reorder an item within the same list using mouse', async ({ page }) => {
		// Find the «To Do» list root
		const toDoList = page.locator('[data-list-id="to-do"]');

		// Get the initial order of the items to verify the starting state
		const initialItems = await toDoList
			.locator('.ssl-item .ssl-item-content__text')
			.allTextContents();
		expect(initialItems).toEqual(listItemTexts['to-do']);

		// Find the dragged item (To Do Item 1) and the target item (To Do Item 3)
		const draggedItem = toDoList.locator('[data-item-id="to-do-item-1"]:not(.ssl-placeholder)');
		const targetItem = toDoList.locator('[data-item-id="to-do-item-3"]:not(.ssl-placeholder)');

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

		// Wait for the drag operation to start by checking the drag state
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag-start');

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

		// Verify the order within the «To Do» list after the drag
		const itemsAfterDrag = await toDoList
			.locator('.ssl-item .ssl-item-content__text')
			.allTextContents();
		expect(itemsAfterDrag).toEqual(sortItems(initialItems, 0, 2));

		// Verify the «Doing» and «Done» lists remain unaffected
		const doingList = page.locator('[data-list-id="doing"]');
		const doneList = page.locator('[data-list-id="done"]');
		expect(await doingList.locator('.ssl-item .ssl-item-content__text').allTextContents()).toEqual(
			listItemTexts['doing']
		);
		expect(await doneList.locator('.ssl-item .ssl-item-content__text').allTextContents()).toEqual(
			listItemTexts['done']
		);
	});

	test('should move an item from one list to another list using mouse', async ({ page }) => {
		// Find the «To Do» and «Doing» list roots
		const toDoList = page.locator('[data-list-id="to-do"]');
		const doingList = page.locator('[data-list-id="doing"]');

		// Get the initial order of the items in both lists to verify the starting state
		const initialToDoItems = await toDoList
			.locator('.ssl-item .ssl-item-content__text')
			.allTextContents();
		const initialDoingItems = await doingList
			.locator('.ssl-item .ssl-item-content__text')
			.allTextContents();
		expect(initialToDoItems).toEqual(listItemTexts['to-do']);
		expect(initialDoingItems).toEqual(listItemTexts['doing']);

		// Find the dragged item (To Do Item 1) and the target item (Doing Item 2) in the peer list
		const draggedItem = page.locator('[data-item-id="to-do-item-1"]:not(.ssl-placeholder)');
		const targetItem = doingList.locator('[data-item-id="doing-item-2"]:not(.ssl-placeholder)');

		// Scroll both items into view before reading their bounding boxes — see the note in the
		// same-list reorder test above.
		await draggedItem.scrollIntoViewIfNeeded();
		await targetItem.scrollIntoViewIfNeeded();

		// Get the bounding boxes for a precise drag operation
		const draggedBox = await draggedItem.boundingBox();
		const targetBox = await targetItem.boundingBox();
		if (!draggedBox || !targetBox)
			throw new Error('Could not get To Do Item 1 or Doing Item 2 bounding box');

		// Start the drag from the center of the dragged item
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			draggedBox.y + draggedBox.height / 2
		);

		// Press the mouse down to start dragging
		await page.mouse.down();

		// Wait for the drag operation to start by checking the drag state
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag-start');

		// Move over the target position (center of Doing Item 2, in the peer list)
		await page.mouse.move(
			targetBox.x + targetBox.width / 2,
			targetBox.y + targetBox.height / 2,
			{ steps: 40 } // Smooth movement
		);

		// Wait a frame to flush any pending throttled update from the glide, then re-issue a single
		// move at the exact target coordinates and wait one more frame for it to be processed
		await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
		await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2);
		await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));

		// Wait for the dragged item to move by checking the drag state changes to ptr-drag
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag');

		// Verify the peer list shows a placeholder for the incoming item
		const doingPlaceholder = doingList.locator('.ssl-placeholder');
		await expect(doingPlaceholder).toBeVisible();

		// Release the mouse to drop
		await page.mouse.up();

		// Wait for the drag operation to complete by checking the drag state returns to idle
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify To Do Item 1 was removed from the «To Do» list
		const toDoItemsAfterDrag = await toDoList
			.locator('.ssl-item .ssl-item-content__text')
			.allTextContents();
		expect(toDoItemsAfterDrag).toEqual(listItemTexts['to-do'].slice(1));

		// Verify To Do Item 1 was inserted into the «Doing» list right before Doing Item 2
		const doingItemsAfterDrag = await doingList
			.locator('.ssl-item .ssl-item-content__text')
			.allTextContents();
		expect(doingItemsAfterDrag).toEqual([
			'Doing Item 1',
			'To Do Item 1',
			'Doing Item 2',
			'Doing Item 3',
		]);

		// Verify the «Done» list remains unaffected
		const doneList = page.locator('[data-list-id="done"]');
		expect(await doneList.locator('.ssl-item .ssl-item-content__text').allTextContents()).toEqual(
			listItemTexts['done']
		);

		// Verify the item counts displayed in each list header were updated accordingly
		await expect(page.locator('.list:has([data-list-id="to-do"]) .list__header span')).toHaveText(
			'4'
		);
		await expect(page.locator('.list:has([data-list-id="doing"]) .list__header span')).toHaveText(
			'4'
		);
		await expect(page.locator('.list:has([data-list-id="done"]) .list__header span')).toHaveText(
			'4'
		);
	});

	test('should move an item into an empty peer list using mouse', async ({ page }) => {
		// Find the «Doing» and «Done» list roots
		const doingList = page.locator('[data-list-id="doing"]');
		const doneList = page.locator('[data-list-id="done"]');

		// Empty the «Doing» list by moving each of its items onto the «To Do» list,
		// always targeting the first remaining item so the drag operation stays simple
		const toDoList = page.locator('[data-list-id="to-do"]');
		for (let i = 0; i < listItemTexts['doing'].length; i++) {
			const draggedItem = doingList.locator('.ssl-item:not(.ssl-placeholder)').first();
			const targetItem = toDoList.locator('.ssl-item:not(.ssl-placeholder)').first();

			// Scroll both items into view before reading their bounding boxes
			await draggedItem.scrollIntoViewIfNeeded();
			await targetItem.scrollIntoViewIfNeeded();

			const draggedBox = await draggedItem.boundingBox();
			const targetBox = await targetItem.boundingBox();
			if (!draggedBox || !targetBox)
				throw new Error('Could not get Doing or To Do item bounding box');

			await page.mouse.move(
				draggedBox.x + draggedBox.width / 2,
				draggedBox.y + draggedBox.height / 2
			);
			await page.mouse.down();
			await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag-start');
			await page.mouse.move(
				targetBox.x + targetBox.width / 2,
				targetBox.y + targetBox.height / 2,
				{ steps: 40 } // Smooth movement
			);

			// Wait a frame to flush any pending throttled update from the glide, then re-issue a single
			// move at the exact target coordinates and wait one more frame for it to be processed
			await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
			await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2);
			await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));

			await page.mouse.up();
			await expect(doingList.locator('.ssl-item')).toHaveCount(
				listItemTexts['doing'].length - i - 1
			);
		}

		// Verify the «Doing» list is now empty
		await expect(doingList.locator('.ssl-item')).toHaveCount(0);

		// Verify the «Doing» list still occupies space and can be targeted (it doesn't collapse)
		const emptyListBox = await doingList.boundingBox();
		if (!emptyListBox) throw new Error('Could not get the empty Doing list bounding box');
		expect(emptyListBox.height).toBeGreaterThan(0);

		// Find the dragged item (Done Item 1)
		const draggedItem = page.locator('[data-item-id="done-item-1"]:not(.ssl-placeholder)');

		// Scroll the dragged item into view before reading its bounding box
		await draggedItem.scrollIntoViewIfNeeded();
		const draggedBox = await draggedItem.boundingBox();
		if (!draggedBox) throw new Error('Could not get Done Item 1 bounding box');

		// Start the drag from the center of the dragged item
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			draggedBox.y + draggedBox.height / 2
		);
		await page.mouse.down();
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag-start');

		// Move over the now empty «Doing» list
		const doingBox = await doingList.boundingBox();
		if (!doingBox) throw new Error('Could not get the empty Doing list bounding box');
		await page.mouse.move(
			doingBox.x + doingBox.width / 2,
			doingBox.y + doingBox.height / 2,
			{ steps: 40 } // Smooth movement
		);

		// Wait a frame to flush any pending throttled update from the glide, then re-issue a
		// single move at the exact target coordinates and wait one more frame for it to be
		// processed — see the note in the previous test's cross-list move.
		await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
		await page.mouse.move(doingBox.x + doingBox.width / 2, doingBox.y + doingBox.height / 2);
		await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));

		await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag');

		// Release the mouse to drop
		await page.mouse.up();
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify Done Item 1 was removed from the «Done» list
		const doneItemsAfterDrag = await doneList
			.locator('.ssl-item .ssl-item-content__text')
			.allTextContents();
		expect(doneItemsAfterDrag).toEqual(listItemTexts['done'].slice(1));

		// Verify Done Item 1 is now the only item in the «Doing» list
		const doingItemsAfterDrag = await doingList
			.locator('.ssl-item .ssl-item-content__text')
			.allTextContents();
		expect(doingItemsAfterDrag).toEqual(['Done Item 1']);
	});

	test('should keep an item in its original list when dropped outside of all lists', async ({
		page,
	}) => {
		// Find the «To Do», «Doing» and «Done» list roots
		const toDoList = page.locator('[data-list-id="to-do"]');
		const doingList = page.locator('[data-list-id="doing"]');
		const doneList = page.locator('[data-list-id="done"]');
		const doneListBox = await doneList.boundingBox();
		if (!doneListBox) throw new Error('Could not get Done List bounding box');

		// Get the initial order of the items in every list to verify the starting state
		const initialToDoItems = await toDoList
			.locator('.ssl-item .ssl-item-content__text')
			.allTextContents();
		const initialDoingItems = await doingList
			.locator('.ssl-item .ssl-item-content__text')
			.allTextContents();
		const initialDoneItems = await doneList
			.locator('.ssl-item .ssl-item-content__text')
			.allTextContents();

		// Get the viewport size
		const viewport = page.viewportSize();
		if (!viewport) throw new Error('Could not get viewport size');

		// Find the dragged item (Done Item 1)
		const draggedItem = doneList.locator('[data-item-id="done-item-1"]:not(.ssl-placeholder)');

		// Scroll the dragged item into view before reading its bounding box — see the note in the
		// same-list reorder test above.
		await draggedItem.scrollIntoViewIfNeeded();
		const draggedBox = await draggedItem.boundingBox();
		if (!draggedBox) throw new Error('Could not get Done Item 1 bounding box');

		// Start the drag from the center of the dragged item
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			draggedBox.y + draggedBox.height / 2
		);
		await page.mouse.down();
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag-start');

		// Move well below every list, outside the bounds of the entire group
		await page.mouse.move(
			doneListBox.x + doneListBox.width + draggedBox.width / 2 + 20,
			draggedBox.y + draggedBox.height / 2,
			{ steps: 40 } // Smooth movement
		);

		// Release the mouse to drop
		await page.mouse.up();

		// Wait for the drag operation to complete by checking the drag state returns to idle
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify all three lists remain unchanged
		expect(await toDoList.locator('.ssl-item .ssl-item-content__text').allTextContents()).toEqual(
			initialToDoItems
		);
		expect(await doingList.locator('.ssl-item .ssl-item-content__text').allTextContents()).toEqual(
			initialDoingItems
		);
		expect(await doneList.locator('.ssl-item .ssl-item-content__text').allTextContents()).toEqual(
			initialDoneItems
		);
	});

	test('should move an item from one list to another list using keyboard', async ({ page }) => {
		// Find the «To Do» and «Doing» list roots
		const toDoList = page.locator('[data-list-id="to-do"]');
		const doingList = page.locator('[data-list-id="doing"]');

		// Focus the «To Do» root and select its first item (To Do Item 1)
		await toDoList.focus();
		await page.keyboard.press('ArrowDown');
		const draggedItem = page.locator('[data-item-id="to-do-item-1"]:not(.ssl-placeholder)');
		await expect(draggedItem).toBeFocused();

		// Start dragging with the Space key
		await page.keyboard.press('Space');
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'kbd-drag-start');

		// Verify the «To Do» list is flagged as the drag source, and «Doing» isn’t yet a target
		await expect(toDoList).toHaveAttribute('data-is-source', 'true');
		await expect(doingList).not.toHaveAttribute('data-is-target', 'true');

		// Move right — the axis perpendicular to a vertical list — to target the «Doing» peer list
		await page.keyboard.press('ArrowRight');

		// Verify «Doing» is now flagged as the target, and shows a placeholder for the incoming item
		await expect(doingList).toHaveAttribute('data-is-target', 'true');
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'kbd-drag');
		await expect(doingList.locator('.ssl-placeholder')).toBeVisible();

		// Drop the item with the Space key
		await page.keyboard.press('Space');
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify To Do Item 1 was removed from the «To Do» list
		const toDoItemsAfterDrag = await toDoList
			.locator('.ssl-item .ssl-item-content__text')
			.allTextContents();
		expect(toDoItemsAfterDrag).toEqual(listItemTexts['to-do'].slice(1));

		// Verify To Do Item 1 was inserted into the «Doing» list, and the original three items
		// kept their relative order
		const doingItemsAfterDrag = await doingList
			.locator('.ssl-item .ssl-item-content__text')
			.allTextContents();
		expect(doingItemsAfterDrag).toHaveLength(4);
		expect(doingItemsAfterDrag).toContain('To Do Item 1');
		expect(doingItemsAfterDrag.filter((text) => text !== 'To Do Item 1')).toEqual(
			listItemTexts['doing']
		);

		// Verify the moved item retained focus after crossing into its new list
		await expect(draggedItem).toBeFocused();

		// Verify neither list is still flagged as source or target once the drag has ended
		await expect(toDoList).not.toHaveAttribute('data-is-source', 'true');
		await expect(doingList).not.toHaveAttribute('data-is-target', 'true');
	});

	test('should navigate focus across peer lists using arrow keys without dragging', async ({
		page,
	}) => {
		// Find the «To Do», «Doing» and «Done» list roots
		const toDoList = page.locator('[data-list-id="to-do"]');
		const doingList = page.locator('[data-list-id="doing"]');
		const doneList = page.locator('[data-list-id="done"]');

		// Focus the «To Do» root and select its first item
		await toDoList.focus();
		await page.keyboard.press('ArrowDown');
		await expect(toDoList.locator('[data-item-id="to-do-item-1"]')).toBeFocused();

		// Attempting to move left from the first list in the group should have no effect
		await page.keyboard.press('ArrowLeft');
		await expect(toDoList.locator('[data-item-id="to-do-item-1"]')).toBeFocused();

		// Move right to focus the closest item in the «Doing» peer list
		await page.keyboard.press('ArrowRight');
		await expect(doingList.locator('.ssl-item[aria-selected="true"]')).toBeFocused();

		// Move right again to focus the closest item in the «Done» peer list
		await page.keyboard.press('ArrowRight');
		await expect(doneList.locator('.ssl-item[aria-selected="true"]')).toBeFocused();

		// Attempting to move right from the last list in the group should have no effect
		await page.keyboard.press('ArrowRight');
		await expect(doneList.locator('.ssl-item[aria-selected="true"]')).toBeFocused();

		// Move left to go back to the «Doing» peer list
		await page.keyboard.press('ArrowLeft');
		await expect(doingList.locator('.ssl-item[aria-selected="true"]')).toBeFocused();
	});

	test('should move an item into an empty peer list using keyboard', async ({ page }) => {
		// Find the «Doing» and «Done» list roots
		const doingList = page.locator('[data-list-id="doing"]');
		const doneList = page.locator('[data-list-id="done"]');

		// Empty the «Doing» list by moving each of its items onto the «To Do» list using mouse —
		// see the note in the mouse version of this test above regarding scrollIntoViewIfNeeded.
		const toDoList = page.locator('[data-list-id="to-do"]');
		for (let i = 0; i < listItemTexts['doing'].length; i++) {
			const draggedItem = doingList.locator('.ssl-item:not(.ssl-placeholder)').first();
			const targetItem = toDoList.locator('.ssl-item:not(.ssl-placeholder)').first();

			await draggedItem.scrollIntoViewIfNeeded();
			await targetItem.scrollIntoViewIfNeeded();

			const draggedBox = await draggedItem.boundingBox();
			const targetBox = await targetItem.boundingBox();
			if (!draggedBox || !targetBox)
				throw new Error('Could not get Doing or To Do item bounding box');

			await page.mouse.move(
				draggedBox.x + draggedBox.width / 2,
				draggedBox.y + draggedBox.height / 2
			);
			await page.mouse.down();
			await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag-start');
			await page.mouse.move(
				targetBox.x + targetBox.width / 2,
				targetBox.y + targetBox.height / 2,
				{ steps: 40 } // Smooth movement
			);

			// Wait a frame to flush any pending throttled update from the glide, then re-issue a
			// single move at the exact target coordinates and wait one more frame for it to be
			// processed — see the note in the previous cross-list move test.
			await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
			await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2);
			await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));

			await page.mouse.up();
			await expect(doingList.locator('.ssl-item')).toHaveCount(
				listItemTexts['doing'].length - i - 1
			);
		}

		// Verify the «Doing» list is now empty
		await expect(doingList.locator('.ssl-item')).toHaveCount(0);

		// Focus the «Done» root and select its first item (Done Item 1)
		await doneList.focus();
		await page.keyboard.press('ArrowDown');
		const draggedItem = page.locator('[data-item-id="done-item-1"]:not(.ssl-placeholder)');
		await expect(draggedItem).toBeFocused();

		// Start dragging with the Space key
		await page.keyboard.press('Space');
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'kbd-drag-start');

		// Move left once to reach the now empty «Doing» peer list
		await page.keyboard.press('ArrowLeft');
		await expect(doingList).toHaveAttribute('data-is-target', 'true');
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'kbd-drag');

		// Verify the «Doing» list still occupies space and shows a placeholder for the incoming item
		const doingBox = await doingList.boundingBox();
		if (!doingBox) throw new Error('Could not get the empty Doing list bounding box');
		expect(doingBox.height).toBeGreaterThan(0);
		await expect(doingList.locator('.ssl-placeholder')).toBeVisible();

		// Drop the item with the Space key
		await page.keyboard.press('Space');
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify Done Item 1 was removed from the «Done» list
		const doneItemsAfterDrag = await doneList
			.locator('.ssl-item .ssl-item-content__text')
			.allTextContents();
		expect(doneItemsAfterDrag).toEqual(listItemTexts['done'].slice(1));

		// Verify Done Item 1 is now the only item in the «Doing» list
		const doingItemsAfterDrag = await doingList
			.locator('.ssl-item .ssl-item-content__text')
			.allTextContents();
		expect(doingItemsAfterDrag).toEqual(['Done Item 1']);
	});

	test('should target the closest item when moving into a shorter peer list using keyboard', async ({
		page,
	}) => {
		// Find the «To Do» and «Doing» list roots
		const toDoList = page.locator('[data-list-id="to-do"]');
		const doingList = page.locator('[data-list-id="doing"]');

		// Focus the «To Do» root and jump to its last item (To Do Item 5) — «Doing» only has
		// three items, so the closest item to To Do Item 5’s position is Doing Item 3
		await toDoList.focus();
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('End');
		const draggedItem = page.locator('[data-item-id="to-do-item-5"]:not(.ssl-placeholder)');
		await expect(draggedItem).toBeFocused();

		// Start dragging with the Space key
		await page.keyboard.press('Space');
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'kbd-drag-start');

		// Move right to target the «Doing» peer list
		await page.keyboard.press('ArrowRight');
		await expect(doingList).toHaveAttribute('data-is-target', 'true');
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'kbd-drag');

		// Drop the item with the Space key
		await page.keyboard.press('Space');
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify To Do Item 5 was removed from the «To Do» list
		const toDoItemsAfterDrag = await toDoList
			.locator('.ssl-item .ssl-item-content__text')
			.allTextContents();
		expect(toDoItemsAfterDrag).toEqual(listItemTexts['to-do'].slice(0, 4));

		// Verify To Do Item 5 was inserted right before Doing Item 3, its closest item, rather
		// than being clamped to an out-of-range position
		const doingItemsAfterDrag = await doingList
			.locator('.ssl-item .ssl-item-content__text')
			.allTextContents();
		expect(doingItemsAfterDrag).toEqual([
			'Doing Item 1',
			'Doing Item 2',
			'To Do Item 5',
			'Doing Item 3',
		]);
	});

	test('should end an in-flight peer drop transition when starting a new drag on another list using pointer', async ({
		page,
	}) => {
		// Find the «To Do», «Doing» and «Done» list roots
		const toDoList = page.locator('[data-list-id="to-do"]');
		const doingList = page.locator('[data-list-id="doing"]');

		// Drag To Do Item 1 into the «Doing» list — see the note in the cross-list mouse test
		// above regarding the rAF-flush before reading the target's bounding box.
		const draggedItem1 = page.locator('[data-item-id="to-do-item-1"]:not(.ssl-placeholder)');
		const targetItem = doingList.locator('[data-item-id="doing-item-1"]:not(.ssl-placeholder)');
		const draggedBox = await draggedItem1.boundingBox();
		const targetBox = await targetItem.boundingBox();
		if (!draggedBox || !targetBox)
			throw new Error('Could not get To Do Item 1 or Doing Item 1 bounding box');

		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			draggedBox.y + draggedBox.height / 2
		);
		await page.mouse.down();
		await expect(draggedItem1).toHaveAttribute('data-drag-state', 'ptr-drag-start');
		await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, {
			steps: 40,
		});
		await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
		await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2);
		await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
		await page.mouse.up();

		// Verify the drop transition is under way — still mid-flight, not yet idle
		await expect(draggedItem1).toHaveAttribute('data-drag-state', 'ptr-drop');

		// Without waiting for the 320ms transition to finish, immediately start a new drag on
		// the «Done» list — a peer that wasn’t involved in the first move
		const draggedItem2 = doingList.locator('[data-item-id="doing-item-1"]:not(.ssl-placeholder)');
		const draggedBox2 = await draggedItem2.boundingBox();
		if (!draggedBox2) throw new Error('Could not get Doing Item 1 bounding box');

		const startTime = Date.now();
		await page.mouse.move(
			draggedBox2.x + draggedBox2.width / 2,
			draggedBox2.y + draggedBox2.height / 2
		);
		await page.mouse.down();

		// Verify the interrupted peer transition settles to idle well before its 320ms duration
		await expect(draggedItem1).toHaveAttribute('data-drag-state', 'idle');
		expect(Date.now() - startTime).toBeLessThan(240);

		// Verify the first move completed correctly in spite of the interruption
		await expect(toDoList.locator('[data-item-id="to-do-item-1"]')).toHaveCount(0);
		await expect(doingList.locator('[data-item-id="to-do-item-1"]')).toBeVisible();

		// Verify the new drag on «Done» started normally
		await expect(draggedItem2).toHaveAttribute('data-drag-state', 'ptr-drag-start');

		// Drop it back in place to leave the page in a clean state
		await page.mouse.up();
		await expect(draggedItem2).toHaveAttribute('data-drag-state', 'idle');
	});

	test('should end an in-flight peer drop transition when starting a new drag on another list using keyboard', async ({
		page,
	}) => {
		// Find the «To Do», «Doing» and «Done» list roots
		const toDoList = page.locator('[data-list-id="to-do"]');
		const doingList = page.locator('[data-list-id="doing"]');
		const doneList = page.locator('[data-list-id="done"]');

		// Drag To Do Item 1 into the «Doing» list using the keyboard
		await toDoList.focus();
		await page.keyboard.press('ArrowDown');
		const draggedItem = page.locator('[data-item-id="to-do-item-1"]:not(.ssl-placeholder)');
		await page.keyboard.press('Space');
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'kbd-drag-start');
		await page.keyboard.press('ArrowRight');
		await expect(doingList).toHaveAttribute('data-is-target', 'true');
		await page.keyboard.press('Space');

		// Verify the drop transition is under way — still mid-flight, not yet idle
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'kbd-drop');

		// Without waiting for the 320ms transition to finish, immediately focus the «Done» list —
		// a peer that wasn’t involved in the first move. `interruptDropTransition()` runs on every
		// keydown, so this first ArrowDown is what interrupts the pending transition.
		await doneList.focus();
		const startTime = Date.now();
		await page.keyboard.press('ArrowDown');

		// Verify the interrupted peer transition settles to idle well before its 320ms duration
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');
		expect(Date.now() - startTime).toBeLessThan(240);

		// Verify the first move completed correctly in spite of the interruption
		await expect(toDoList.locator('[data-item-id="to-do-item-1"]')).toHaveCount(0);
		await expect(doingList.locator('[data-item-id="to-do-item-1"]')).toBeVisible();

		// Verify «Done» received focus normally and can now start its own drag
		const doneDraggedItem = doneList.locator('[data-item-id="done-item-1"]:not(.ssl-placeholder)');
		await expect(doneDraggedItem).toBeFocused();
		await page.keyboard.press('Space');
		await expect(doneDraggedItem).toHaveAttribute('data-drag-state', 'kbd-drag-start');

		// Drop it back in place to leave the page in a clean state
		await page.keyboard.press('Space');
		await expect(doneDraggedItem).toHaveAttribute('data-drag-state', 'idle');
	});

	test('should navigate from the dropped item’s new position when pressing an arrow key before the peer drop transition finishes', async ({
		page,
	}) => {
		// Find the «To Do» and «Doing» list roots
		const toDoList = page.locator('[data-list-id="to-do"]');
		const doingList = page.locator('[data-list-id="doing"]');

		// Focus the «To Do» root and select its third item (To Do Item 3)
		await toDoList.focus();
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('ArrowDown');
		const draggedItem = page.locator('[data-item-id="to-do-item-3"]:not(.ssl-placeholder)');
		await expect(draggedItem).toBeFocused();

		// Start dragging with the Space key and move right to target the «Doing» peer list
		await page.keyboard.press('Space');
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'kbd-drag-start');
		await page.keyboard.press('ArrowRight');
		await expect(doingList).toHaveAttribute('data-is-target', 'true');

		// Drop the item with the Space key
		await page.keyboard.press('Space');

		// Verify the drop transition is under way — still mid-flight, not yet idle
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'kbd-drop');

		// Without waiting for the 320ms transition to finish, press ArrowDown while the dropped item
		// still has focus. This interrupts the transition, and the item crosses into «Doing» at once.
		await page.keyboard.press('ArrowDown');
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify To Do Item 3 landed in the «Doing» list right after Doing Item 2
		const doingItemsAfterDrag = await doingList
			.locator('.ssl-item .ssl-item-content__text')
			.allTextContents();
		expect(doingItemsAfterDrag).toEqual([
			'Doing Item 1',
			'Doing Item 2',
			'To Do Item 3',
			'Doing Item 3',
		]);

		// Verify focus moved to the item below To Do Item 3 in its new list, not to an item in «To Do»
		await expect(doingList.locator('[data-item-id="doing-item-3"]')).toBeFocused();

		// Verify only the focused item is selected, and «To Do» no longer points at the item it lost
		await expect(page.locator('.ssl-item[aria-selected="true"]')).toHaveCount(1);
		await expect(toDoList).not.toHaveAttribute('aria-activedescendant');
		await expect(doingList).toHaveAttribute('aria-activedescendant', 'doing-item-3');
	});

	test('should take over a keyboard drag in one list with a pointer click/tap on a peer list', async ({
		page,
	}) => {
		// Find the «To Do» and «Doing» list roots
		const toDoList = page.locator('[data-list-id="to-do"]');
		const doingList = page.locator('[data-list-id="doing"]');

		// Get the initial order of the items to verify the starting state
		const initialToDoItems = await toDoList
			.locator('.ssl-item .ssl-item-content__text')
			.allTextContents();
		const initialDoingItems = await doingList
			.locator('.ssl-item .ssl-item-content__text')
			.allTextContents();
		expect(initialToDoItems).toEqual(listItemTexts['to-do']);
		expect(initialDoingItems).toEqual(listItemTexts['doing']);

		// Get the bounding box of Doing Item 2 before anything moves
		const doingItem2Box = await doingList
			.locator('[data-item-id="doing-item-2"]:not(.ssl-placeholder)')
			.boundingBox();
		if (!doingItem2Box) throw new Error('Could not get Doing Item 2 bounding box');

		// Focus the «To Do» root and select its first item (To Do Item 1)
		await toDoList.focus();
		await page.keyboard.press('ArrowDown');
		const keyboardItem = toDoList.locator('[data-item-id="to-do-item-1"]:not(.ssl-placeholder)');
		await expect(keyboardItem).toBeFocused();

		// Start dragging with the Space key
		await page.keyboard.press('Space');

		// Move right — the axis perpendicular to a vertical list — to target the «Doing» peer list
		await page.keyboard.press('ArrowRight');
		await expect(keyboardItem).toHaveAttribute('data-drag-state', 'kbd-drag');
		await expect(doingList).toHaveAttribute('data-is-target', 'true');

		// Wait for Doing Item 1 to finish shifting down one slot (to the Doing Item 2 position) to make
		// room for To Do Item 1, otherwise the press below could land on To Do Item 1 instead
		const pointerItem = doingList.locator('[data-item-id="doing-item-1"]:not(.ssl-placeholder)');
		await expect
			.poll(async () => (await pointerItem.boundingBox())?.y)
			.toBeCloseTo(doingItem2Box.y, 0);

		// Get the bounding box of Doing Item 1 for a precise press
		const pointerBox = await pointerItem.boundingBox();
		if (!pointerBox) throw new Error('Could not get Doing Item 1 bounding box');

		// Press the mouse down near the left edge of Doing Item 1 while To Do Item 1 is still being
		// dragged with the keyboard (its center falls inside the auto-scroll zone on narrow screens)
		const pressX = pointerBox.x + 16;
		const pressY = pointerBox.y + pointerBox.height / 2;
		await page.mouse.move(pressX, pressY);
		await page.mouse.down();

		// Verify the keyboard drag was canceled and To Do Item 1 lost focus
		await expect(keyboardItem).toHaveAttribute('data-drag-state', 'idle');
		await expect(keyboardItem).not.toBeFocused();

		// Verify «Doing» is no longer flagged as the target, and its placeholder for To Do Item 1 is gone
		await expect(doingList).toHaveAttribute('data-is-target', 'false');
		await expect(doingList.locator('.ssl-placeholder[data-item-id="to-do-item-1"]')).toHaveCount(0);

		// Wait for the pointer drag to start on this same press by checking the drag state
		await expect(pointerItem).toHaveAttribute('data-drag-state', 'ptr-drag-start');

		// Find the target item (Doing Item 3) and wait for it to settle back after the canceled hover
		const targetItem = doingList.locator('[data-item-id="doing-item-3"]:not(.ssl-placeholder)');
		await expect
			.poll(() => targetItem.evaluate((item) => getComputedStyle(item).transform))
			.toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);

		// Get the bounding boxes for a precise drag operation
		const settledPointerBox = await pointerItem.boundingBox();
		const targetBox = await targetItem.boundingBox();
		if (!settledPointerBox || !targetBox)
			throw new Error('Could not get Doing Item 1 or Doing Item 3 bounding box');

		// Move by the distance between Doing Item 1 and Doing Item 3 to reach the target position
		await page.mouse.move(
			pressX + (targetBox.x - settledPointerBox.x),
			pressY + (targetBox.y - settledPointerBox.y),
			{ steps: 40 } // Smooth movement
		);

		// Release the mouse to drop
		await page.mouse.up();

		// Wait for the drag operation to complete by checking the drag state returns to idle
		await expect(pointerItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify the «To Do» list remains unaffected
		await expect(toDoList.locator('.ssl-item .ssl-item-content__text')).toHaveText(
			initialToDoItems
		);

		// Verify the order within the «Doing» list after the drag
		await expect(doingList.locator('.ssl-item .ssl-item-content__text')).toHaveText(
			sortItems(initialDoingItems, 0, 2)
		);
	});

	test('should read correct announcements when moving an item into a peer list using Home and End keys', async ({
		page,
	}) => {
		// Find the «To Do» and «Doing» list roots
		const toDoList = page.locator('[data-list-id="to-do"]');
		const doingList = page.locator('[data-list-id="doing"]');

		// Find the ARIA live region of the «To Do» list (the source list does the announcing)
		const liveRegion = page.locator('.ssl-live-region').first();

		// Focus the «To Do» root and select its first item (To Do Item 1)
		await toDoList.focus();
		await page.keyboard.press('ArrowDown');
		const draggedItem = toDoList.locator('[data-item-id="to-do-item-1"]:not(.ssl-placeholder)');
		await expect(draggedItem).toBeFocused();

		// Start dragging with the Space key
		await page.keyboard.press('Space');

		// Move right — the axis perpendicular to a vertical list — to target the «Doing» peer list
		await page.keyboard.press('ArrowRight');
		await expect(doingList).toHaveAttribute('data-is-target', 'true');
		// Verify the announcer reads the position inside the «Doing» list
		await expect(liveRegion).toHaveText(
			'You have moved the item from position 1 in To Do list to position 1 in Doing list.'
		);

		// Move to the end of the «Doing» list (after its three items) with the End key
		await page.keyboard.press('End');
		// Verify the announcer reads the last position of the «Doing» list
		await expect(liveRegion).toHaveText(
			'You have moved the item from position 1 in To Do list to position 4 in Doing list.'
		);

		// Move back to the start of the «Doing» list with the Home key
		await page.keyboard.press('Home');
		// Verify the announcer reads the first position of the «Doing» list
		await expect(liveRegion).toHaveText(
			'You have moved the item from position 1 in To Do list to position 1 in Doing list.'
		);

		// Move to the end of the «Doing» list again and drop the item with the Space key
		await page.keyboard.press('End');
		await page.keyboard.press('Space');
		// Verify the announcer reads the dropped announcement with the position inside the «Doing» list
		await expect(liveRegion).toHaveText(
			'You have dropped the item. It has moved from position 1 in To Do list to position 4 in Doing list.'
		);

		// Verify To Do Item 1 was inserted at the end of the «Doing» list
		await expect(doingList.locator('.ssl-item .ssl-item-content__text')).toHaveText([
			...listItemTexts['doing'],
			'To Do Item 1',
		]);
	});

	test('should release the peer list when canceling a keyboard drag with the Escape key', async ({
		page,
	}) => {
		// Find the «To Do» and «Doing» list roots
		const toDoList = page.locator('[data-list-id="to-do"]');
		const doingList = page.locator('[data-list-id="doing"]');

		// Get the initial order of the items to verify the starting state
		const initialToDoItems = await toDoList
			.locator('.ssl-item .ssl-item-content__text')
			.allTextContents();
		const initialDoingItems = await doingList
			.locator('.ssl-item .ssl-item-content__text')
			.allTextContents();
		expect(initialToDoItems).toEqual(listItemTexts['to-do']);
		expect(initialDoingItems).toEqual(listItemTexts['doing']);

		// Focus the «To Do» root and select its first item (To Do Item 1)
		await toDoList.focus();
		await page.keyboard.press('ArrowDown');
		const draggedItem = toDoList.locator('[data-item-id="to-do-item-1"]:not(.ssl-placeholder)');
		await expect(draggedItem).toBeFocused();

		// Start dragging with the Space key
		await page.keyboard.press('Space');

		// Move right — the axis perpendicular to a vertical list — to target the «Doing» peer list
		await page.keyboard.press('ArrowRight');
		await expect(doingList).toHaveAttribute('data-is-target', 'true');
		await expect(doingList.locator('.ssl-placeholder')).toBeVisible();

		// Cancel the drag operation with the Escape key
		await page.keyboard.press('Escape');

		// Wait for cancel to start by checking the drag state changes to kbd-cancel
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'kbd-cancel');

		// Verify the «Doing» list was released right away, while the item is still returning home
		expect(await doingList.getAttribute('data-is-target')).toBe('false');

		// Wait for the drag operation to complete by checking the drag state returns to idle
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify the «Doing» placeholder is gone and both lists are unchanged
		await expect(doingList.locator('.ssl-placeholder')).toHaveCount(0);
		await expect(toDoList.locator('.ssl-item .ssl-item-content__text')).toHaveText(
			initialToDoItems
		);
		await expect(doingList.locator('.ssl-item .ssl-item-content__text')).toHaveText(
			initialDoingItems
		);

		// Verify To Do Item 1 kept the focus
		await expect(draggedItem).toBeFocused();
	});

	test('should clean up after itself when a list is destroyed during a drag', async ({ page }) => {
		// Collect the errors thrown by the page, e.g. by callbacks running after the lists are destroyed
		const pageErrors: string[] = [];
		page.on('pageerror', (error) => pageErrors.push(error.message));

		// Find the «To Do» and «Doing» list roots
		const toDoList = page.locator('[data-list-id="to-do"]');
		const doingList = page.locator('[data-list-id="doing"]');

		// Find the dragged item (To Do Item 1) and the target item (Doing Item 2)
		const draggedItem = toDoList.locator('[data-item-id="to-do-item-1"]:not(.ssl-placeholder)');
		const targetItem = doingList.locator('[data-item-id="doing-item-2"]:not(.ssl-placeholder)');

		// Get the bounding boxes for a precise drag operation
		const draggedBox = await draggedItem.boundingBox();
		const targetBox = await targetItem.boundingBox();
		if (!draggedBox || !targetBox)
			throw new Error('Could not get To Do Item 1 or Doing Item 2 bounding box');

		// Start the drag from the center of the dragged item
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			draggedBox.y + draggedBox.height / 2
		);

		// Press the mouse down to start dragging
		await page.mouse.down();

		// Wait for the drag operation to start by checking the drag state
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag-start');

		// Move to the target position (left side of Doing Item 2, clear of the auto-scroll zone on
		// narrow screens)
		await page.mouse.move(
			targetBox.x + 16,
			targetBox.y + targetBox.height / 2,
			{ steps: 40 } // Smooth movement
		);

		// Verify «Doing» is flagged as the target, and shows a placeholder for the incoming item
		await expect(doingList).toHaveAttribute('data-is-target', 'true');
		await expect(doingList.locator('.ssl-placeholder')).toBeVisible();

		// Navigate to another page while the drag is still in progress, destroying both lists
		// (a synthetic click on the menu link, since the mouse is still held down)
		await page
			.locator('a.link[href="/multiple-groups"]')
			.evaluate((link) => (link as HTMLElement).click());
		await expect(page.locator('[data-list-id="backlog"]')).toBeVisible();

		// Release the mouse
		await page.mouse.up();

		// Navigate back to the «Multiple lists» page
		await page
			.locator('a.link[href="/multiple-lists"]')
			.evaluate((link) => (link as HTMLElement).click());
		await expect(toDoList).toBeVisible();

		// Verify no list is still flagged as source or target, and no placeholder was left behind
		await expect(toDoList).toHaveAttribute('data-is-source', 'false');
		await expect(doingList).toHaveAttribute('data-is-target', 'false');
		await expect(page.locator('.ssl-placeholder')).toHaveCount(0);

		// Verify a new drag works as usual
		await toDoList.focus();
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('Space');
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'kbd-drag-start');
		await page.keyboard.press('Escape');
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify nothing threw along the way
		expect(pageErrors).toEqual([]);
	});

	test('should not target a locked peer list when dragging over it using mouse', async ({
		page,
	}) => {
		// Find the «To Do» and «Doing» list roots
		const toDoList = page.locator('[data-list-id="to-do"]');
		const doingList = page.locator('[data-list-id="doing"]');

		// Lock the «Doing» list through the demo controls
		await page.locator('.list:has([data-list-id="doing"]) select').selectOption('locked');
		await expect(doingList).toHaveAttribute('data-is-locked', 'true');

		// Find the dragged item (To Do Item 1) and the item to hover in the peer list (Doing Item 2)
		const draggedItem = page.locator('[data-item-id="to-do-item-1"]:not(.ssl-placeholder)');
		const hoveredItem = doingList.locator('[data-item-id="doing-item-2"]:not(.ssl-placeholder)');

		// Scroll both items into view before reading their bounding boxes
		await draggedItem.scrollIntoViewIfNeeded();
		await hoveredItem.scrollIntoViewIfNeeded();

		// Get the bounding boxes for a precise drag operation
		const draggedBox = await draggedItem.boundingBox();
		const hoveredBox = await hoveredItem.boundingBox();
		if (!draggedBox || !hoveredBox)
			throw new Error('Could not get To Do Item 1 or Doing Item 2 bounding box');

		// Start the drag from the center of the dragged item
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			draggedBox.y + draggedBox.height / 2
		);
		await page.mouse.down();
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag-start');

		// Move over the center of Doing Item 2, inside the locked peer list
		await page.mouse.move(
			hoveredBox.x + hoveredBox.width / 2,
			hoveredBox.y + hoveredBox.height / 2,
			{ steps: 40 } // Smooth movement
		);
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag');

		// Give the list a couple of frames to react to the last pointer position
		await page.evaluate(
			() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
		);

		// Verify the locked list was never flagged as the target and shows no placeholder
		await expect(doingList).not.toHaveAttribute('data-is-target', 'true');
		await expect(doingList.locator('.ssl-placeholder')).toHaveCount(0);

		// Release the mouse to drop
		await page.mouse.up();
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify both lists kept their items
		expect(await toDoList.locator('.ssl-item .ssl-item-content__text').allTextContents()).toEqual(
			listItemTexts['to-do']
		);
		expect(await doingList.locator('.ssl-item .ssl-item-content__text').allTextContents()).toEqual(
			listItemTexts['doing']
		);
	});

	test('should skip locked and disabled peer lists when moving an item across lists using keyboard', async ({
		page,
	}) => {
		// Find the «To Do», «Doing» and «Done» list roots
		const toDoList = page.locator('[data-list-id="to-do"]');
		const doingList = page.locator('[data-list-id="doing"]');
		const doneList = page.locator('[data-list-id="done"]');

		// Disable the «Doing» list through the demo controls
		await page.locator('.list:has([data-list-id="doing"]) select').selectOption('disabled');
		await expect(doingList).toHaveAttribute('data-is-disabled', 'true');

		// Focus the «To Do» root, select its first item and start dragging with the Space key
		await toDoList.focus();
		await page.keyboard.press('ArrowDown');
		const draggedItem = page.locator('[data-item-id="to-do-item-1"]:not(.ssl-placeholder)');
		await expect(draggedItem).toBeFocused();
		await page.keyboard.press('Space');
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'kbd-drag-start');

		// Move right and verify the disabled «Doing» list was skipped in favor of «Done»
		await page.keyboard.press('ArrowRight');
		await expect(doneList).toHaveAttribute('data-is-target', 'true');
		await expect(doneList.locator('.ssl-placeholder')).toBeVisible();
		await expect(doingList).not.toHaveAttribute('data-is-target', 'true');
		await expect(doingList.locator('.ssl-placeholder')).toHaveCount(0);

		// Move left and verify the item went straight back to its own list
		await page.keyboard.press('ArrowLeft');
		await expect(doneList).not.toHaveAttribute('data-is-target', 'true');
		await expect(doingList).not.toHaveAttribute('data-is-target', 'true');
		await expect(toDoList).toHaveAttribute('data-is-source', 'true');

		// Cancel the drag operation with the Escape key
		await page.keyboard.press('Escape');
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');

		// Lock the «Done» list too, leaving no peer list able to receive items
		await page.locator('.list:has([data-list-id="done"]) select').selectOption('locked');
		await expect(doneList).toHaveAttribute('data-is-locked', 'true');

		// Start a new keyboard drag from To Do Item 1
		await toDoList.focus();
		await page.keyboard.press('ArrowDown');
		await expect(draggedItem).toBeFocused();
		await page.keyboard.press('Space');
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'kbd-drag-start');

		// Move right and verify nothing happened
		await page.keyboard.press('ArrowRight');
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'kbd-drag-start');
		await expect(doingList).not.toHaveAttribute('data-is-target', 'true');
		await expect(doneList).not.toHaveAttribute('data-is-target', 'true');
		await expect(doingList.locator('.ssl-placeholder')).toHaveCount(0);
		await expect(doneList.locator('.ssl-placeholder')).toHaveCount(0);

		// Cancel the drag operation with the Escape key
		await page.keyboard.press('Escape');
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify all lists kept their items
		expect(await toDoList.locator('.ssl-item .ssl-item-content__text').allTextContents()).toEqual(
			listItemTexts['to-do']
		);
		expect(await doingList.locator('.ssl-item .ssl-item-content__text').allTextContents()).toEqual(
			listItemTexts['doing']
		);
		expect(await doneList.locator('.ssl-item .ssl-item-content__text').allTextContents()).toEqual(
			listItemTexts['done']
		);
	});
});
