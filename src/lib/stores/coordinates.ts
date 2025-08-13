import { getWritableContext, setWritableContext, type Group } from './index.js';
import type { SortableListCoordinates as Coordinates } from '$lib/types/index.js';

export function setPointer(group: Group, context: Coordinates['pointer']) {
	return setWritableContext<Coordinates['pointer']>('pointer', group, context);
}
export function getPointer(group: Group) {
	return getWritableContext<Coordinates['pointer']>('pointer', group);
}

export function setPointerOrigin(group: Group, context: Coordinates['pointerOrigin']) {
	return setWritableContext<Coordinates['pointerOrigin']>('pointerOrigin', group, context);
}
export function getPointerOrigin(group: Group) {
	return getWritableContext<Coordinates['pointerOrigin']>('pointerOrigin', group);
}

export function setItemRects(group: Group, context: Coordinates['itemRects']) {
	return setWritableContext<Coordinates['itemRects']>('itemRects', group, context);
}
export function getItemRects(group: Group) {
	return getWritableContext<Coordinates['itemRects']>('itemRects', group);
}
