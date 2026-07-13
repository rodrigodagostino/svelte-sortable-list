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

export function setItemRectsSnapshot(context: Coordinates['itemRectsSnapshot']) {
	return setWritableContext<Coordinates['itemRectsSnapshot']>('itemRectsSnapshot', context);
}
export function getItemRectsSnapshot() {
	return getWritableContext<Coordinates['itemRectsSnapshot']>('itemRectsSnapshot');
}

export function setScrollOffset(context: Coordinates['scrollOffset']) {
	return setWritableContext<Coordinates['scrollOffset']>('scrollOffset', context);
}
export function getScrollOffset() {
	return getWritableContext<Coordinates['scrollOffset']>('scrollOffset');
}
