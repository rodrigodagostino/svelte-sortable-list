import { getWritableContext, setWritableContext } from './index.js';
import type { SortableListCoordinates } from '$lib/types/index.js';

export function setPointer(context: SortableListCoordinates['pointer']) {
	return setWritableContext<SortableListCoordinates['pointer']>('pointer', context);
}
export function getPointer() {
	return getWritableContext<SortableListCoordinates['pointer']>('pointer');
}

export function setPointerOrigin(context: SortableListCoordinates['pointerOrigin']) {
	return setWritableContext<SortableListCoordinates['pointerOrigin']>('pointerOrigin', context);
}
export function getPointerOrigin() {
	return getWritableContext<SortableListCoordinates['pointerOrigin']>('pointerOrigin');
}

export function setItemsData(context: SortableListCoordinates['itemsData']) {
	return setWritableContext<SortableListCoordinates['itemsData']>('itemsData', context);
}
export function getItemsData() {
	return getWritableContext<SortableListCoordinates['itemsData']>('itemsData');
}
