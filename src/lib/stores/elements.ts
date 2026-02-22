import { getWritableContext, setWritableContext } from './index.js';
import type { SortableListElements as Elements } from '$lib/types/index.js';

export function setDraggedItem(context: Elements['draggedItem']) {
	return setWritableContext<Elements['draggedItem']>('draggedItem', context);
}
export function getDraggedItem() {
	return getWritableContext<Elements['draggedItem']>('draggedItem');
}

export function setTargetItem(context: Elements['targetItem']) {
	return setWritableContext<Elements['targetItem']>('targetItem', context);
}
export function getTargetItem() {
	return getWritableContext<Elements['targetItem']>('targetItem');
}

export function setFocusedItem(context: Elements['focusedItem']) {
	return setWritableContext<Elements['focusedItem']>('focusedItem', context);
}
export function getFocusedItem() {
	return getWritableContext<Elements['focusedItem']>('focusedItem');
}
