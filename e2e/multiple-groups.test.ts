import { test, expect } from '@playwright/test';

const listItemTexts: Record<string, string[]> = {
	backlog: ['Backlog Item 1', 'Backlog Item 2', 'Backlog Item 3', 'Backlog Item 4'],
	ready: ['Ready Item 1', 'Ready Item 2', 'Ready Item 3'],
	review: ['Review Item 1', 'Review Item 2', 'Review Item 3'],
	shipped: ['Shipped Item 1', 'Shipped Item 2'],
};

test.describe('Sortable List - Multiple Groups', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the Multiple Groups page
		await page.goto('/multiple-groups');

		// Wait for the root elements to be loaded
		await page.locator('.ssl-root').first().waitFor();
	});

	test('should not target a peer list when moving past the last list of a group using keyboard', async ({
		page,
	}) => {
		// Find the roots of both lists in «Group A», plus the first list of «Group B»
		const backlogList = page.locator('[data-list-id="backlog"]');
		const readyList = page.locator('[data-list-id="ready"]');
		const reviewList = page.locator('[data-list-id="review"]');

		// Focus the «Backlog» root and select its first item (Backlog Item 1)
		await backlogList.focus();
		await page.keyboard.press('ArrowDown');
		const draggedItem = page.locator('[data-item-id="backlog-item-1"]:not(.ssl-placeholder)');
		await expect(draggedItem).toBeFocused();

		// Start dragging with the Space key
		await page.keyboard.press('Space');
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'kbd-drag-start');

		// Move right to target «Ready», the last list of «Group A»
		await page.keyboard.press('ArrowRight');
		await expect(readyList).toHaveAttribute('data-is-target', 'true');
		await expect(readyList.locator('.ssl-placeholder')).toBeVisible();

		// Moving right again should be a no-op: «Ready» is the last list of its group, and «Review»
		// belongs to a different group. The target must stay on «Ready» instead of falling back
		// into the source list.
		await page.keyboard.press('ArrowRight');
		await expect(readyList).toHaveAttribute('data-is-target', 'true');
		await expect(readyList.locator('.ssl-placeholder')).toBeVisible();
		await expect(reviewList).not.toHaveAttribute('data-is-target', 'true');

		// Drop the item with the Space key
		await page.keyboard.press('Space');
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify Backlog Item 1 crossed into «Ready» and left «Backlog»
		expect(
			await backlogList.locator('.ssl-item .ssl-item-content__text').allTextContents()
		).toEqual(listItemTexts['backlog'].slice(1));

		const readyItemsAfterDrag = await readyList
			.locator('.ssl-item .ssl-item-content__text')
			.allTextContents();
		expect(readyItemsAfterDrag).toHaveLength(4);
		expect(readyItemsAfterDrag).toContain('Backlog Item 1');
		expect(readyItemsAfterDrag.filter((text) => text !== 'Backlog Item 1')).toEqual(
			listItemTexts['ready']
		);

		// Verify «Group B» stayed untouched
		expect(await reviewList.locator('.ssl-item .ssl-item-content__text').allTextContents()).toEqual(
			listItemTexts['review']
		);
		expect(
			await page
				.locator('[data-list-id="shipped"] .ssl-item .ssl-item-content__text')
				.allTextContents()
		).toEqual(listItemTexts['shipped']);
	});

	test('should not navigate focus past the last list of a group using arrow keys', async ({
		page,
	}) => {
		// Find the roots of both lists in «Group A», plus the first list of «Group B»
		const backlogList = page.locator('[data-list-id="backlog"]');
		const readyList = page.locator('[data-list-id="ready"]');
		const reviewList = page.locator('[data-list-id="review"]');

		// Focus the «Backlog» root and select its first item
		await backlogList.focus();
		await page.keyboard.press('ArrowDown');
		await expect(backlogList.locator('[data-item-id="backlog-item-1"]')).toBeFocused();

		// Move right to focus the closest item in the «Ready» peer list
		await page.keyboard.press('ArrowRight');
		await expect(readyList.locator('.ssl-item[aria-selected="true"]')).toBeFocused();

		// Moving right again should have no effect: «Review» is in another group
		await page.keyboard.press('ArrowRight');
		await expect(readyList.locator('.ssl-item[aria-selected="true"]')).toBeFocused();
		await expect(reviewList.locator('.ssl-item[aria-selected="true"]')).toHaveCount(0);
	});

	test('should keep each group independent when moving items across its own lists using keyboard', async ({
		page,
	}) => {
		// Find both lists of «Group B»
		const reviewList = page.locator('[data-list-id="review"]');
		const shippedList = page.locator('[data-list-id="shipped"]');

		// Focus the «Review» root and select its first item (Review Item 1)
		await reviewList.focus();
		await page.keyboard.press('ArrowDown');
		const draggedItem = page.locator('[data-item-id="review-item-1"]:not(.ssl-placeholder)');
		await expect(draggedItem).toBeFocused();

		// Start dragging with the Space key
		await page.keyboard.press('Space');
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'kbd-drag-start');

		// Move right to target «Shipped» — the second group’s list indexes start back at 0, so its
		// last list must be reachable even though the page holds four lists in total
		await page.keyboard.press('ArrowRight');
		await expect(shippedList).toHaveAttribute('data-is-target', 'true');
		await expect(shippedList.locator('.ssl-placeholder')).toBeVisible();

		// Drop the item with the Space key
		await page.keyboard.press('Space');
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify Review Item 1 crossed into «Shipped» and left «Review»
		expect(await reviewList.locator('.ssl-item .ssl-item-content__text').allTextContents()).toEqual(
			listItemTexts['review'].slice(1)
		);

		const shippedItemsAfterDrag = await shippedList
			.locator('.ssl-item .ssl-item-content__text')
			.allTextContents();
		expect(shippedItemsAfterDrag).toHaveLength(3);
		expect(shippedItemsAfterDrag).toContain('Review Item 1');
		expect(shippedItemsAfterDrag.filter((text) => text !== 'Review Item 1')).toEqual(
			listItemTexts['shipped']
		);

		// Verify «Group A» stayed untouched
		expect(
			await page
				.locator('[data-list-id="backlog"] .ssl-item .ssl-item-content__text')
				.allTextContents()
		).toEqual(listItemTexts['backlog']);
	});

	test('should re-register lists per group after navigating away and back', async ({ page }) => {
		// Client-side navigate to another page and back, so every list unregisters and registers
		// again. A leftover registry entry would make the group’s last list unreachable.
		const menuToggle = page.locator('[aria-controls="app-nav"]');
		await menuToggle.click();
		await page.getByRole('link', { name: 'Multiple lists', exact: true }).click();
		await expect(page.locator('[data-list-id="to-do"]')).toBeVisible();
		await page.getByRole('link', { name: 'Multiple groups', exact: true }).click();
		await menuToggle.click();

		const backlogList = page.locator('[data-list-id="backlog"]');
		const readyList = page.locator('[data-list-id="ready"]');
		await expect(backlogList).toBeVisible();

		// Focus the «Backlog» root and select its first item (Backlog Item 1)
		await backlogList.focus();
		await page.keyboard.press('ArrowDown');
		const draggedItem = page.locator('[data-item-id="backlog-item-1"]:not(.ssl-placeholder)');
		await expect(draggedItem).toBeFocused();

		// Start dragging with the Space key
		await page.keyboard.press('Space');
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'kbd-drag-start');

		// «Ready» must still be reachable, and moving past it must still be a no-op
		await page.keyboard.press('ArrowRight');
		await expect(readyList).toHaveAttribute('data-is-target', 'true');
		await page.keyboard.press('ArrowRight');
		await expect(readyList).toHaveAttribute('data-is-target', 'true');

		// Cancel the drag with the Escape key
		await page.keyboard.press('Escape');
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');
	});
});
