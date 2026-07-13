import { getContext, setContext } from 'svelte';
import type { SortableListRootStateContext as Context } from '$lib/types/index.js';

class SortableListRootState {
	props: Context['props'] = $state({});
	dragState: Context['dragState'] = $state('idle');
	ghostState: Context['ghostState'] = $state('idle');
	draggedItem: Context['draggedItem'] = $state(null);
	targetItem: Context['targetItem'] = $state(null);
	focusedItem: Context['focusedItem'] = $state(null);
	itemRectsSnapshot: Context['itemRectsSnapshot'] = $state.raw(null);
	pointer: Context['pointer'] = $state.raw(null);
	pointerOrigin: Context['pointerOrigin'] = $state.raw(null);
	isBetweenBounds: Context['isBetweenBounds'] = $state(true);
	scrollOffset: Context['scrollOffset'] = $state.raw({ left: 0, top: 0 });
	isRTL: Context['isRTL'] = $state(false);
}

const KEY = Symbol('SortableList.RootState');

export function setSortableListRootState() {
	return setContext(KEY, new SortableListRootState());
}

export function getSortableListRootState() {
	return getContext<ReturnType<typeof setSortableListRootState>>(KEY);
}
