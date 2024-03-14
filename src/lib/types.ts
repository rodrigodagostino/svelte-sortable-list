export interface SortableListProps {
	items: Item[];
	gap: number;
	swapThreshold: number;
	transitionDuration: number;
}

export interface SortableItemProps {
	item: Item;
	gap: number;
	index: number;
	transitionDuration: number;
}

interface Item {
	id: string | number;
	[key: string]: unknown;
}

export interface IItemData {
	id: string;
	index: number;
	x: number;
	y: number;
	width: number;
	height: number;
	innerHTML: string;
}
