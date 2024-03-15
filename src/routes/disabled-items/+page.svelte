<script lang="ts">
	import { SortableList, reorderItems, type SortableListProps } from '$lib/index.js';

	let items: SortableListProps['items'] = [
		{
			id: 1,
			text: 'List item 1',
			isDisabled: false,
		},
		{
			id: 2,
			text: 'List item 2',
			isDisabled: true,
		},
		{
			id: 3,
			text: 'List item 3',
			isDisabled: true,
		},
		{
			id: 4,
			text: 'List item 4',
			isDisabled: false,
		},
		{
			id: 5,
			text: 'List item 5',
			isDisabled: false,
		},
	];

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
