import type { SortableList } from '$lib/index.js';

export interface SortableListItemData extends Omit<SortableList.ItemProps, 'index'> {
	[key: string]: unknown;
}
