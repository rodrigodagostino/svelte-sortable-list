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

export type DragEndEventDetail = EventDetail & {
	isCanceled: boolean;
};

export type DestroyedEventDetail = null;

export interface SortableListRootEvents {
	mounted: CustomEvent<MountedEventDetail>;
	dragstart: CustomEvent<DragStartEventDetail>;
	drag: CustomEvent<DragEventDetail>;
	drop: CustomEvent<DropEventDetail>;
	dragend: CustomEvent<DragEndEventDetail>;
	destroyed: CustomEvent<DestroyedEventDetail>;
}
