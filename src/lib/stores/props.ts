import { getWritableContext, setWritableContext } from './index.js';
import type { SortableListRootProps } from '$lib/types/index.js';

export function setListProps(context: SortableListRootProps) {
	return setWritableContext<SortableListRootProps>('props', context);
}
export function getListProps() {
	return getWritableContext<SortableListRootProps>('props');
}
