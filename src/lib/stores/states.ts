import { getWritableContext, setWritableContext, type Group } from './index.js';
import type { SortableListDragState as DragState } from '$lib/types/states.js';

export function setDragState(group: Group, context: DragState) {
	return setWritableContext<DragState>('dragState', group, context);
}
export function getDragState(group: Group) {
	return getWritableContext<DragState>('dragState', group);
}

export function setIsBetweenBounds(group: Group, context: boolean) {
	return setWritableContext<boolean>('isBetweenBounds', group, context);
}
export function getIsBetweenBounds(group: Group) {
	return getWritableContext<boolean>('isBetweenBounds', group);
}

export function setIsRTL(group: Group, context: boolean) {
	return setWritableContext<boolean>('isRTL', group, context);
}
export function getIsRTL(group: Group) {
	return getWritableContext<boolean>('isRTL', group);
}
