import type { AutoScrollModule, AutoScrollOptions } from '$lib/types/modules.js';

type Direction = 'vertical' | 'horizontal';

function canScrollX(element: HTMLElement) {
	return element.scrollWidth > element.clientWidth;
}

function canScrollY(element: HTMLElement) {
	return element.scrollHeight > element.clientHeight;
}

function shouldAutoScroll(element: HTMLElement, direction: Direction, scrollingSpeed: number) {
	if (direction === 'vertical')
		return (
			(scrollingSpeed < 0 && element.scrollTop > 0) ||
			(scrollingSpeed > 0 && element.scrollTop + element.clientHeight < element.scrollHeight)
		);
	else
		return (
			(scrollingSpeed < 0 && element.scrollLeft > 0) ||
			(scrollingSpeed > 0 && element.scrollLeft + element.clientWidth < element.scrollWidth)
		);
}

function getScrollingSpeed(
	container: HTMLElement,
	clientX: number,
	clientY: number,
	direction: Direction,
	isScrollingDocument: boolean,
	speed: number,
	threshold: number
) {
	const offset =
		direction === 'vertical'
			? container.clientHeight * threshold
			: container.clientWidth * threshold;
	const SPEED_RATIO = 12;
	// In those situations where the container is larger than the viewport,
	// we want to use the document element as reference.
	const rootElement = document.documentElement;
	const containerRect = container.getBoundingClientRect();
	const top = isScrollingDocument ? 0 : containerRect.top;
	const left = isScrollingDocument ? 0 : containerRect.left;
	const right = isScrollingDocument ? rootElement.clientWidth : containerRect.right;
	const bottom = isScrollingDocument ? rootElement.clientHeight : containerRect.bottom;

	if (direction === 'vertical') {
		if (clientY - top < offset) {
			return Math.round(((offset - (clientY - top)) / -SPEED_RATIO) * speed);
		} else if (bottom - clientY < offset) {
			return Math.round(((offset - (bottom - clientY)) / SPEED_RATIO) * speed);
		} else {
			return 0;
		}
	} else {
		if (clientX - left < offset) {
			return Math.round(((offset - (clientX - left)) / -SPEED_RATIO) * speed);
		} else if (right - clientX < offset) {
			return Math.round(((offset - (right - clientX)) / SPEED_RATIO) * speed);
		} else {
			return 0;
		}
	}
}

export function autoScroll({
	speed = 1,
	threshold = 0.2,
	margin = 40,
}: AutoScrollOptions = {}): AutoScrollModule {
	let container: HTMLElement | null = null;
	let scrollSpeed = { x: 0, y: 0 };
	let rafId: number | null = null;

	function scroll() {
		rafId = requestAnimationFrame(() => {
			rafId = null;
			if (
				!container ||
				(!shouldAutoScroll(container, 'horizontal', scrollSpeed.x) &&
					!shouldAutoScroll(container, 'vertical', scrollSpeed.y))
			)
				return;

			container.scrollBy(scrollSpeed.x, scrollSpeed.y);

			if (scrollSpeed.x !== 0 || scrollSpeed.y !== 0) scroll();
		});
	}

	return {
		kind: 'autoScroll',
		margin,
		update(element, clientX, clientY, isScrollingDocument) {
			container = element;
			scrollSpeed = {
				x: canScrollX(element)
					? getScrollingSpeed(
							element,
							clientX,
							clientY,
							'horizontal',
							isScrollingDocument,
							speed,
							threshold
						)
					: 0,
				y: canScrollY(element)
					? getScrollingSpeed(
							element,
							clientX,
							clientY,
							'vertical',
							isScrollingDocument,
							speed,
							threshold
						)
					: 0,
			};

			if ((scrollSpeed.x !== 0 || scrollSpeed.y !== 0) && rafId === null) scroll();
		},
		stop() {
			container = null;
			scrollSpeed = { x: 0, y: 0 };
			if (rafId !== null) cancelAnimationFrame(rafId);
			rafId = null;
		},
	};
}
