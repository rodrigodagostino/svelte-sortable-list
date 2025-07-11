import { getWritableContext, setWritableContext, type Group } from './index.js';
import type { SortableListElements } from '$lib/types/index.js';

export function setRoot(group: Group, context: SortableListElements['root']) {
	return setWritableContext<SortableListElements['root']>('root', group, context);
}
export function getRoot(group: Group) {
	return getWritableContext<SortableListElements['root']>('root', group);
}

export function setDraggedItem(group: Group, context: SortableListElements['draggedItem']) {
	return setWritableContext<SortableListElements['draggedItem']>('draggedItem', group, context);
}
export function getDraggedItem(group: Group) {
	return getWritableContext<SortableListElements['draggedItem']>('draggedItem', group);
}

export function setTargetItem(group: Group, context: SortableListElements['targetItem']) {
	return setWritableContext<SortableListElements['targetItem']>('targetItem', group, context);
}
export function getTargetItem(group: Group) {
	return getWritableContext<SortableListElements['targetItem']>('targetItem', group);
}

export function setFocusedItem(group: Group, context: SortableListElements['focusedItem']) {
	return setWritableContext<SortableListElements['focusedItem']>('focusedItem', group, context);
}
export function getFocusedItem(group: Group) {
	return getWritableContext<SortableListElements['focusedItem']>('focusedItem', group);
}
