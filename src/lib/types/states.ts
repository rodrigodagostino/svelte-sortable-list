import type { ItemRect } from './data-extraction.js';
import type { SortableListRootProps as RootProps } from './props.js';

export interface SortableListRootStateContext {
	ref: HTMLUListElement | null;
	props: RootProps;
	dragState:
		| 'idle'
		| 'ptr-drag-start'
		| 'ptr-drag'
		| 'ptr-drop'
		| 'ptr-cancel'
		| 'kbd-drag-start'
		| 'kbd-drag'
		| 'kbd-drop'
		| 'kbd-cancel';
	ghostState: 'idle' | 'ptr-drag-start' | 'ptr-drag' | 'ptr-predrop' | 'ptr-drop' | 'ptr-remove';
	draggedItem: HTMLLIElement | null;
	targetItem: HTMLLIElement | null;
	focusedItem: HTMLLIElement | null;
	itemRects: ItemRect[] | null;
	pointer: { x: number; y: number } | null;
	pointerOrigin: { x: number; y: number } | null;
	isBetweenBounds: boolean;
	isRTL: boolean;
}
