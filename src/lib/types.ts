export interface SortableListProps {
	items: Item[];
	gap: number;
	direction: 'vertical' | 'horizontal';
	swapThreshold: number;
	transitionDuration: number;
	hasDropMarker: boolean;
	hasLockedAxis: boolean;
	hasBoundaries: boolean;
	hasRemoveOnDragOut: boolean;
}

export interface SortableListCoordinates {
	pointer: { x: number; y: number };
	pointerOrigin: { x: number; y: number };
	itemsOrigin: ItemData[] | null;
}

export interface SortableListElements {
	draggedItem: HTMLLIElement | null;
	targetItem: HTMLLIElement | null;
	focusedItem: HTMLLIElement | null;
}

export interface SortableItemProps
	extends Omit<SortableListProps, 'items' | 'hasLockedAxis' | 'hasBoundaries'> {
	item: Item;
	index: number;
}

export interface GhostProps {
	status: 'init' | 'set' | 'remove' | 'unset';
}

interface Item {
	id: string | number;
	[key: string]: unknown;
	isDisabled?: boolean;
}

export interface ItemData {
	id: string;
	index: number;
	x: number;
	y: number;
	width: number;
	height: number;
}
