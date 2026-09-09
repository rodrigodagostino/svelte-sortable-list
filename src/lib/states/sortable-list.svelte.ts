import type {
	SortableListRootProps as RootProps,
	SortableListItemProps as ItemProps,
	ItemRect,
} from '$lib/types/index.js';
import { getContext, setContext } from 'svelte';

export class SortableListRootState {
	props: RootProps = $state({});
	dragState:
		| 'idle'
		| 'ptr-drag-start'
		| 'ptr-drag'
		| 'ptr-predrop'
		| 'ptr-drop'
		| 'ptr-cancel'
		| 'ptr-remove'
		| 'kbd-drag-start'
		| 'kbd-drag'
		| 'kbd-drop'
		| 'kbd-cancel' = $state('idle');
	draggedItem: HTMLLIElement | null = $state(null);
	targetItem: HTMLLIElement | null = $state(null);
	focusedItem: HTMLLIElement | null = $state(null);
	itemRects: ItemRect[] | null = $state.raw(null);
	pointer: { x: number; y: number } | null = $state.raw(null);
	pointerOrigin: { x: number; y: number } | null = $state.raw(null);
	fixedOrigin: { x: number; y: number } = $state.raw({ x: 0, y: 0 });
	isWithinBounds: boolean = $state(true);
	scrollOffset: { left: number; top: number } = $state.raw({ left: 0, top: 0 });
	isRTL: boolean = $state(false);
	handleKeyDown: ((e: KeyboardEvent, target: HTMLElement) => Promise<void>) | null =
		$state.raw(null);
	interruptDropTransition: (() => Promise<void>) | null = $state.raw(null);
}

const ROOT_KEY = Symbol('SortableList.RootState');

export function setSortableListRootState() {
	return setContext(ROOT_KEY, new SortableListRootState());
}

export function getSortableListRootState() {
	return getContext<ReturnType<typeof setSortableListRootState>>(ROOT_KEY);
}

class SortableListItemState {
	props: Partial<ItemProps> = $state({});
}

const ITEM_KEY = Symbol('SortableList.ItemState');

export function setSortableListItemState() {
	return setContext(ITEM_KEY, new SortableListItemState());
}

export function getSortableListItemState() {
	return getContext<ReturnType<typeof setSortableListItemState>>(ITEM_KEY);
}
