import { getWritableContext, setWritableContext } from './index.js';
import type { SortableListElements } from '$lib/types/index.js';

export function setDraggedItem(context: SortableListElements['draggedItem']) {
	return setWritableContext<SortableListElements['draggedItem']>('draggedItem', context);
}
export function getDraggedItem() {
	return getWritableContext<SortableListElements['draggedItem']>('draggedItem');
}

export function setTargetItem(context: SortableListElements['targetItem']) {
	return setWritableContext<SortableListElements['targetItem']>('targetItem', context);
}
export function getTargetItem() {
	return getWritableContext<SortableListElements['targetItem']>('targetItem');
}

export function setFocusedItem(context: SortableListElements['focusedItem']) {
	return setWritableContext<SortableListElements['focusedItem']>('focusedItem', context);
}
export function getFocusedItem() {
	return getWritableContext<SortableListElements['focusedItem']>('focusedItem');
}
