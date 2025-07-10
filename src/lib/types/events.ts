interface EventDetail {
	/** The device type that triggered the event. */
	deviceType: 'pointer' | 'keyboard';
	/** The dragged item element. */
	draggedItem: HTMLLIElement;
	/** The id of the dragged item element. */
	draggedItemId: string;
	/** The index of the dragged item element. */
	draggedItemIndex: number;
	/** The target item element. */
	targetItem: HTMLLIElement | null;
	/** The id of the target item element. */
	targetItemId: string | null;
	/** The index of the target item element. */
	targetItemIndex: number | null;
	/** Whether the target item element is between the bounds of the root element. */
	isBetweenBounds?: boolean;
	/** Whether the target item element can be removed on drop out. */
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
	/** Whether the drag operation was canceled */
	isCanceled: boolean;
};

export type DestroyedEventDetail = null;

export interface SortableListRootEvents {
	/** Fired when the component is mounted. */
	mounted: CustomEvent<MountedEventDetail>;
	/** Fired when an item starts to be dragged by a pointer device or a keyboard. */
	dragstart: CustomEvent<DragStartEventDetail>;
	/** Fired when a dragged item is moved around by a pointer device or a keyboard (fires every few hundred milliseconds). */
	drag: CustomEvent<DragEventDetail>;
	/** Fired when a dragged item is released by a pointer device or a keyboard. */
	drop: CustomEvent<DropEventDetail>;
	/** Fired when a dragged item reaches its destination after being released. */
	dragend: CustomEvent<DragEndEventDetail>;
	/** Fired when the component is destroyed. */
	destroyed: CustomEvent<DestroyedEventDetail>;
}
