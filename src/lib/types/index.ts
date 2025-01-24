export interface SortableListProps {
	gap?: number;
	direction?: 'vertical' | 'horizontal';
	swapThreshold?:
		| 0.5
		| 0.6
		| 0.7
		| 0.8
		| 0.9
		| 1
		| 1.1
		| 1.2
		| 1.3
		| 1.4
		| 1.5
		| 1.6
		| 1.7
		| 1.8
		| 1.9
		| 2;
	transitionDuration?: number;
	hasDropMarker?: boolean;
	hasLockedAxis?: boolean;
	hasBoundaries?: boolean;
	canClearTargetOnDragOut?: boolean;
	canRemoveItemOnDropOut?: boolean;
	isLocked?: boolean;
	isDisabled?: boolean;
}

export interface SortableListCoordinates {
	pointer: { x: number; y: number } | null;
	pointerOrigin: { x: number; y: number } | null;
	itemsOrigin: ItemData[] | null;
}

export interface SortableListElements {
	draggedItem: HTMLLIElement | null;
	targetItem: HTMLLIElement | null;
	focusedItem: HTMLLIElement | null;
}

export interface SortableItemProps {
	id: string;
	index: number;
	isLocked?: boolean;
	isDisabled?: boolean;
}

export interface SortableItemData extends Omit<SortableItemProps, 'index'> {
	[key: string]: unknown;
}

export interface GhostProps {
	status: 'init' | 'set' | 'remove' | 'unset';
	listRef: HTMLUListElement | null;
}

export interface ItemData {
	id: string;
	index: number;
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface SortEventDetail {
	prevItemId: string;
	prevItemIndex: number;
	nextItemId: string;
	nextItemIndex: number;
}

export interface RemoveEventDetail {
	itemId: string;
	itemIndex: number;
}
