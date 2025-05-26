import { getTranslateValues } from './index.js';

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
