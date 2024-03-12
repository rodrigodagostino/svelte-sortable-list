<script lang="ts">
	import { SortableList, IconHandle, reorderItems } from '$lib/index.js';

	let items: { id: number; text: string }[] = [
		{
			id: 1,
			text: 'List item 1',
		},
		{
			id: 2,
			text: 'List item 2',
		},
		{
			id: 3,
			text: 'List item 3',
		},
		{
			id: 4,
			text: 'List item 4',
		},
		{
			id: 5,
			text: 'List item 5',
		},
	];

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
