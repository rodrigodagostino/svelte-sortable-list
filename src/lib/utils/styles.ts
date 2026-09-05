import type {
	ItemRect,
	SortableListRootStateContext as RootStateContext,
} from '$lib/types/index.js';

/**
 * Converts a viewport coordinate into the `left`/`top` value that places a `position: fixed`
 * element there. Both match unless an ancestor establishes a containing block (`transform`,
 * `filter`, `contain`, `will-change`, …), in which case `fixedOrigin` is where that block’s
 * origin sits in the viewport (see `getFixedOrigin()`).
 */
export function toFixedPosition(
	axis: 'x' | 'y',
	value: number,
	fixedOrigin: RootStateContext['fixedOrigin']
) {
	return value - fixedOrigin[axis];
}

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
