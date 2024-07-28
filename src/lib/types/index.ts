export interface SortableListProps {
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
	itemsOrigin: ElementData[] | null;
}

export interface SortableListElements {
	draggedItem: HTMLLIElement | null;
	targetItem: HTMLLIElement | null;
	focusedItem: HTMLLIElement | null;
}

export interface SortableItemProps {
	id: string | number;
	index: number;
	isDisabled?: boolean;
}

export interface SortableItemData extends Omit<SortableItemProps, 'index'> {
	[key: string]: unknown;
}

export interface GhostProps {
	status: 'init' | 'set' | 'remove' | 'unset';
}

export interface ElementData {
	id: string;
	index: number;
	x: number;
	y: number;
	width: number;
	height: number;
}
