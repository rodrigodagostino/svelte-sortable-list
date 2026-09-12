import { getTranslateValues } from './styles.js';
import type {
	SortableListRegistry as Registry,
	SortableListRootState as RootState,
} from '$lib/states/index.js';
import type { ItemRect, RegistryList } from '$lib/types/index.js';

export function getIndex(element: HTMLUListElement | HTMLLIElement) {
	return Number(element.dataset.listIndex ?? element.dataset.itemIndex);
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
		ref: item,
	};
}

export function getItemRects(list: HTMLUListElement): ItemRect[] {
	return Array.from(list.querySelectorAll<HTMLLIElement>('.ssl-item')).map((item) =>
		getItemRect(item)
	);
}

export function getItemRectWithOffset(
	itemRect: DOMRect,
	scrollOffset: RootState['scrollOffset']
): DOMRect {
	return scrollOffset?.left || scrollOffset?.top
		? new DOMRect(
				itemRect.x + scrollOffset.left,
				itemRect.y + scrollOffset.top,
				itemRect.width,
				itemRect.height
			)
		: itemRect;
}

let peerSnapshot: { list: RegistryList; key: string; rects: ItemRect[] } | null = null;

export function getPeerItemRects(list: RegistryList): ItemRect[] {
	const { x, y, width, height } = list.ref.getBoundingClientRect();
	const key = `${x},${y},${width},${height},${list.ref.scrollLeft},${list.ref.scrollTop}`;
	if (peerSnapshot?.list !== list || peerSnapshot.key !== key)
		peerSnapshot = { list, key, rects: getItemRects(list.ref) };

	return peerSnapshot.rects;
}

export function clearPeerItemRects() {
	peerSnapshot = null;
}

export function getTargetItemFields(item: HTMLLIElement | null) {
	return {
		targetItem: item,
		targetItemId: !item || item.classList.contains('ssl-placeholder') ? null : item.id,
		targetItemIndex: item ? getIndex(item) : null,
	};
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

/**
 * Returns the viewport position that `position: fixed` descendants of `ref` resolve their `left`
 * and `top` from. That is the viewport origin (0, 0) unless an ancestor establishes a containing
 * block for fixed elements (`transform`, `filter`, `contain`, `will-change`, …), in which case
 * it’s the padding box of that ancestor.
 */
const fixedOriginProbes = new WeakMap<HTMLUListElement, HTMLElement>();
const FIXED_ORIGIN_PROBE_CLASS = 'ssl-fixed-origin-probe';
function getFixedOrigin(ref: HTMLUListElement): { x: number; y: number } {
	let probe = fixedOriginProbes.get(ref);
	if (!probe?.isConnected) {
		probe = document.createElement('div');
		probe.className = FIXED_ORIGIN_PROBE_CLASS;
		probe.setAttribute('aria-hidden', 'true');
		probe.style.cssText =
			'position: fixed; left: 0; top: 0; width: 0; height: 0; padding: 0; margin: 0; border: 0; visibility: hidden; pointer-events: none';
		ref.appendChild(probe);
		fixedOriginProbes.set(ref, probe);
	}
	const { x, y } = probe.getBoundingClientRect();

	return { x, y };
}

export function removeFixedOriginProbe(ref: HTMLUListElement) {
	fixedOriginProbes.get(ref)?.remove();
	fixedOriginProbes.delete(ref);
}

export function updateFixedOrigin(ref: HTMLUListElement, fixedOrigin: RootState['fixedOrigin']) {
	const { x, y } = getFixedOrigin(ref);
	if (x === fixedOrigin.x && y === fixedOrigin.y) return fixedOrigin;

	return { x, y };
}

export const getTextDirection = (element: HTMLElement): HTMLElement['dir'] => {
	if (!element) return 'auto';

	return window.getComputedStyle(element).direction || 'auto';
};

export function preserveSelectedOptions(source: HTMLLIElement, clone: HTMLLIElement): void {
	const clonedSelects = clone.querySelectorAll<HTMLSelectElement>('select');

	source.querySelectorAll<HTMLSelectElement>('select').forEach((select, i) => {
		const clonedOptions = clonedSelects[i]?.options;
		if (!clonedOptions) return;

		Array.from(select.options).forEach((option, j) => {
			if (clonedOptions[j]) clonedOptions[j].selected = option.selected;
		});
	});
}
