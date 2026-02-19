export interface SortableListElements {
	root: HTMLUListElement | null | undefined;
	draggedItem: HTMLLIElement | null;
	targetItem: HTMLLIElement | null;
	focusedItem: HTMLLIElement | null;
}
