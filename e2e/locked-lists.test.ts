import { test, expect } from '@playwright/test';
import { getLockedItems } from '../src/routes/fixtures.js';

test.describe('Sortable List - Locked List', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the Locked List page
		await page.goto('/locked-list');

		// Wait for the root element to be loaded
		await page.locator('.ssl-root').waitFor();
	});

	test('should not scroll the page when pressing Space on a focused item', async ({ page }) => {
		// Find the root element
		const root = page.locator('.ssl-root');

		// Make the page tall enough to scroll without disturbing the layout around the list
		await page.evaluate(() =>
			document.body.insertAdjacentHTML(
				'beforeend',
				'<div style="position: absolute; top: 0; left: 0; width: 1px; height: 300vh; pointer-events: none"></div>'
			)
		);
		expect(await page.evaluate(() => window.scrollY)).toBe(0);

		// Focus the list and move the focus to Locked Item 1
		await root.focus();
		await page.keyboard.press('ArrowDown');
		await expect(root).toHaveAttribute('aria-activedescendant', 'locked-item-1');

		// Press Space to try to lift the locked item
		await page.keyboard.press(' ');

		// Give any smooth scroll triggered by the key press time to settle
		await page.waitForTimeout(500);

		// Verify no drag was started and the page did not scroll
		await expect(root.locator('.ssl-item[data-drag-state*="kbd"]')).toHaveCount(0);
		expect(await page.evaluate(() => window.scrollY)).toBe(0);
	});

	test('should let the page scroll when swiping over item content', async ({ page, hasTouch }) => {
		// Touch gestures can only be emulated through the Chrome DevTools Protocol on a touch device
		test.skip(!hasTouch, 'Requires touch emulation');

		// Find the root element
		const root = page.locator('.ssl-root');

		// Get the initial order of the items to verify the starting state
		const initialItems = await root.locator('.ssl-item .ssl-item-content__text').allTextContents();
		expect(initialItems).toEqual(getLockedItems(5).map((item) => item.text));

		// Make the page tall enough to scroll without disturbing the layout around the list
		await page.evaluate(() =>
			document.body.insertAdjacentHTML(
				'beforeend',
				'<div style="position: absolute; top: 0; left: 0; width: 1px; height: 300vh; pointer-events: none"></div>'
			)
		);
		expect(await page.evaluate(() => window.scrollY)).toBe(0);
		const rootBox = await root.boundingBox();
		const viewport = page.viewportSize();
		if (!rootBox || !viewport) throw new Error('Could not get root bounding box or viewport size');
		expect(rootBox.y + rootBox.height).toBeLessThanOrEqual(viewport.height);

		// Verify the locked list and its items leave touch gestures alone
		await expect(root).toHaveCSS('touch-action', 'auto');
		await expect(root.locator('[data-item-id="locked-item-2"]')).toHaveCSS('touch-action', 'auto');

		// Open a CDP session to dispatch real touch gestures
		const cdp = await page.context().newCDPSession(page);
		const waitForFrames = () =>
			page.evaluate(
				() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
			);

		// Find the text of Locked Item 2
		const itemText = root.locator('[data-item-id="locked-item-2"] .ssl-item-content__text');
		const textBox = await itemText.boundingBox();
		if (!textBox) throw new Error('Could not get Locked Item 2 text bounding box');

		// Swipe up over the item text
		const swipeFinger = {
			x: textBox.x + textBox.width / 2,
			y: textBox.y + textBox.height / 2,
			id: 1,
		};
		await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [swipeFinger] });
		for (let i = 0; i < 10; i++) {
			swipeFinger.y -= 15;
			await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [swipeFinger] });
			await waitForFrames();
		}
		await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [swipeFinger] });

		// Verify the page scrolled and no drag was started
		await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
		await expect(root.locator('.ssl-item[data-drag-state*="ptr"]')).toHaveCount(0);
		expect(await root.locator('.ssl-item .ssl-item-content__text').allTextContents()).toEqual(
			initialItems
		);
	});
});
