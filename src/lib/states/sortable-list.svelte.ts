import type {
	SortableListRootProps as RootProps,
	SortableListItemProps as ItemProps,
	ItemRect,
} from '$lib/types/index.js';
import { getContext, setContext } from 'svelte';

export class SortableListRootState {
	ref: HTMLUListElement | null = $state.raw(null);
	group: string | undefined = $state.raw(undefined);
	isSource: boolean = $state(false);
	isTarget: boolean = $state(false);
	props: RootProps = $state.raw({});
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
	rect: DOMRect | null = null;
	itemRects: ItemRect[] | null = $state.raw(null);
	pointer: { x: number; y: number } | null = $state.raw(null);
	pointerOrigin: { x: number; y: number } | null = $state.raw(null);
	fixedOrigin: { x: number; y: number } | null = $state.raw(null);
	isWithinBounds: boolean = $state(true);
	scrollOffset: { left: number; top: number } = $state.raw({ left: 0, top: 0 });
	visibleRange: { first: number; last: number } | null = null;
	isRTL: boolean = $state(false);
	handleKeyDown: ((e: KeyboardEvent, target: HTMLElement) => Promise<void>) | null =
		$state.raw(null);
	interruptDropTransition: (() => Promise<void>) | null = $state.raw(null);
	/* Nested lists */
	parentRoot: SortableListRootState | null = null;
	parentItem: SortableListItemState | null = null;
	childRoots: SortableListRootState[] = $state.raw([]);
	isNestedDragActive(): boolean {
		for (let root = this.parentRoot; root; root = root.parentRoot)
			if (root.dragState !== 'idle') return true;

		function isChildDragActive(root: SortableListRootState): boolean {
			return root.childRoots.some(
				(child) => child.dragState !== 'idle' || isChildDragActive(child)
			);
		}

		return isChildDragActive(this);
	}
}

const ROOT_KEY = Symbol('SortableList.RootState');

export function setSortableListRootState() {
	const parentRoot = getContext<SortableListRootState | undefined>(ROOT_KEY) ?? null;
	const parentItem = getContext<SortableListItemState | undefined>(ITEM_KEY) ?? null;
	const rootState = new SortableListRootState();
	rootState.parentRoot = parentRoot;
	rootState.parentItem = parentItem;
	if (parentRoot) parentRoot.childRoots = [...parentRoot.childRoots, rootState];
	if (parentItem) parentItem.childRoots = [...parentItem.childRoots, rootState];

	return setContext(ROOT_KEY, rootState);
}

export function unsetSortableListRootState(rootState: SortableListRootState) {
	const { parentRoot, parentItem } = rootState;
	if (parentRoot)
		parentRoot.childRoots = parentRoot.childRoots.filter((child) => child !== rootState);
	if (parentItem)
		parentItem.childRoots = parentItem.childRoots.filter((child) => child !== rootState);
}

export function getSortableListRootState() {
	return getContext<ReturnType<typeof setSortableListRootState>>(ROOT_KEY);
}

class SortableListItemState {
	props: Partial<ItemProps> = $state.raw({});
	/* Nested lists */
	childRoots: SortableListRootState[] = $state.raw([]);
}

const ITEM_KEY = Symbol('SortableList.ItemState');

export function setSortableListItemState() {
	return setContext(ITEM_KEY, new SortableListItemState());
}

export function getSortableListItemState() {
	return getContext<ReturnType<typeof setSortableListItemState>>(ITEM_KEY);
}
