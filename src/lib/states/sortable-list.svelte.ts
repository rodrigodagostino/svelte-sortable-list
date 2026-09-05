import { getContext, setContext } from 'svelte';
import type {
	SortableListRootStateContext as RootStateContext,
	SortableListItemStateContext as ItemStateContext,
} from '$lib/types/index.js';

export class SortableListRootState {
	props: RootStateContext['props'] = $state({});
	dragState: RootStateContext['dragState'] = $state('idle');
	draggedItem: RootStateContext['draggedItem'] = $state(null);
	targetItem: RootStateContext['targetItem'] = $state(null);
	focusedItem: RootStateContext['focusedItem'] = $state(null);
	itemRects: RootStateContext['itemRects'] = $state.raw(null);
	pointer: RootStateContext['pointer'] = $state.raw(null);
	pointerOrigin: RootStateContext['pointerOrigin'] = $state.raw(null);
	fixedOrigin: RootStateContext['fixedOrigin'] = $state.raw({ x: 0, y: 0 });
	isWithinBounds: RootStateContext['isWithinBounds'] = $state(true);
	scrollOffset: RootStateContext['scrollOffset'] = $state.raw({ left: 0, top: 0 });
	isRTL: RootStateContext['isRTL'] = $state(false);
	interruptDropTransition: RootStateContext['interruptDropTransition'] = $state.raw(null);
}

const ROOT_KEY = Symbol('SortableList.RootState');

export function setSortableListRootState() {
	return setContext(ROOT_KEY, new SortableListRootState());
}

export function getSortableListRootState() {
	return getContext<ReturnType<typeof setSortableListRootState>>(ROOT_KEY);
}

export class SortableListItemState {
	props: ItemStateContext['props'] = $state({});
}

const ITEM_KEY = Symbol('SortableList.ItemState');

export function setSortableListItemState() {
	return setContext(ITEM_KEY, new SortableListItemState());
}

export function getSortableListItemState() {
	return getContext<ReturnType<typeof setSortableListItemState>>(ITEM_KEY);
}
