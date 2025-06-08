import type { SortableListItemProps } from './props.js';

export interface SortableListItemData extends Omit<SortableListItemProps, 'index'> {
	[key: string]: unknown;
}
