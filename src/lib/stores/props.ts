import { getWritableContext, setWritableContext, type Group } from './index.js';
import type { SortableListRootProps as RootProps } from '$lib/types/index.js';

export function setRootProps(group: Group, context: RootProps) {
	return setWritableContext<RootProps>('rootProps', group, context);
}
export function getRootProps(group: Group) {
	return getWritableContext<RootProps>('rootProps', group);
}
