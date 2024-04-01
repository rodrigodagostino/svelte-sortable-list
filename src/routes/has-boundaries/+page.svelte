<script lang="ts">
	import { SortableList, reorderItems, type SortableListProps } from '$lib/index.js';
	import { varyingItems } from '../fixtures.js';
	import '$lib/styles.css';

	let items: SortableListProps['items'] = [...varyingItems];

	function handleSort(event: CustomEvent) {
		const { oldIndex, newIndex } = event.detail;
		items = reorderItems(items, oldIndex, newIndex);
	}
</script>

<svelte:head>
	<title>Has boundaries | Svelte Sortable List</title>
</svelte:head>

<SortableList {items} hasBoundaries={true} let:item on:sort={handleSort}>
	{item.text}
</SortableList>
