import type { ItemRect } from '$lib/types/index.js';

export function areColliding(a: DOMRect | ItemRect, b: DOMRect | ItemRect) {
	return a.right > b.x && a.x < b.right && a.bottom > b.y && a.y < b.bottom;
}

function getDistanceBetweenCenters(a: DOMRect | ItemRect, b: DOMRect | ItemRect) {
	const dx = a.x + a.width / 2 - (b.x + b.width / 2);
	const dy = a.y + a.height / 2 - (b.y + b.height / 2);

	return Math.sqrt(dx * dx + dy * dy);
}

function isCenterCrossed(ghostRect: DOMRect, itemRect: ItemRect) {
	const itemCenterX = itemRect.x + itemRect.width / 2;
	const itemCenterY = itemRect.y + itemRect.height / 2;

	const hasCrossedX = ghostRect.left < itemCenterX && ghostRect.right > itemCenterX;
	const hasCrossedY = ghostRect.top < itemCenterY && ghostRect.bottom > itemCenterY;

	return hasCrossedX && hasCrossedY;
}

export function getCollidingItem(ghostRect: DOMRect, itemRects: ItemRect[]) {
	const collidingItems = itemRects.filter((itemRect) => isCenterCrossed(ghostRect, itemRect));

	if (collidingItems.length <= 1) return collidingItems[0];

	return collidingItems.reduce((closest, current) => {
		const closestDist = getDistanceBetweenCenters(ghostRect, closest);
		const currentDist = getDistanceBetweenCenters(ghostRect, current);
		return currentDist < closestDist ? current : closest;
	});
}

export function keepWithinBounds(
	axis: 'x' | 'y',
	pointer: number,
	pointerOrigin: number,
	rootRect: DOMRect,
	draggedRectSnapshot: DOMRect | ItemRect,
	gap: number
) {
	const rootStart = rootRect[axis];
	const rootEnd = axis === 'x' ? rootRect.right : rootRect.bottom;
	const draggedStart = draggedRectSnapshot[axis];
	const draggedSize = axis === 'x' ? draggedRectSnapshot.width : draggedRectSnapshot.height;
	const offset = pointerOrigin - draggedStart;
	// If the dragged item moves before the start edge of the list,
	// place it right after the start edge of the list.
	if (pointer - offset < rootStart + gap / 2) return rootStart - draggedStart + gap / 2;
	// If the dragged item moves past the end edge of the list,
	// place it right before the end edge of the list.
	if (pointer + draggedSize - offset > rootEnd - gap / 2)
		return rootEnd - draggedStart - draggedSize - gap / 2;
	// Otherwise, follow the pointer freely.
	return pointer - pointerOrigin;
}
