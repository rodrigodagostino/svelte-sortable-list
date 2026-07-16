import type { ItemRect } from '$lib/types/index.js';

const MATRIX_REGEX = /matrix.*\((.+)\)/;

export function getTranslateValues(element: HTMLElement) {
	const style = window.getComputedStyle(element);
	if (style.transform === 'none') return;
	const matrix = style.transform.match(MATRIX_REGEX)![1].split(', ');

	return {
		x: Number(matrix[12] || matrix[4] || 0),
		y: Number(matrix[13] || matrix[5] || 0),
		z: Number(matrix[14] || 0),
	};
}

export function calculateTranslate(
	axis: 'x' | 'y',
	a: DOMRect | ItemRect,
	b: DOMRect | ItemRect,
	aIndex: number,
	bIndex: number
) {
	const dimension = axis === 'x' ? 'width' : 'height';
	return aIndex < bIndex ? a[axis] - b[axis] + a[dimension] - b[dimension] : a[axis] - b[axis];
}

export function calculateTranslateWithAlignment(
	root: HTMLElement,
	a: DOMRect | ItemRect,
	b: DOMRect | ItemRect
) {
	const alignItems = window.getComputedStyle(root).alignItems;
	return alignItems === 'center'
		? a.y - b.y + (a.height - b.height) / 2
		: alignItems === 'end' || alignItems === 'flex-end'
			? a.bottom - b.bottom
			: a.y - b.y;
}
