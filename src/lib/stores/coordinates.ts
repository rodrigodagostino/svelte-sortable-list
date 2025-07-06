import { getWritableContext, setWritableContext, type Group } from './index.js';
import type { SortableListCoordinates } from '$lib/types/index.js';

export function setPointer(group: Group, context: SortableListCoordinates['pointer']) {
	return setWritableContext<SortableListCoordinates['pointer']>('pointer', group, context);
}
export function getPointer(group: Group) {
	return getWritableContext<SortableListCoordinates['pointer']>('pointer', group);
}

export function setPointerOrigin(group: Group, context: SortableListCoordinates['pointerOrigin']) {
	return setWritableContext<SortableListCoordinates['pointerOrigin']>(
		'pointerOrigin',
		group,
		context
	);
}
export function getPointerOrigin(group: Group) {
	return getWritableContext<SortableListCoordinates['pointerOrigin']>('pointerOrigin', group);
}

export function setItemRects(group: Group, context: SortableListCoordinates['itemRects']) {
	return setWritableContext<SortableListCoordinates['itemRects']>('itemRects', group, context);
}
export function getItemRects(group: Group) {
	return getWritableContext<SortableListCoordinates['itemRects']>('itemRects', group);
}
