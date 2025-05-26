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
