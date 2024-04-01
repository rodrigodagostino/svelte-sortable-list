<script lang="ts">
	import { SortableList, reorderItems, type SortableListProps } from '$lib/index.js';
	import { defaultItems } from '../fixtures.js';
	import '$lib/styles.css';

	let items: SortableListProps['items'] = [...defaultItems];

	function handleSort(event: CustomEvent) {
		const { oldIndex, newIndex } = event.detail;
		items = reorderItems(items, oldIndex, newIndex);
	}
</script>

<svelte:head>
	<title>Direction horizontal (has locked axis) | Svelte Sortable List</title>
</svelte:head>

<SortableList {items} direction="horizontal" hasLockedAxis={true} let:item on:sort={handleSort}>
	{item.text}
</SortableList>
