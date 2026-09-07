import { test, expect } from '@playwright/test';

test.describe('Sortable List - Auto Scrolling Container', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the Auto Scrolling Container page
		await page.goto('/auto-scrolling-container');

		// Wait for the root element to be loaded
		await page.locator('.ssl-root').waitFor();
	});

	test('should auto scroll when dragging to the bottom and then to the top', async ({ page }) => {
		// Find the wrapper element
		const wrapper = page.locator('.wrapper');
		const wrapperBox = await wrapper.boundingBox();
		if (!wrapperBox) throw new Error('Could not get wrapper size');

		const root = page.locator('.ssl-root');

		// === FIRST DRAG OPERATION - SCROLL DOWN ===
		// Find the dragged item (List Item 1)
		const draggedItem1 = root.locator('[data-item-id="list-item-1"]:not(.ssl-placeholder)');

		// Get the bounding box for a precise drag operation
		let draggedBox = await draggedItem1.boundingBox();
		if (!draggedBox) throw new Error('Could not get List Item 1 bounding box');

		// Get the initial scroll position
		const initialScroll = await wrapper.evaluate((el) => el.scrollTop);

		// Hover over the first item
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			draggedBox.y + draggedBox.height / 2
		);

		// Press the mouse down to start dragging
		await page.mouse.down();

		// Wait for the drag operation to start by checking the drag state
		await expect(draggedItem1).toHaveAttribute('data-drag-state', 'ptr-drag-start');

		// Move to the bottom edge of the wrapper to trigger auto scroll
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			wrapperBox.y + wrapperBox.height,
			{ steps: 40 } // Smooth movement
		);

		// Wait for the auto scroll to happen
		await page.waitForTimeout(1000);

		// Move back to the middle of the wrapper
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			wrapperBox.y + wrapperBox.height / 2,
			{ steps: 40 } // Smooth movement
		);

		// Release the mouse to drop
		await page.mouse.up();

		// Wait for the drag operation to complete by checking the drag state returns to idle
		await expect(draggedItem1).toHaveAttribute('data-drag-state', 'idle');

		// Verify scrolling down occurred
		const scrollAfterScrollingDown = await wrapper.evaluate((el) => el.scrollTop);
		expect(scrollAfterScrollingDown).toBeGreaterThan(initialScroll);

		// === SECOND DRAG OPERATION - SCROLL UP ===
		// Scroll to the bottom first
		await wrapper.evaluate((el) => el.scrollTo(0, el.scrollHeight));

		// Find the dragged item (List Item 100)
		const draggedItem2 = root.locator('[data-item-id="list-item-100"]:not(.ssl-placeholder)');

		// Get the bounding box for a precise drag operation
		draggedBox = await draggedItem2.boundingBox();
		if (!draggedBox) throw new Error('Could not get List Item 100 bounding box');

		// Get the scroll position before scrolling up
		const scrollBeforeScrollingUp = await wrapper.evaluate((el) => el.scrollTop);

		// Hover over the last item
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			draggedBox.y + draggedBox.height / 2
		);

		// Press the mouse down to start dragging
		await page.mouse.down();

		// Wait for the drag operation to start by checking the drag state
		await expect(draggedItem2).toHaveAttribute('data-drag-state', 'ptr-drag-start');

		// Move to the top to trigger auto scroll
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			wrapperBox.y,
			{ steps: 40 } // Smooth movement
		);

		// Wait for the auto scroll to happen
		await page.waitForTimeout(1000);

		// Move back to the middle of the wrapper
		await page.mouse.move(
			draggedBox.x + draggedBox.width / 2,
			wrapperBox.y + wrapperBox.height / 2,
			{ steps: 40 } // Smooth movement
		);

		// Release the mouse to drop
		await page.mouse.up();

		// Wait for the drag operation to complete by checking the drag state returns to idle
		await expect(draggedItem2).toHaveAttribute('data-drag-state', 'idle');

		// Verify scrolling up occurred (should be less than the scroll position before scrolling up)
		const finalScroll = await wrapper.evaluate((el) => el.scrollTop);
		expect(finalScroll).toBeLessThan(scrollBeforeScrollingUp);
	});

	test('should keep targeting the item under the pointer while auto scrolling a container taller than the viewport', async ({
		page,
	}) => {
		// Get the viewport size
		const viewport = page.viewportSize();
		if (!viewport) throw new Error('Could not get viewport size');

		// Make the wrapper taller than the viewport, so its visible edges are the viewport’s
		await page.addStyleTag({
			content:
				"[data-page-pathname='auto-scrolling-container'] .wrapper.direction-vertical { height: 150vh !important; max-height: none !important; }",
		});

		// Find the wrapper element and scroll it close to its end, so the auto scroll below stops soon
		const wrapper = page.locator('.wrapper');
		await wrapper.evaluate((el) => el.scrollTo(0, el.scrollHeight - el.clientHeight - 400));
		await page.evaluate(() => window.scrollTo(0, 0));

		// Find the first item fully visible inside the wrapper to drag it
		const root = page.locator('.ssl-root');
		const draggedItemId = await wrapper.evaluate((el) => {
			const wrapperTop = el.getBoundingClientRect().top;
			const items = Array.from(el.querySelectorAll<HTMLElement>('.ssl-item'));
			return items.find((item) => item.getBoundingClientRect().top > wrapperTop + 8)?.dataset
				.itemId;
		});
		if (!draggedItemId) throw new Error('Could not find a visible item to drag');
		const draggedItem = root.locator(`[data-item-id="${draggedItemId}"]:not(.ssl-placeholder)`);

		// Get the bounding box for a precise drag operation
		const draggedBox = await draggedItem.boundingBox();
		if (!draggedBox) throw new Error(`Could not get ${draggedItemId} bounding box`);

		// Hover over the item
		const pointerX = draggedBox.x + draggedBox.width / 2;
		await page.mouse.move(pointerX, draggedBox.y + draggedBox.height / 2);

		// Press the mouse down to start dragging
		await page.mouse.down();

		// Wait for the drag operation to start by checking the drag state
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag-start');

		// Move to the bottom edge of the viewport to trigger auto scroll, then hold still
		const pointerY = viewport.height - 12;
		await page.mouse.move(pointerX, pointerY, { steps: 20 });

		// Wait for the auto scroll to reach the end of the wrapper
		await expect.poll(() => wrapper.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
		await expect
			.poll(() => wrapper.evaluate((el) => el.scrollHeight - el.clientHeight - el.scrollTop))
			.toBeLessThan(1);

		// Find the item now under the pointer (by its layout position, ignoring any translation)
		const expectedTargetIndex = await root.evaluate(
			(el, [draggedItemId, pointerY]) => {
				const items = Array.from(el.querySelectorAll<HTMLElement>('.ssl-item'));
				return items.findIndex((item) => {
					if (item.dataset.itemId === draggedItemId) return false;
					const { transform } = getComputedStyle(item);
					const translateY =
						transform === 'none' ? 0 : Number(transform.match(/matrix\((.+)\)/)![1].split(', ')[5]);
					const rect = item.getBoundingClientRect();
					const top = rect.top - translateY;
					return pointerY >= top && pointerY <= top + rect.height;
				});
			},
			[draggedItemId, pointerY] as [string, number]
		);
		expect(expectedTargetIndex).toBeGreaterThan(-1);

		// Release the mouse to drop
		await page.mouse.up();

		// Wait for the drag operation to complete by checking the drag state returns to idle
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');

		// Verify the item was dropped onto the item that was under the pointer after scrolling
		const finalIndex = await root.evaluate(
			(el, draggedItemId) =>
				Array.from(el.querySelectorAll<HTMLElement>('.ssl-item')).findIndex(
					(item) => item.dataset.itemId === draggedItemId
				),
			draggedItemId
		);
		expect(finalIndex).toBe(expectedTargetIndex);
	});
});
