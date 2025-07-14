export interface SortableListAnnouncements {
	lifted: (draggedItem: HTMLLIElement, draggedItemIndex: number) => string;
	dragged: (
		draggedItem: HTMLLIElement,
		draggedItemIndex: number,
		targetItem: HTMLLIElement,
		targetItemIndex: number
	) => string;
	dropped: (
		draggedItem: HTMLLIElement,
		draggedItemIndex: number,
		targetItem: HTMLLIElement | null,
		targetItemIndex: number | null
	) => string;
	canceled: (draggedItem: HTMLLIElement, draggedItemIndex: number) => string;
}

export type TextDirection = 'ltr' | 'rtl' | 'auto';
