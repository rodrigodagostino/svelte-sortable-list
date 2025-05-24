import type { ItemData, SortableItemProps, SortableListProps } from '$lib/types/index.js';

export function getId(element: HTMLElement): string {
	return String(element.dataset.id);
}

export function getIndex(element: HTMLElement): number {
	return Number(element.dataset.index);
}

function getTranslateValues(element: HTMLElement) {
	const style = window.getComputedStyle(element);
	if (style.transform === 'none') return;
	const matrix = style.transform.match(/matrix.*\((.+)\)/)![1].split(', ');

	return {
		x: Number(matrix[12] || matrix[4] || 0),
		y: Number(matrix[13] || matrix[5] || 0),
		z: Number(matrix[14] || 0),
	};
}

export function getItemData(item: HTMLElement): ItemData {
	const itemRect = item.getBoundingClientRect();
	const itemTranslate = getTranslateValues(item);
	return {
		id: item.dataset.id!,
		index: Number(item.dataset.index),
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

// Thank you, Vojtech Miksu :)
// https://github.com/tajo/react-movable/blob/master/src/utils.ts
export function isOrResidesInInteractiveElement(target: HTMLElement, root: HTMLElement) {
	const INTERACTIVE_ELEMENTS = [
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
	const INTERACTIVE_ROLES = ['button', 'checkbox', 'link', 'tab'];

	while (target !== root) {
		if (target.dataset.role && target.dataset.role === 'handle') return false;
		if (INTERACTIVE_ELEMENTS.includes(target.tagName.toLowerCase())) return true;
		const role = target.getAttribute('role');
		if (role && INTERACTIVE_ROLES.includes(role.toLowerCase())) return true;
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

export function getCollidingItem(
	ghost: HTMLElement,
	items: ItemData[],
	threshold: SortableListProps['swapThreshold']
) {
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

export const getClosestScrollableAncestor = (element: HTMLElement) => {
	if (!element) return undefined;

	let parent = element.parentElement;
	while (parent) {
		const { overflow } = window.getComputedStyle(parent);
		if (
			overflow.includes('auto') ||
			overflow.includes('scroll') ||
			parent.tagName === 'DIALOG' ||
			parent.getAttribute('role') === 'dialog' ||
			parent.getAttribute('aria-modal') === 'true'
		)
			return parent;
		parent = parent.parentElement;
	}

	return document.documentElement;
};

export function isRootElement(element: HTMLElement, direction: SortableListProps['direction']) {
	const rootElement = document.documentElement;
	return (
		element === rootElement ||
		(direction === 'vertical'
			? element.clientHeight > rootElement.clientHeight
			: element.clientWidth > rootElement.clientWidth)
	);
}

export function isFullyVisible(element: HTMLElement, container: HTMLElement) {
	const elementRect = element.getBoundingClientRect();
	const elementStyles = window.getComputedStyle(element);
	const elementTranslate = getTranslateValues(element);
	const containerRect = container.getBoundingClientRect();
	// In those situations where the container is larger than the viewport,
	// we want to use the root as reference.
	const rootElement = document.documentElement;
	const limitTop = containerRect.height < rootElement.clientHeight ? containerRect.top : 0;
	const limitBottom =
		containerRect.height < rootElement.clientHeight
			? containerRect.bottom
			: rootElement.clientHeight;
	const limitLeft = containerRect.width < rootElement.clientWidth ? containerRect.left : 0;
	const limitRight =
		containerRect.width < rootElement.clientWidth ? containerRect.right : rootElement.clientWidth;

	return (
		elementRect.top - (elementTranslate?.y || 0) + parseFloat(elementStyles.marginTop) > limitTop &&
		elementRect.bottom - (elementTranslate?.y || 0) + parseFloat(elementStyles.marginBottom) <
			limitBottom &&
		elementRect.left - (elementTranslate?.x || 0) + parseFloat(elementStyles.marginLeft) >
			limitLeft &&
		elementRect.right - (elementTranslate?.x || 0) + parseFloat(elementStyles.marginRight) <
			limitRight
	);
}

export function scrollIntoView(
	element: HTMLElement,
	container: HTMLElement,
	direction: SortableListProps['direction'],
	step: 1 | -1,
	isScrollingDocument: boolean
) {
	const elementRect = element.getBoundingClientRect();
	const elementStyles = window.getComputedStyle(element);
	const elementTranslate = getTranslateValues(element);
	const containerRect = container.getBoundingClientRect();
	const containerStyles = window.getComputedStyle(container);
	const SCROLL_MARGIN = 40;

	const left =
		direction === 'horizontal'
			? step === 1
				? elementRect.right -
					(isScrollingDocument ? 0 : containerRect.left) -
					container.clientWidth +
					container.scrollLeft -
					parseFloat(containerStyles.borderRightWidth) +
					parseFloat(elementStyles.marginRight) * 2 -
					(elementTranslate?.x || 0) +
					SCROLL_MARGIN
				: elementRect.left -
					(isScrollingDocument ? 0 : containerRect.left) +
					container.scrollLeft -
					parseFloat(containerStyles.borderLeftWidth) -
					parseFloat(elementStyles.marginLeft) * 2 -
					(elementTranslate?.x || 0) -
					SCROLL_MARGIN
			: undefined;
	const top =
		direction === 'vertical'
			? step === 1
				? elementRect.bottom -
					(isScrollingDocument ? 0 : containerRect.top) -
					container.clientHeight +
					container.scrollTop -
					parseFloat(containerStyles.borderBottomWidth) +
					parseFloat(elementStyles.marginBottom) * 2 -
					(elementTranslate?.y || 0) +
					SCROLL_MARGIN
				: elementRect.top -
					(isScrollingDocument ? 0 : containerRect.top) +
					container.scrollTop -
					parseFloat(containerStyles.borderTopWidth) -
					parseFloat(elementStyles.marginTop) * 2 -
					(elementTranslate?.y || 0) -
					SCROLL_MARGIN
			: undefined;

	container.scrollTo({
		left,
		top,
		behavior: 'smooth',
	});
}

export function isScrollable(
	element: HTMLElement | undefined,
	direction: SortableListProps['direction']
) {
	return (
		element &&
		((direction === 'vertical' && element.scrollHeight > element.clientHeight) ||
			(direction === 'horizontal' && element.scrollWidth > element.clientWidth))
	);
}

export function shouldAutoScroll(
	element: HTMLElement,
	direction: SortableListProps['direction'],
	scrollingSpeed: number
) {
	if (direction === 'vertical')
		return (
			(element?.scrollTop > 0 && scrollingSpeed < 0) ||
			(element?.scrollTop + element?.clientHeight < element?.scrollHeight && scrollingSpeed > 0)
		);
	else
		return (
			(element?.scrollLeft > 0 && scrollingSpeed < 0) ||
			(element?.scrollLeft + element?.clientWidth < element?.scrollWidth && scrollingSpeed > 0)
		);
}

function getScrollingOffset(element: HTMLElement, direction: SortableListProps['direction']) {
	return direction === 'vertical' ? element.clientHeight * 0.2 : element.clientWidth * 0.2;
}

export function getScrollingSpeed(
	container: HTMLElement,
	clientX: PointerEvent['clientX'],
	clientY: PointerEvent['clientY'],
	direction: SortableListProps['direction'],
	isScrollingDocument: boolean
) {
	const offset = getScrollingOffset(container, direction);
	const SPEED_RATIO = 40;
	// In those situations where the container is larger than the viewport,
	// we want to use the root element as reference.
	const rootElement = document.documentElement;
	const rect = container.getBoundingClientRect();
	const top = isScrollingDocument ? 0 : rect.top;
	const left = isScrollingDocument ? 0 : rect.left;
	const right = isScrollingDocument ? rootElement.clientWidth : rect.right;
	const bottom = isScrollingDocument ? rootElement.clientHeight : rect.bottom;

	if (direction === 'vertical') {
		if (clientY - top < offset) {
			return Math.round((offset - (clientY - top)) / -SPEED_RATIO);
		} else if (bottom - clientY < offset) {
			return Math.round((offset - (bottom - clientY)) / SPEED_RATIO);
		} else {
			return 0;
		}
	} else {
		if (clientX - left < offset) {
			return Math.round((offset - (clientX - left)) / -SPEED_RATIO);
		} else if (right - clientX < offset) {
			return Math.round((offset - (right - clientX)) / SPEED_RATIO);
		} else {
			return 0;
		}
	}
}

export function dispatch(target: HTMLElement, name: string, detail: object) {
	const event = new CustomEvent(name, { bubbles: true, detail });
	target.dispatchEvent(event);
}

export function sortItems<T>(items: T[], from: number, to: number) {
	const clone = structuredClone(items);
	clone.splice(to < 0 ? clone.length + to : to, 0, clone.splice(from, 1)[0]);
	return clone;
}

export function removeItem<T>(items: T[], index: SortableItemProps['index']) {
	const clone = structuredClone(items);
	clone.splice(index, 1);
	return clone;
}

export const screenReaderText = {
	item: (index: SortableItemProps['index'], isDisabled: SortableItemProps['isDisabled']) => {
		return [
			`Draggable item at position ${index + 1}.`,
			...(!isDisabled ? ['Press Space Bar to lift it.'] : []),
		].join(' ');
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
		key: 'ArrowUp' | 'ArrowLeft' | 'ArrowDown' | 'ArrowRight' | 'Home' | 'End'
	) => {
		const textContent = draggedItem.textContent ? draggedItem.textContent : 'the item';
		const direction = key === 'ArrowUp' || key === 'ArrowLeft' || key === 'Home' ? 'up' : 'down';
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
