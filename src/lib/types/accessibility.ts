type AnnouncementContext = {
	/** The source list element. */
	sourceList: HTMLUListElement;
	/** The index of the source item element. */
	sourceListIndex?: number;
	/** The dragged item element. */
	draggedItem: HTMLLIElement;
	/** The index of the dragged item element. */
	draggedItemIndex: number;
};

type TargetListFields = {
	/** The target list element. */
	targetList?: HTMLUListElement | null;
	/** The index of the target item element. */
	targetListIndex?: number | null;
};

type TargetListFieldsForDragged = {
	/** The target item element. */
	targetItem: HTMLLIElement;
	/** The index of the target item element. */
	targetItemIndex: number;
};

type TargetListFieldsForDropped = {
	/** The target item element. */
	targetItem: HTMLLIElement | null;
	/** The index of the target item element. */
	targetItemIndex: number | null;
};

type LiftedAnnouncementContext = AnnouncementContext;
type DraggedAnnouncementContext = AnnouncementContext &
	TargetListFields &
	TargetListFieldsForDragged;
type DroppedAnnouncementContext = AnnouncementContext &
	TargetListFields &
	TargetListFieldsForDropped;
type CanceledAnnouncementContext = AnnouncementContext;

export interface SortableListAnnouncements {
	lifted: (context: LiftedAnnouncementContext) => string;
	dragged: (context: DraggedAnnouncementContext) => string;
	dropped: (context: DroppedAnnouncementContext) => string;
	canceled: (context: CanceledAnnouncementContext) => string;
}
