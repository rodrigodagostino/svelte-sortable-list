import type { ItemRect } from '$lib/types/index.js';

export function areColliding(a: DOMRect | ItemRect, b: DOMRect | ItemRect) {
	return a.right > b.x && a.x < b.right && a.bottom > b.y && a.y < b.bottom;
}

function getIntersectionRect(a: DOMRect | ItemRect, b: DOMRect | ItemRect) {
	const x1 = Math.max(a.x, b.x);
	const y1 = Math.max(a.y, b.y);
	const x2 = Math.min(a.right, b.right);
	const y2 = Math.min(a.bottom, b.bottom);

	return { x: x1, y: y1, width: x2 - x1, height: y2 - y1, area: (x2 - x1) * (y2 - y1) };
}

export function getCollidingItem(ghost: HTMLDivElement, items: ItemRect[]) {
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
