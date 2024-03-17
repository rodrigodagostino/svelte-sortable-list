export interface SortableListProps {
	items: Item[];
	gap: number;
	swapThreshold: number;
	transitionDuration: number;
	hasDropMarker: boolean;
	hasLockedAxis: boolean;
}

export interface SortableItemProps extends Omit<SortableListProps, 'items' | 'hasLockedAxis'> {
	item: Item;
	index: number;
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
	innerHTML: string;
}
