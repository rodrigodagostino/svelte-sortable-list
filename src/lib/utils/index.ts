import type { ItemData } from '$lib/types.js';

export function getItemData(item: HTMLElement): ItemData {
	const itemRect = item.getBoundingClientRect();
	return {
		id: item.dataset.id!,
		index: +item.dataset.index!,
		x: itemRect.x,
		y: itemRect.y,
		width: itemRect.width,
		height: itemRect.height,
		innerHTML: item.querySelector('.sortable-item__inner')!.innerHTML.trim(),
	};
}

export function getItemsData(list: HTMLUListElement): ItemData[] {
	return Array.from(list.querySelectorAll<HTMLLIElement>('.sortable-item')).map((item) =>
		getItemData(item)
	);
}

export function getItemElement(list: HTMLUListElement, key: 'id' | 'index', value: unknown) {
	return list.querySelector<HTMLLIElement>(`.sortable-item[data-${key}="${value}"]`);
}

// Thank you, Vojtech Miksu :)
// https://github.com/tajo/react-movable/blob/master/src/utils.ts
export function hasInteractiveElements(target: Element, rootElement: Element) {
	const DISABLED_ELEMENTS = [
		'a',
		'audio',
		'button',
		'input',
		'label',
		'optgroup',
		'option',
		'select',
		'textarea',
		'video',
	];
	const DISABLED_ROLES = ['button', 'checkbox', 'link', 'tab'];

	while (target !== rootElement) {
		if (
			DISABLED_ELEMENTS.includes(target.tagName.toLowerCase()) &&
			!target.classList.contains('sortable-item__handle')
		)
			return true;
		const role = target.getAttribute('role');
		if (role && DISABLED_ROLES.includes(role.toLowerCase())) return true;
		if (target.tagName.toLowerCase() === 'label' && target.hasAttribute('for')) return true;

		if (target.tagName) target = target.parentElement!;
	}

	return false;
}

export function areColliding(a: DOMRect | ItemData, b: DOMRect | ItemData, threshold: number = 1) {
	return (
		a.x + a.width * threshold > b.x &&
		a.x < b.x + b.width * threshold &&
		a.y + a.height * threshold > b.y &&
		a.y < b.y + b.height * threshold
	);
}

function getIntersectionRect(r1: ItemData, r2: ItemData) {
	const x1 = Math.max(r1.x, r2.x);
	const y1 = Math.max(r1.y, r2.y);
	const x2 = Math.min(r1.x + r1.width, r2.x + r2.width);
	const y2 = Math.min(r1.y + r1.height, r2.y + r2.height);

	return { x: x1, y: y1, width: x2 - x1, height: y2 - y1, area: (x2 - x1) * (y2 - y1) };
}

export function getCollidingItem(ghost: ItemData, items: ItemData[], threshold: number) {
	const collidingItems = items.filter((targetItem) => areColliding(ghost, targetItem, threshold));
	if (collidingItems.length > 1) {
		collidingItems.sort((a, b) => {
			const aIntersectionRect = getIntersectionRect(ghost, a);
			const bIntersectionRect = getIntersectionRect(ghost, b);

			return bIntersectionRect.area - aIntersectionRect.area;
		});
	}

	return collidingItems[0];
}

export function sortItems<T>(array: T[], from: number, to: number) {
	const sortedItems = structuredClone(array);
	sortedItems.splice(to < 0 ? sortedItems.length + to : to, 0, sortedItems.splice(from, 1)[0]);
	return sortedItems;
}

export const screenReaderText = {
	item: (index: number, isDisabled: boolean) => {
		return `Draggable item at position ${index + 1}. ${!isDisabled ? 'Press Space Bar to lift it.' : ''}`;
	},

	lifted: (draggedItem: ItemData, listRef: HTMLUListElement) => {
		const element =
			draggedItem.index >= 0
				? listRef.querySelector<HTMLLIElement>(`.sortable-item[data-index="${draggedItem.index}"]`)
						?.textContent
				: 'the item';
		return `Lifted ${element} at position ${
			draggedItem.index + 1
		}. Press Arrow Down or Arrow Right to move it down, Arrow Up or Arrow Left to move it up, and Space Bar to drop it.`;
	},

	dragged: (
		draggedItem: ItemData,
		targetItem: ItemData,
		listRef: HTMLUListElement,
		key: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'
	) => {
		const element =
			draggedItem.index >= 0
				? listRef.querySelector<HTMLLIElement>(`.sortable-item[data-index="${draggedItem.index}"]`)
						?.textContent
				: 'the item';
		const direction = key === 'ArrowUp' || key === 'ArrowLeft' ? 'up' : 'down';
		const position = targetItem.index + 1;
		return `Moved ${element} ${direction} to position ${position}.`;
	},

	dropped: (draggedItem: ItemData, targetItem: ItemData | null, listRef: HTMLUListElement) => {
		const element =
			draggedItem.index >= 0
				? listRef.querySelector<HTMLLIElement>(`.sortable-item[data-index="${draggedItem.index}"]`)
						?.textContent
				: 'the item';
		const direction = targetItem && draggedItem.index > targetItem.index ? 'up' : 'down';
		const result =
			targetItem && draggedItem.index !== targetItem.index
				? `moved ${direction} from position ${draggedItem.index + 1} to ${targetItem.index + 1}`
				: `hasn’t changed position`;
		return `Dropped ${element}, ${result}.`;
	},

	canceled: (draggedItem: ItemData) => {
		return `Movement has been canceled. The item has returned to its starting position of ${
			draggedItem.index + 1
		}.`;
	},
};
