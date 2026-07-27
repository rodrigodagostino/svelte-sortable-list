import type { ItemRect } from './data-extraction.js';
import type { SortableListRootProps as RootProps } from './props.js';
import type { SortableListRootState as RootState } from '$lib/states/index.js';

export interface RegistryEntry {
	rootState: RootState;
	ref: HTMLUListElement;
	group: string;
}

export interface SortableListRootStateContext {
	ref: HTMLUListElement | null;
	props: RootProps;
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
		| 'kbd-cancel';
	draggedItem: HTMLLIElement | null;
	targetItem: HTMLLIElement | null;
	focusedItem: HTMLLIElement | null;
	itemRectsSnapshot: ItemRect[] | null;
	pointer: { x: number; y: number } | null;
	pointerOrigin: { x: number; y: number } | null;
	isBetweenBounds: boolean;
	scrollOffset: { left: number; top: number };
	isRTL: boolean;
}
