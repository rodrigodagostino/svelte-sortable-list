export interface IItemData {
	id: number;
	index: number;
	x: number;
	y: number;
	width: number;
	height: number;
	innerHTML: string;
}

export function getItemData(item: HTMLElement): IItemData {
	const itemRect = item.getBoundingClientRect();
	return {
		id: +item.dataset.id!,
		index: +item.dataset.index!,
		x: itemRect.x,
		y: itemRect.y,
		width: itemRect.width,
		height: itemRect.height,
		innerHTML: item.querySelector('.sortable-item__inner')!.innerHTML,
	};
}

export function getItemsData(list: HTMLUListElement): IItemData[] {
	return Array.from(
		list.querySelectorAll<HTMLLIElement>('.sortable-item:not(.sortable-item--ghost)')
	).map((item) => getItemData(item));
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

function getIntersectionRect(r1: DOMRect, r2: IItemData) {
	const x1 = Math.max(r1.x, r2.x);
	const y1 = Math.max(r1.y, r2.y);
	const x2 = Math.min(r1.x + r1.width, r2.x + r2.width);
	const y2 = Math.min(r1.y + r1.height, r2.y + r2.height);

	return { x: x1, y: y1, width: x2 - x1, height: y2 - y1, area: (x2 - x1) * (y2 - y1) };
}

export function getCollidingItem(
	ghost: HTMLLIElement,
	itemsRects: IItemData[],
	draggedItemId: number,
	threshold: number
) {
	const ghostRect = ghost.getBoundingClientRect();
	const collidingItems = itemsRects.filter((item) => {
		return (
			draggedItemId !== item.id &&
			ghostRect.x + ghostRect.width * threshold > item.x &&
			ghostRect.x < item.x + item.width * threshold &&
			ghostRect.y + ghostRect.height * threshold > item.y &&
			ghostRect.y < item.y + item.height * threshold
		);
	});
	if (collidingItems.length > 1) {
		collidingItems.sort((a, b) => {
			const aIntersectionRect = getIntersectionRect(ghostRect, a);
			const bIntersectionRect = getIntersectionRect(ghostRect, b);

			return bIntersectionRect.area - aIntersectionRect.area;
		});
	}

	return collidingItems[0];
}

export function reorder<T>(array: T[], from: number, to: number) {
	array = array.slice();
	array.splice(to < 0 ? array.length + to : to, 0, array.splice(from, 1)[0]);
	return array;
}
