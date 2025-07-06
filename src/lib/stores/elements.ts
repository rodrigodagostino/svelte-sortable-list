import { getWritableContext, setWritableContext, type Group } from './index.js';
import type { SortableListElements as Elements } from '$lib/types/index.js';

export function setRoot(group: Group, context: Elements['root']) {
	return setWritableContext<Elements['root']>('root', group, context);
}
export function getRoot(group: Group) {
	return getWritableContext<Elements['root']>('root', group);
}

export function setDraggedItem(group: Group, context: Elements['draggedItem']) {
	return setWritableContext<Elements['draggedItem']>('draggedItem', group, context);
}
export function getDraggedItem(group: Group) {
	return getWritableContext<Elements['draggedItem']>('draggedItem', group);
}

export function setTargetItem(group: Group, context: Elements['targetItem']) {
	return setWritableContext<Elements['targetItem']>('targetItem', group, context);
}
export function getTargetItem(group: Group) {
	return getWritableContext<Elements['targetItem']>('targetItem', group);
}

export function setFocusedItem(group: Group, context: Elements['focusedItem']) {
	return setWritableContext<Elements['focusedItem']>('focusedItem', group, context);
}
export function getFocusedItem(group: Group) {
	return getWritableContext<Elements['focusedItem']>('focusedItem', group);
}
