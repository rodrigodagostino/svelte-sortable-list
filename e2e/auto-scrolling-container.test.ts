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

	for (const { ancestor, selector } of [
		{ ancestor: 'the list', selector: '.ssl-root' },
		{ ancestor: 'an ancestor of the wrapper', selector: '.app-main .container' },
	]) {
		test(`should keep the dragged item under the pointer while auto scrolling when ${ancestor} has a transform`, async ({
			page,
		}) => {
			// Turn the ancestor into the containing block of fixed-positioned elements. The dragged item
			// is positioned with `position: fixed`, so its coordinates resolve from that ancestor. When the
			// ancestor is the list, it scrolls along with the content; when it’s an ancestor of the
			// wrapper (the scroller), it stays put.
			await page.evaluate((selector) => {
				document.querySelector<HTMLElement>(selector)!.style.transform = 'translateZ(0)';
			}, selector);

			// Find the wrapper element
			const wrapper = page.locator('.wrapper');
			const wrapperBox = await wrapper.boundingBox();
			if (!wrapperBox) throw new Error('Could not get wrapper size');

			const root = page.locator('.ssl-root');

			// Find the dragged item (List Item 1)
			const draggedItem = root.locator('[data-item-id="list-item-1"]:not(.ssl-placeholder)');

			// Get the bounding box for a precise drag operation
			const draggedBox = await draggedItem.boundingBox();
			if (!draggedBox) throw new Error('Could not get List Item 1 bounding box');

			// Start the drag from the center of the dragged item
			const pointerX = draggedBox.x + draggedBox.width / 2;
			await page.mouse.move(pointerX, draggedBox.y + draggedBox.height / 2);
			await page.mouse.down();
			await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag-start');

			// Count the nodes added to or removed from the list from now on
			await root.evaluate((el) => {
				const counter = window as unknown as { sslListMutations: number };
				counter.sslListMutations = 0;
				new MutationObserver((records) => {
					for (const { addedNodes, removedNodes } of records)
						counter.sslListMutations += addedNodes.length + removedNodes.length;
				}).observe(el, { childList: true });
			});

			// Move to the bottom edge of the wrapper to trigger auto scroll
			const pointerY = wrapperBox.y + wrapperBox.height;
			await page.mouse.move(pointerX, pointerY, { steps: 40 });
			await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag');

			// Wait for the auto scroll to have moved the content a good distance
			await expect.poll(() => wrapper.evaluate((el) => el.scrollTop)).toBeGreaterThan(200);

			// Verify the dragged item is still centered under the pointer while auto scrolling
			const scrollingBox = await draggedItem.boundingBox();
			if (!scrollingBox) throw new Error('Could not get List Item 1 bounding box while scrolling');
			expect(Math.abs(scrollingBox.x + scrollingBox.width / 2 - pointerX)).toBeLessThanOrEqual(1);
			expect(Math.abs(scrollingBox.y + scrollingBox.height / 2 - pointerY)).toBeLessThanOrEqual(1);

			// Verify auto scrolling didn’t touch the list’s children (re-measuring the fixed origin with a
			// throwaway probe on every frame did, and made auto scrolling lag on mobile devices)
			expect(
				await page.evaluate(
					() => (window as unknown as { sslListMutations: number }).sslListMutations
				)
			).toBe(0);

			// Move back to the middle of the wrapper to stop the auto scroll
			const restingY = wrapperBox.y + wrapperBox.height / 2;
			await page.mouse.move(pointerX, restingY, { steps: 40 });

			// Verify the dragged item is still centered under the pointer after auto scrolling
			const restingBox = await draggedItem.boundingBox();
			if (!restingBox) throw new Error('Could not get List Item 1 bounding box after scrolling');
			expect(Math.abs(restingBox.x + restingBox.width / 2 - pointerX)).toBeLessThanOrEqual(1);
			expect(Math.abs(restingBox.y + restingBox.height / 2 - restingY)).toBeLessThanOrEqual(1);

			// Release the mouse to drop
			await page.mouse.up();

			// Wait for the drag operation to complete by checking the drag state returns to idle
			await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');
		});
	}

	test('should not auto scroll when the autoScroll() module is not included', async ({ page }) => {
		// Navigate to the page without the auto scroll module
		await page.goto('/auto-scrolling-container?autoScroll=off');
		await page.locator('.ssl-root').waitFor();

		// Find the wrapper element
		const wrapper = page.locator('.wrapper');
		const wrapperBox = await wrapper.boundingBox();
		if (!wrapperBox) throw new Error('Could not get wrapper size');

		// Find the dragged item (List Item 1)
		const root = page.locator('.ssl-root');
		const draggedItem = root.locator('[data-item-id="list-item-1"]:not(.ssl-placeholder)');

		// Get the bounding box for a precise drag operation
		const draggedBox = await draggedItem.boundingBox();
		if (!draggedBox) throw new Error('Could not get List Item 1 bounding box');

		// Start the drag from the center of the dragged item
		const pointerX = draggedBox.x + draggedBox.width / 2;
		await page.mouse.move(pointerX, draggedBox.y + draggedBox.height / 2);
		await page.mouse.down();
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag-start');

		// Move to the bottom edge of the wrapper, where auto scroll would kick in
		await page.mouse.move(pointerX, wrapperBox.y + wrapperBox.height, { steps: 40 });
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag');

		// Wait for the time auto scroll would have needed to move the content
		await page.waitForTimeout(1000);

		// Verify the wrapper did not scroll
		expect(await wrapper.evaluate((el) => el.scrollTop)).toBe(0);

		// Release the mouse to drop
		await page.mouse.up();

		// Wait for the drag operation to complete by checking the drag state returns to idle
		await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');
	});

	for (const { threshold, distance, shouldScroll } of [
		{ threshold: undefined, distance: 0.15, shouldScroll: true },
		{ threshold: 0.1, distance: 0.15, shouldScroll: false },
		{ threshold: 0.1, distance: 0.05, shouldScroll: true },
	]) {
		test(`should ${shouldScroll ? '' : 'not '}auto scroll with the pointer at ${distance * 100}% from the edge and a threshold of ${threshold ?? 'default'}`, async ({
			page,
		}) => {
			// Navigate to the page with the threshold under test
			await page.goto(
				`/auto-scrolling-container${threshold === undefined ? '' : `?threshold=${threshold}`}`
			);
			await page.locator('.ssl-root').waitFor();

			// Find the wrapper element
			const wrapper = page.locator('.wrapper');
			const wrapperBox = await wrapper.boundingBox();
			if (!wrapperBox) throw new Error('Could not get wrapper size');
			const wrapperHeight = await wrapper.evaluate((el) => el.clientHeight);

			// Find the dragged item (List Item 1)
			const root = page.locator('.ssl-root');
			const draggedItem = root.locator('[data-item-id="list-item-1"]:not(.ssl-placeholder)');

			// Get the bounding box for a precise drag operation
			const draggedBox = await draggedItem.boundingBox();
			if (!draggedBox) throw new Error('Could not get List Item 1 bounding box');

			// Start the drag from the center of the dragged item
			const pointerX = draggedBox.x + draggedBox.width / 2;
			await page.mouse.move(pointerX, draggedBox.y + draggedBox.height / 2);
			await page.mouse.down();
			await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag-start');

			// Move close to the bottom edge of the wrapper and hold still
			const pointerY = wrapperBox.y + wrapperBox.height - wrapperHeight * distance;
			await page.mouse.move(pointerX, pointerY, { steps: 40 });
			await expect(draggedItem).toHaveAttribute('data-drag-state', 'ptr-drag');

			// Wait for the time auto scroll needs to move the content
			await page.waitForTimeout(1000);

			// Verify the wrapper scrolled only when the pointer was inside the threshold
			const scrollTop = await wrapper.evaluate((el) => el.scrollTop);
			if (shouldScroll) expect(scrollTop).toBeGreaterThan(0);
			else expect(scrollTop).toBe(0);

			// Release the mouse to drop
			await page.mouse.up();

			// Wait for the drag operation to complete by checking the drag state returns to idle
			await expect(draggedItem).toHaveAttribute('data-drag-state', 'idle');
		});
	}

	test('should keep the configured margin when scrolling the target item into view using keyboard', async ({
		page,
	}) => {
		// Move the target item below the visible area of the wrapper and return where the wrapper settles
		async function getScrollTopAfterFirstKeyboardScroll(margin?: number) {
			// Navigate to the page with the margin under test
			await page.goto(
				`/auto-scrolling-container${margin === undefined ? '' : `?margin=${margin}`}`
			);
			await page.locator('.ssl-root').waitFor();

			// Focus the list and pick up List Item 1
			const wrapper = page.locator('.wrapper');
			const root = page.locator('.ssl-root');
			await root.focus();
			await page.keyboard.press('ArrowDown');
			await expect(root.locator('[data-item-id="list-item-1"]')).toBeFocused();
			await page.keyboard.press('Space');

			// Move the item down until the wrapper starts scrolling
			for (let i = 0; i < 100; i++) {
				await page.keyboard.press('ArrowDown');
				const hasScrolled = await expect
					.poll(() => wrapper.evaluate((el) => el.scrollTop), { timeout: 200 })
					.toBeGreaterThan(0)
					.then(() => true)
					.catch(() => false);
				if (hasScrolled) break;
			}

			// Wait for the smooth scroll to settle
			let lastScrollTop = -1;
			await expect
				.poll(async () => {
					const scrollTop = await wrapper.evaluate((el) => el.scrollTop);
					const isSettled = scrollTop > 0 && scrollTop === lastScrollTop;
					lastScrollTop = scrollTop;
					return isSettled;
				})
				.toBe(true);

			// Cancel the drag
			await page.keyboard.press('Escape');

			return lastScrollTop;
		}

		// Scroll the target item into view with the default margin and with a wider one
		const defaultScrollTop = await getScrollTopAfterFirstKeyboardScroll();
		const widerScrollTop = await getScrollTopAfterFirstKeyboardScroll(120);

		// Verify the wider margin scrolled further by the difference with the default (40px)
		expect(Math.abs(widerScrollTop - defaultScrollTop - 80)).toBeLessThanOrEqual(2);
	});
});
