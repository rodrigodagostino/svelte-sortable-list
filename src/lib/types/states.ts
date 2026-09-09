import type { SortableListRootState as RootState } from '$lib/states/index.js';

export interface RegistryList {
	group: string;
	ref: HTMLUListElement;
	state: RootState;
	id: string | null;
	index: number | null;
}

export interface SourceList extends RegistryList {
	draggedItem: HTMLLIElement;
	draggedItemId: string | null;
	draggedItemIndex: number | null;
}

export interface TargetList extends RegistryList {
	targetItem: HTMLLIElement | null;
	targetItemId: string | null;
	targetItemIndex: number | null;
}
