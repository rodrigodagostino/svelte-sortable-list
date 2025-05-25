export interface SortableListProps {
	gap?: number;
	direction?: 'vertical' | 'horizontal';
	transitionDuration?: number;
	hasDropMarker?: boolean;
	hasLockedAxis?: boolean;
	hasBoundaries?: boolean;
	canClearOnDragOut?: boolean;
	canRemoveOnDropOut?: boolean;
	isLocked?: boolean;
	isDisabled?: boolean;
}

export interface SortableListCoordinates {
	pointer: { x: number; y: number } | null;
	pointerOrigin: { x: number; y: number } | null;
	itemsData: ItemData[] | null;
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
	status: 'init' | 'preset' | 'set' | 'remove' | 'unset';
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

interface EventDetail {
	deviceType: 'pointer' | 'keyboard';
	draggedItem: HTMLLIElement;
	draggedItemId: string;
	draggedItemIndex: number;
	targetItem: HTMLLIElement | null;
	targetItemId: string | null;
	targetItemIndex: number | null;
	isBetweenBounds?: boolean;
	canRemoveOnDropOut: boolean;
}

export type MountedEventDetail = null;

export type DragStartEventDetail = Omit<
	EventDetail,
	'targetItem' | 'targetItemId' | 'targetItemIndex'
>;

export type DragEventDetail = EventDetail;

export type DropEventDetail = EventDetail;

export interface DragEndEventDetail extends EventDetail {
	isCanceled: boolean;
}
