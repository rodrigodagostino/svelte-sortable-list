<script lang="ts">
	import { SortableList, reorderItems, type SortableListProps } from '$lib/index.js';
	import { disabledItems } from '../fixtures.js';
	import '$lib/styles.css';

	let items: SortableListProps['items'] = disabledItems;

	function handleSort(event: CustomEvent) {
		const { oldIndex, newIndex } = event.detail;
		items = reorderItems(items, oldIndex, newIndex);
	}
</script>

<svelte:head>
	<title>Disabled items | Svelte Sortable List</title>
</svelte:head>

<SortableList {items} let:item on:sort={handleSort}>
	{item.text}
</SortableList>
