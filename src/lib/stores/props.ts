import { getWritableContext, setWritableContext } from './index.js';
import type { SortableListRootProps } from '$lib/types/index.js';

export function setRootProps(context: SortableListRootProps) {
	return setWritableContext<SortableListRootProps>('rootProps', context);
}
export function getRootProps() {
	return getWritableContext<SortableListRootProps>('rootProps');
}
