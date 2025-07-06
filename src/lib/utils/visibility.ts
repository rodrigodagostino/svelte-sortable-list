import { getTranslateValues } from './index.js';

export function isFullyVisible(element: HTMLElement, container: HTMLElement) {
	const elementRect = element.getBoundingClientRect();
	const elementStyles = window.getComputedStyle(element);
	const elementTranslate = getTranslateValues(element);
	const containerRect = container.getBoundingClientRect();
	// In those situations where the container is larger than the viewport,
	// we want to use the document element as reference.
	const docElement = document.documentElement;
	const limitTop = containerRect.height < docElement.clientHeight ? containerRect.top : 0;
	const limitBottom =
		containerRect.height < docElement.clientHeight ? containerRect.bottom : docElement.clientHeight;
	const limitLeft = containerRect.width < docElement.clientWidth ? containerRect.left : 0;
	const limitRight =
		containerRect.width < docElement.clientWidth ? containerRect.right : docElement.clientWidth;
	const translateX = elementTranslate?.x || 0;
	const translateY = elementTranslate?.y || 0;
	const marginTop = parseFloat(elementStyles.marginTop);
	const marginBottom = parseFloat(elementStyles.marginBottom);
	const marginLeft = parseFloat(elementStyles.marginLeft);
	const marginRight = parseFloat(elementStyles.marginRight);

	return (
		elementRect.top - translateY + marginTop > limitTop &&
		elementRect.bottom - translateY + marginBottom < limitBottom &&
		elementRect.left - translateX + marginLeft > limitLeft &&
		elementRect.right - translateX + marginRight < limitRight
	);
}
