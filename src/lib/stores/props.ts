import { getWritableContext, setWritableContext } from './index.js';
import type { SortableListProps } from '$lib/types/index.js';

export function setListProps(context: SortableListProps) {
	return setWritableContext<SortableListProps>('props', context);
}
export function getListProps() {
	return getWritableContext<SortableListProps>('props');
}
