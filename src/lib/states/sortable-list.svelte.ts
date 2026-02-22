import { getContext, setContext } from 'svelte';
import type { SortableListRootStateContext as Context } from '$lib/types/index.js';

class SortableListRootState {
	props: Context['props'] = $state({});
	dragState: Context['dragState'] = $state('idle');
	ghostState: Context['ghostState'] = $state('idle');
	draggedItem: Context['draggedItem'] = $state(null);
	targetItem: Context['targetItem'] = $state(null);
	focusedItem: Context['focusedItem'] = $state(null);
	itemRects: Context['itemRects'] = $state(null);
	pointer: Context['pointer'] = $state(null);
	pointerOrigin: Context['pointerOrigin'] = $state(null);
	isBetweenBounds: Context['isBetweenBounds'] = $state(true);
	isRTL: Context['isRTL'] = $state(false);
}

const KEY = Symbol('SortableList.RootState');

export function setSortableListRootState() {
	return setContext(KEY, new SortableListRootState());
}

export function getSortableListRootState() {
	return getContext<ReturnType<typeof setSortableListRootState>>(KEY);
}
