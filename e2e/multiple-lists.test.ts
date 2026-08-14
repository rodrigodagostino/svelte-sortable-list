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
});
