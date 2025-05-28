import type { ItemData, TextDirection } from '$lib/types/index.js';
import { getTranslateValues } from './index.js';

export function getId(element: HTMLLIElement): string {
	return String(element.dataset.itemId);
}

export function getIndex(element: HTMLLIElement): number {
	return Number(element.dataset.itemIndex);
}

export function getItemData(item: HTMLElement): ItemData {
	const itemRect = item.getBoundingClientRect();
	const itemTranslate = getTranslateValues(item);
	return {
		id: item.dataset.itemId!,
		index: Number(item.dataset.itemIndex),
		// Translate values are removed to create a reliable reference to the item’s position in the list
		// without the risk of catching in-between values while an item is translating.
		x: itemRect.x - (itemTranslate?.x || 0),
		y: itemRect.y - (itemTranslate?.y || 0),
		width: itemRect.width,
		height: itemRect.height,
	};
}

export function getItemsData(list: HTMLUListElement): ItemData[] {
	return Array.from(list.querySelectorAll<HTMLLIElement>('.ssl-item')).map((item) =>
		getItemData(item)
	);
}

export const getTextDirection = (element: HTMLElement): TextDirection => {
	if (!element) return 'auto';

	let parent = element.parentElement;
	while (parent) {
		if (parent.getAttribute('dir')) return parent.getAttribute('dir') as TextDirection;
		parent = parent.parentElement;
	}

	return 'auto';
};
