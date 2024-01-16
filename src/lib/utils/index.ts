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
		if (DISABLED_ELEMENTS.includes(target.tagName.toLowerCase())) return true;
		const role = target.getAttribute('role');
		if (role && DISABLED_ROLES.includes(role.toLowerCase())) return true;
		if (target.tagName.toLowerCase() === 'label' && target.hasAttribute('for')) return true;

		if (target.tagName) target = target.parentElement!;
	}

	return false;
}

function getIntersectionRect(r1: DOMRect, r2: DOMRect) {
	const x1 = Math.max(r1.x, r2.x);
	const y1 = Math.max(r1.y, r2.y);
	const x2 = Math.min(r1.x + r1.width, r2.x + r2.width);
	const y2 = Math.min(r1.y + r1.height, r2.y + r2.height);

	return { x: x1, y: y1, width: x2 - x1, height: y2 - y1, area: (x2 - x1) * (y2 - y1) };
}

export const getCollidingItem = (
	ghost: HTMLLIElement,
	items: NodeListOf<HTMLLIElement>,
	draggedItemId: number,
	threshold: number
): HTMLLIElement => {
	const ghostRect = ghost.getBoundingClientRect();
	const collidingItems = Array.from(items).filter((item) => {
		const itemId = item.dataset.id ? +item.dataset.id : null;
		const itemRect = item.getBoundingClientRect();
		return (
			draggedItemId !== itemId &&
			ghostRect.x + ghostRect.width * threshold > itemRect.x &&
			ghostRect.x < itemRect.x + itemRect.width * threshold &&
			ghostRect.y + ghostRect.height * threshold > itemRect.y &&
			ghostRect.y < itemRect.y + itemRect.height * threshold
		);
	});
	if (collidingItems.length > 1) {
		collidingItems.sort((a, b) => {
			const aIntersectionRect = getIntersectionRect(ghostRect, a.getBoundingClientRect());
			const bIntersectionRect = getIntersectionRect(ghostRect, b.getBoundingClientRect());

			return bIntersectionRect.area - aIntersectionRect.area;
		});
	}

	return collidingItems[0];
};

export function reorder<T>(array: T[], from: number, to: number) {
	array = array.slice();
	array.splice(to < 0 ? array.length + to : to, 0, array.splice(from, 1)[0]);
	return array;
}
