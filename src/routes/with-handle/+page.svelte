<script lang="ts">
	import { SortableList, IconHandle, reorderItems, type SortableListProps } from '$lib/index.js';
	import { defaultItems } from '../fixtures.js';
	import '$lib/styles.css';

	let items: SortableListProps['items'] = defaultItems;

	function handleSort(event: CustomEvent) {
		const { oldIndex, newIndex } = event.detail;
		items = reorderItems(items, oldIndex, newIndex);
	}
</script>

<svelte:head>
	<title>With handle | Svelte Sortable List</title>
</svelte:head>

<SortableList {items} let:item on:sort={handleSort}>
	<IconHandle slot="handle" />
	{item.text}
</SortableList>
