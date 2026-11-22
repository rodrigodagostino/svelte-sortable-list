import { getTranslateValues } from './styles.js';
import type { SortableListRootState as RootState } from '$lib/states/index.js';
import type { SortableListRootProps as RootProps } from '$lib/types/index.js';

export const getClosestScrollableAncestor = (element: HTMLElement) => {
	if (typeof document === 'undefined') return undefined;
	if (!element) return document.documentElement;

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

export function isRootElement(element: HTMLElement, direction: RootProps['direction']) {
	const rootElement = document.documentElement;
	return (
		element === rootElement ||
		(direction === 'vertical'
			? element.clientHeight > rootElement.clientHeight
			: element.clientWidth > rootElement.clientWidth)
	);
}

export function canScroll(element: HTMLElement | undefined) {
	return (
		element &&
		(element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth)
	);
}

export function scrollIntoView(
	element: HTMLElement,
	container: HTMLElement,
	direction: RootProps['direction'],
	step: 1 | -1,
	isScrollingDocument: boolean,
	margin = 40
) {
	const elementRect = element.getBoundingClientRect();
	const elementStyles = window.getComputedStyle(element);
	const elementTranslate = getTranslateValues(element);
	const containerRect = container.getBoundingClientRect();
	const containerStyles = window.getComputedStyle(container);

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
					margin
				: elementRect.left -
					(isScrollingDocument ? 0 : containerRect.left) +
					container.scrollLeft -
					parseFloat(containerStyles.borderLeftWidth) -
					parseFloat(elementStyles.marginLeft) * 2 -
					(elementTranslate?.x || 0) -
					margin
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
					margin
				: elementRect.top -
					(isScrollingDocument ? 0 : containerRect.top) +
					container.scrollTop -
					parseFloat(containerStyles.borderTopWidth) -
					parseFloat(elementStyles.marginTop) * 2 -
					(elementTranslate?.y || 0) -
					margin
			: undefined;

	container.scrollTo({
		left,
		top,
		behavior: 'smooth',
	});
}

export function updateScrollOffset(
	scrollableAncestor: HTMLElement | undefined,
	scrollOrigin: { left: number; top: number },
	scrollOffset: RootState['scrollOffset']
) {
	if (!scrollableAncestor) return scrollOffset;

	const left = scrollableAncestor.scrollLeft - scrollOrigin.left;
	const top = scrollableAncestor.scrollTop - scrollOrigin.top;
	if (left === scrollOffset.left && top === scrollOffset.top) return scrollOffset;

	return { left, top };
}
