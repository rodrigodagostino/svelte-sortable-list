type Event = {
	/** The device type that triggered the event. */
	deviceType: 'pointer' | 'keyboard';
	/** The source list element. */
	sourceList: HTMLUListElement;
	/** The id of the source list element. */
	sourceListId?: string;
	/** The index of the source item element. */
	sourceListIndex?: number;
	/** The dragged item element. */
	draggedItem: HTMLLIElement;
	/** The id of the dragged item element. */
	draggedItemId: string;
	/** The index of the dragged item element. */
	draggedItemIndex: number;
	/** Whether the target item element is between the bounds of the root element. */
	isWithinBounds?: boolean;
	/** Whether the target item element can be removed on drop out. */
	canRemoveOnDropOut: boolean;
};

type TargetListFields = {
	/** The target list element. */
	targetList: HTMLUListElement | null;
	/** The id of the target list element. */
	targetListId: string | null;
	/** The index of the target item element. */
	targetListIndex: number | null;
	/** The target item element. */
	targetItem: HTMLLIElement | null;
	/** The id of the target item element. */
	targetItemId: string | null;
	/** The index of the target item element. */
	targetItemIndex: number | null;
};

export type MountedEvent = null;

export type DragStartEvent = Event;

export type DragEvent = Event & TargetListFields;

export type DropEvent = Event & TargetListFields;

export type DragEndEvent = Event &
	TargetListFields & {
		/** Whether the drag operation was canceled */
		isCanceled: boolean;
	};

export type DestroyedEvent = null;

export interface SortableListRootEvents {
	/** Fired when the component is mounted. */
	onmounted: MountedEvent;
	/** Fired when an item starts to be dragged by a pointer device or a keyboard. */
	ondragstart: DragStartEvent;
	/** Fired when a dragged item is moved around by a pointer device or a keyboard (fires every few hundred milliseconds). */
	ondrag: DragEvent;
	/** Fired when a dragged item is released by a pointer device or a keyboard. */
	ondrop: DropEvent;
	/** Fired when a dragged item reaches its destination after being released. */
	ondragend: DragEndEvent;
	/** Fired when the component is destroyed. */
	ondestroyed: DestroyedEvent;
}
