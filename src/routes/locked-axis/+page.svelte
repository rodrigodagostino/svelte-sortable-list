<script lang="ts">
	import { SortableList, reorderItems, type SortableListProps } from '$lib/index.js';
	import '$lib/styles.css';

	let items: SortableListProps['items'] = [
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
	<title>Locked axis | Svelte Sortable List</title>
</svelte:head>

<SortableList {items} hasLockedAxis={true} let:item on:sort={handleSort}>
	{item.text}
</SortableList>
