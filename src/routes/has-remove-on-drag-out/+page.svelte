<script lang="ts">
	import { SortableList, reorderItems, type SortableListProps } from '$lib/index.js';
	import { varyingItems } from '../fixtures.js';
	import '$lib/styles.css';

	let items: SortableListProps['items'] = varyingItems;

	function handleSort(event: CustomEvent) {
		const { oldIndex, newIndex } = event.detail;
		items = reorderItems(items, oldIndex, newIndex);
	}

	function handleRemove(event: CustomEvent) {
		const { id } = event.detail;
		items = items.filter((i) => String(i.id) !== id);
	}
</script>

<svelte:head>
	<title>Has remove on drag out | Svelte Sortable List</title>
</svelte:head>

<SortableList
	{items}
	hasRemoveOnDragOut={true}
	let:item
	on:sort={handleSort}
	on:remove={handleRemove}
>
	{item.text}
</SortableList>
