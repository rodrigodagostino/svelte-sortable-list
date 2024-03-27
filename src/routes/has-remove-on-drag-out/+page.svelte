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
			text: 'List item 2 that will break into multiple lines',
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
			text: 'List item 5 with a bit more of content that will break into more multiple lines',
		},
	];

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
