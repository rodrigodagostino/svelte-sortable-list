import { getWritableContext, setWritableContext } from './index.js';
import type { SortableListCoordinates as Coordinates } from '$lib/types/index.js';

export function setPointer(context: Coordinates['pointer']) {
	return setWritableContext<Coordinates['pointer']>('pointer', context);
}
export function getPointer() {
	return getWritableContext<Coordinates['pointer']>('pointer');
}

export function setPointerOrigin(context: Coordinates['pointerOrigin']) {
	return setWritableContext<Coordinates['pointerOrigin']>('pointerOrigin', context);
}
export function getPointerOrigin() {
	return getWritableContext<Coordinates['pointerOrigin']>('pointerOrigin');
}

export function setItemRects(context: Coordinates['itemRects']) {
	return setWritableContext<Coordinates['itemRects']>('itemRects', context);
}
export function getItemRects() {
	return getWritableContext<Coordinates['itemRects']>('itemRects');
}
