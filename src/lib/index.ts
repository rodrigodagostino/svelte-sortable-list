export { default as SortableList } from '$lib/components/SortableList.svelte';
export { default as SortableItem } from '$lib/components/SortableItem.svelte';
export { default as Handle } from '$lib/components/Handle.svelte';
export { default as Remove } from '$lib/components/Remove.svelte';
export { removeItem, sortItems } from '$lib/utils/index.js';
export type {
	SortableItemData,
	MountedEventDetail,
	DragStartEventDetail,
	DragEventDetail,
	DropEventDetail,
	DragEndEventDetail,
} from '$lib/types/index.js';
