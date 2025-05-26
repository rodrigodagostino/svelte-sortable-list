import type { ItemData } from '$lib/types/index.js';

export function areColliding(a: DOMRect | ItemData, b: DOMRect | ItemData) {
	return a.x + a.width > b.x && a.x < b.x + b.width && a.y + a.height > b.y && a.y < b.y + b.height;
}

function getIntersectionRect(r1: DOMRect | ItemData, r2: DOMRect | ItemData) {
	const x1 = Math.max(r1.x, r2.x);
	const y1 = Math.max(r1.y, r2.y);
	const x2 = Math.min(r1.x + r1.width, r2.x + r2.width);
	const y2 = Math.min(r1.y + r1.height, r2.y + r2.height);

	return { x: x1, y: y1, width: x2 - x1, height: y2 - y1, area: (x2 - x1) * (y2 - y1) };
}

export function getCollidingItem(ghost: HTMLElement, items: ItemData[]) {
	const ghostRect = ghost.getBoundingClientRect();
	const collidingItems = items.filter((targetItem) => areColliding(ghostRect, targetItem));
	if (collidingItems.length > 1) {
		collidingItems.sort((a, b) => {
			const aIntersectionRect = getIntersectionRect(ghostRect, a);
			const bIntersectionRect = getIntersectionRect(ghostRect, b);

			return bIntersectionRect.area - aIntersectionRect.area;
		});
	}

	return collidingItems[0];
}
