export interface SortableListElements {
	root: HTMLUListElement | null;
	draggedItem: HTMLLIElement | null;
	targetItem: HTMLLIElement | null;
	focusedItem: HTMLLIElement | null;
}
