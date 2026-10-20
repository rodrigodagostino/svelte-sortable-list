export { default as Root } from '$lib/components/SortableList.svelte';
export { default as Item } from '$lib/components/SortableListItem.svelte';
export { default as Handle } from '$lib/components/SortableListHandle.svelte';
export { default as ItemRemove } from '$lib/components/SortableListItemRemove.svelte';

export type {
	SortableListRootProps as RootProps,
	SortableListRootEvents as RootEvents,
	SortableListItemProps as ItemProps,
	SortableListItemData as ItemData,
} from '$lib/types/index.js';
