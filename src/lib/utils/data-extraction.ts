import type {
	SortableListRegistry as Registry,
	SortableListRootState as RootState,
} from '$lib/states/index.js';
import type { ItemRect } from '$lib/types/index.js';
import { getTranslateValues } from './index.js';

export function getId(element: HTMLUListElement | HTMLLIElement): string {
	return String(element.dataset.itemId);
}

export function getIndex(element: HTMLUListElement | HTMLLIElement): number {
	return Number(element.dataset.itemIndex);
}

export function getItemRect(item: HTMLLIElement): ItemRect {
	const { x, y, width, height, top, right, bottom, left } = item.getBoundingClientRect();
	const itemTranslate = getTranslateValues(item);
	return {
		// Translate values are removed to create a reliable reference to the item’s position in the list
		// without the risk of catching in-between values while an item is translating.
		x: x - (itemTranslate?.x || 0),
		y: y - (itemTranslate?.y || 0),
		width,
		height,
		top: top - (itemTranslate?.y || 0),
		right: right - (itemTranslate?.x || 0),
		bottom: bottom - (itemTranslate?.y || 0),
		left: left - (itemTranslate?.x || 0),
		id: item.dataset.itemId!,
		index: Number(item.dataset.itemIndex),
	};
}

export function getItemRects(list: HTMLUListElement): ItemRect[] {
	return Array.from(list.querySelectorAll<HTMLLIElement>('.ssl-item')).map((item) =>
		getItemRect(item)
	);
}

export function getPeerTargetFields(
	registry: Registry,
	group: string | undefined,
	state: RootState
) {
	if (!group || !registry.targetList || !registry.isSourceList(state))
		return {
			targetList: null,
			targetListId: null,
			targetListIndex: null,
		};

	const { targetItem, targetItemId, targetItemIndex } = registry.targetList;

	return {
		targetList: registry.targetList?.ref ?? null,
		targetListId: registry.targetList?.id ?? null,
		targetListIndex: registry.targetList?.index ?? null,
		targetItem,
		targetItemId,
		targetItemIndex,
	};
}

export const getTextDirection = (element: HTMLElement): HTMLElement['dir'] => {
	if (!element) return 'auto';

	return window.getComputedStyle(element).direction || 'auto';
};
