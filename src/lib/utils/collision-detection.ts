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
