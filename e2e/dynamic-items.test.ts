import { test, expect } from '@playwright/test';
import { removeItem } from '../src/lib/utils/exposed.js';
import { getDefaultItems } from '../src/routes/fixtures.js';

test.describe('Sortable List - Dynamic Items', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the Dynamic Items page
		await page.goto('/dynamic-items');

		// Wait for the root element to be loaded
		await page.locator('.ssl-root').waitFor();
	});

	test('should remove List Item 3 and List Item 2 by clicking on their remove buttons', async ({
		page,
	}) => {
		// Find the root element
		const root = page.locator('.ssl-root');

		// Get the initial order of items to verify the starting state
		const initialItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(initialItems).toEqual(getDefaultItems(5).map((item) => item.text));

		// === FIRST REMOVAL OPERATION ===
		// Click the remove button for List Item 3
		const listItem3 = root.locator('[data-item-id="list-item-3"]:not(.ssl-placeholder)');
		await listItem3.locator('.ssl-item-remove').click();

		// Verify List Item 3 has been removed
		await listItem3.waitFor({ state: 'detached' });
		await expect(listItem3).toBeHidden();

		// Verify the order after first removal
		const itemsAfterFirstRemoval = await root
			.locator('.ssl-item .ssl-item-content__text')
			.allTextContents();
		expect(itemsAfterFirstRemoval).toEqual(removeItem(initialItems, 2));

		// === SECOND REMOVAL OPERATION ===
		// Click the remove button for List Item 2
		const listItem2 = root.locator('[data-item-id="list-item-2"]:not(.ssl-placeholder)');
		await listItem2.locator('.ssl-item-remove').click();

		// Verify List Item 2 has been removed
		await listItem2.waitFor({ state: 'detached' });
		await expect(listItem2).toBeHidden();

		// Verify the final order after both removals
		const finalItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(finalItems).toEqual(removeItem(itemsAfterFirstRemoval, 1));
	});

	test('should update the remove buttons labels after sorting the items', async ({ page }) => {
		// Find the root element
		const root = page.locator('.ssl-root');

		// Verify the initial labels reflect each item position
		const items = root.locator('.ssl-item');
		await expect(items).toHaveCount(5);
		for (let i = 0; i < 5; i++)
			await expect(items.nth(i).locator('.ssl-item-remove')).toHaveAttribute(
				'aria-label',
				`Remove item at position ${i + 1}`
			);

		// Find the dragged item (List Item 1) and the target item (List Item 3)
		const draggedItem = root.locator('[data-item-id="list-item-1"]:not(.ssl-placeholder)');
		const targetItem = root.locator('[data-item-id="list-item-3"]:not(.ssl-placeholder)');
		const draggedBox = await draggedItem.boundingBox();
		const targetBox = await targetItem.boundingBox();
		if (!draggedBox || !targetBox) throw new Error('Could not get item bounding box');

		// Drag List Item 1 from its edge (not on the remove button) onto List Item 3
		await page.mouse.move(draggedBox.x + 8, draggedBox.y + draggedBox.height / 2);
		await page.mouse.down();
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag-start');
		await page.mouse.move(targetBox.x + 8, targetBox.y + targetBox.height / 2, { steps: 40 });
		await page.mouse.up();

		// Wait for the drag operation to complete by checking the drag state returns to idle
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');
		await expect(draggedItem).toHaveAttribute('data-item-index', '2');

		// Verify the labels follow the new positions
		await expect(draggedItem.locator('.ssl-item-remove')).toHaveAttribute(
			'aria-label',
			'Remove item at position 3'
		);
		await expect(root.locator('[data-item-id="list-item-2"] .ssl-item-remove')).toHaveAttribute(
			'aria-label',
			'Remove item at position 1'
		);
		await expect(root.locator('[data-item-id="list-item-3"] .ssl-item-remove')).toHaveAttribute(
			'aria-label',
			'Remove item at position 2'
		);
	});
});
