import { getWritableContext, setWritableContext } from './index.js';
import type { SortableListDragState as DragState } from '$lib/types/states.js';

export function setDragState(context: DragState) {
	return setWritableContext<DragState>('dragState', context);
}
export function getDragState() {
	return getWritableContext<DragState>('dragState');
}

export function setIsBetweenBounds(context: boolean) {
	return setWritableContext<boolean>('isBetweenBounds', context);
}
export function getIsBetweenBounds() {
	return getWritableContext<boolean>('isBetweenBounds');
}

export function setIsRTL(context: boolean) {
	return setWritableContext<boolean>('isRTL', context);
}
export function getIsRTL() {
	return getWritableContext<boolean>('isRTL');
}
