import { getTranslateValues } from './index.js';
import type { SortableListRootProps } from '$lib/types/index.js';

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

export function isRootElement(element: HTMLElement, direction: SortableListRootProps['direction']) {
	const docElement = document.documentElement;
	return (
		element === docElement ||
		(direction === 'vertical'
			? element.clientHeight > docElement.clientHeight
			: element.clientWidth > docElement.clientWidth)
	);
}

export function isScrollable(
	element: HTMLElement | undefined,
	direction: SortableListRootProps['direction']
) {
	return (
		element &&
		((direction === 'vertical' && element.scrollHeight > element.clientHeight) ||
			(direction === 'horizontal' && element.scrollWidth > element.clientWidth))
	);
}

export function shouldAutoScroll(
	element: HTMLElement,
	direction: SortableListRootProps['direction'],
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

export function scrollIntoView(
	element: HTMLElement,
	container: HTMLElement,
	direction: SortableListRootProps['direction'],
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

function getScrollingOffset(element: HTMLElement, direction: SortableListRootProps['direction']) {
	return direction === 'vertical' ? element.clientHeight * 0.2 : element.clientWidth * 0.2;
}

export function getScrollingSpeed(
	container: HTMLElement,
	clientX: PointerEvent['clientX'],
	clientY: PointerEvent['clientY'],
	direction: SortableListRootProps['direction'],
	isScrollingDocument: boolean
) {
	const offset = getScrollingOffset(container, direction);
	const SPEED_RATIO = 32;
	// In those situations where the container is larger than the viewport,
	// we want to use the document element as reference.
	const docElement = document.documentElement;
	const containerRect = container.getBoundingClientRect();
	const top = isScrollingDocument ? 0 : containerRect.top;
	const left = isScrollingDocument ? 0 : containerRect.left;
	const right = isScrollingDocument ? docElement.clientWidth : containerRect.right;
	const bottom = isScrollingDocument ? docElement.clientHeight : containerRect.bottom;

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
