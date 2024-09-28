export interface SortableListProps {
	gap?: number;
	direction?: 'vertical' | 'horizontal';
	swapThreshold?: number;
	transitionDuration?: number;
	hasDropMarker?: boolean;
	hasLockedAxis?: boolean;
	hasBoundaries?: boolean;
	hasRemoveOnDropOut?: boolean;
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
	isDisabled?: boolean;
}

export interface SortableItemData extends Omit<SortableItemProps, 'index'> {
	[key: string]: unknown;
}

export interface GhostProps {
	status: 'init' | 'set' | 'remove' | 'unset';
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
