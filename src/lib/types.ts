export interface SortableListProps {
	items: Item[];
	gap: number;
	direction: 'vertical' | 'horizontal';
	swapThreshold: number;
	transitionDuration: number;
	hasDropMarker: boolean;
	hasLockedAxis: boolean;
	hasBoundaries: boolean;
}

export interface SortableItemProps
	extends Omit<SortableListProps, 'items' | 'hasLockedAxis' | 'hasBoundaries'> {
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
