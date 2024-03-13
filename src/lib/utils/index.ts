import type { IItemData } from '$lib/types.js';

export function getItemData(item: HTMLElement): IItemData {
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

export function getItemsData(list: HTMLUListElement): IItemData[] {
	return Array.from(list.querySelectorAll<HTMLLIElement>('.sortable-item')).map((item) =>
		getItemData(item)
	);
}

export function getFocusedItemElement(list: HTMLUListElement, key: 'id' | 'index', value: string) {
	return list.querySelector<HTMLLIElement>(`.sortable-item[data-${key}="${value}"]`);
}

// Thank you, Vojtech Miksu :)
// https://github.com/tajo/react-movable/blob/master/src/utils.ts
export function checkIfInteractive(target: Element, rootElement: Element) {
	const DISABLED_ELEMENTS = [
		'a',
		'audio',
		'button',
		'input',
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

function getIntersectionRect(r1: IItemData, r2: IItemData) {
	const x1 = Math.max(r1.x, r2.x);
	const y1 = Math.max(r1.y, r2.y);
	const x2 = Math.min(r1.x + r1.width, r2.x + r2.width);
	const y2 = Math.min(r1.y + r1.height, r2.y + r2.height);

	return { x: x1, y: y1, width: x2 - x1, height: y2 - y1, area: (x2 - x1) * (y2 - y1) };
}

export function getCollidingItem(ghost: IItemData, items: IItemData[], threshold: number) {
	const collidingItems = items.filter((targetItem) => {
		return (
			ghost.id !== targetItem.id &&
			ghost.x + ghost.width * threshold > targetItem.x &&
			ghost.x < targetItem.x + targetItem.width * threshold &&
			ghost.y + ghost.height * threshold > targetItem.y &&
			ghost.y < targetItem.y + targetItem.height * threshold
		);
	});
	if (collidingItems.length > 1) {
		collidingItems.sort((a, b) => {
			const aIntersectionRect = getIntersectionRect(ghost, a);
			const bIntersectionRect = getIntersectionRect(ghost, b);

			return bIntersectionRect.area - aIntersectionRect.area;
		});
	}

	return collidingItems[0];
}

export function reorderItems<T>(array: T[], from: number, to: number) {
	array.splice(to < 0 ? array.length + to : to, 0, array.splice(from, 1)[0]);
	return array;
}

export const screenReaderText = {
	item: (index: number) => {
		return `Draggable item at position ${index + 1}. Press Space Bar to lift it.`;
	},

	lifted: (draggedItem: IItemData, listRef: HTMLUListElement) => {
		const element =
			draggedItem.index >= 0
				? listRef.querySelector<HTMLLIElement>(`.sortable-item[data-index="${draggedItem.index}"]`)
						?.textContent
				: 'the item';
		return `Lifted ${element} at position ${
			draggedItem.index + 1
		}. Press Arrow Down to move it down, Arrow Up to move it up, Space Bar to drop it.`;
	},

	dragged: (
		draggedItem: IItemData,
		targetItem: IItemData,
		listRef: HTMLUListElement,
		key: 'ArrowUp' | 'ArrowDown'
	) => {
		const element =
			draggedItem.index >= 0
				? listRef.querySelector<HTMLLIElement>(`.sortable-item[data-index="${draggedItem.index}"]`)
						?.textContent
				: 'the item';
		const direction = key === 'ArrowUp' ? 'up' : 'down';
		const position = targetItem.index + 1;
		return `Moved ${element} ${direction} to position ${position}.`;
	},

	dropped: (draggedItem: IItemData, targetItem: IItemData | null, listRef: HTMLUListElement) => {
		const element =
			draggedItem.index >= 0
				? listRef.querySelector<HTMLLIElement>(`.sortable-item[data-index="${draggedItem.index}"]`)
						?.textContent
				: 'the item';
		const result =
			targetItem && draggedItem.index !== targetItem.index
				? `moved from position ${draggedItem.index + 1} to ${targetItem.index + 1}`
				: `hasn’t changed position`;
		return `Dropped ${element}, ${result}.`;
	},

	canceled: (draggedItem: IItemData) => {
		return `Movement has been cancelled. The item has returned to its starting position of ${
			draggedItem.index + 1
		}.`;
	},
};
