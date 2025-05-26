import type { SortableItemProps } from './props.js';

export interface SortableItemData extends Omit<SortableItemProps, 'index'> {
	[key: string]: unknown;
}
