import type { ItemData } from '$lib/types.js';

export function getId(element: HTMLElement): string | undefined {
	return String(element.dataset.id);
}

export function getIndex(element: HTMLElement): number | undefined {
	return Number(element.dataset.index);
}

export function getItemData(item: HTMLElement): ItemData {
	const itemRect = item.getBoundingClientRect();
	return {
		id: item.dataset.id!,
		index: +item.dataset.index!,
		x: itemRect.x,
		y: itemRect.y,
		width: itemRect.width,
		height: itemRect.height,
	};
}

export function getItemsData(list: HTMLUListElement): ItemData[] {
	return Array.from(list.querySelectorAll<HTMLLIElement>('.sortable-item')).map((item) =>
		getItemData(item)
	);
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

function getIntersectionRect(r1: DOMRect | ItemData, r2: DOMRect | ItemData) {
	const x1 = Math.max(r1.x, r2.x);
	const y1 = Math.max(r1.y, r2.y);
	const x2 = Math.min(r1.x + r1.width, r2.x + r2.width);
	const y2 = Math.min(r1.y + r1.height, r2.y + r2.height);

	return { x: x1, y: y1, width: x2 - x1, height: y2 - y1, area: (x2 - x1) * (y2 - y1) };
}

export function getCollidingItem(ghost: HTMLElement, items: ItemData[], threshold: number) {
	const ghostRect = ghost.getBoundingClientRect();
	const collidingItems = items.filter((targetItem) =>
		areColliding(ghostRect, targetItem, threshold)
	);
	if (collidingItems.length > 1) {
		collidingItems.sort((a, b) => {
			const aIntersectionRect = getIntersectionRect(ghostRect, a);
			const bIntersectionRect = getIntersectionRect(ghostRect, b);

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

	lifted: (draggedItem: HTMLLIElement) => {
		const textContent = draggedItem.textContent ? draggedItem.textContent : 'the item';
		return `Lifted ${textContent} at position ${
			getIndex(draggedItem)! + 1
		}. Press Arrow Down or Arrow Right to move it down, Arrow Up or Arrow Left to move it up, and Space Bar to drop it.`;
	},

	dragged: (
		draggedItem: HTMLLIElement,
		targetItem: HTMLLIElement,
		key: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'
	) => {
		const textContent = draggedItem.textContent ? draggedItem.textContent : 'the item';
		const direction = key === 'ArrowUp' || key === 'ArrowLeft' ? 'up' : 'down';
		const position = getIndex(targetItem)! + 1;
		return `Moved ${textContent} ${direction} to position ${position}.`;
	},

	dropped: (draggedItem: HTMLLIElement, targetItem: HTMLLIElement | null) => {
		const draggedItemIndex = getIndex(draggedItem)!;
		const targetItemIndex = (targetItem && getIndex(targetItem)) ?? null;

		const element = draggedItem.textContent ? draggedItem.textContent : 'the item';
		const direction =
			!targetItem || targetItemIndex === null
				? null
				: draggedItemIndex > targetItemIndex
					? 'up'
					: 'down';
		const result =
			targetItem && targetItemIndex !== null && draggedItemIndex !== targetItemIndex
				? `moved ${direction} from position ${draggedItemIndex + 1} to ${targetItemIndex + 1}`
				: `hasn’t changed position`;
		return `Dropped ${element}, ${result}.`;
	},

	canceled: (draggedItem: HTMLLIElement) => {
		return `Movement has been canceled. The item has returned to its starting position of ${getIndex(draggedItem)! + 1}.`;
	},
};
