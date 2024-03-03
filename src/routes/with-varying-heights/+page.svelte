<script lang="ts">
	import { SortableList, reorder } from '$lib/index.js';

	let items: { id: number; text: string }[] = [
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
		items = reorder(items, oldIndex, newIndex);
	}
</script>

<svelte:head>
	<title>With varying heights | Svelte Sortable List</title>
</svelte:head>

<SortableList {items} key="id" let:item on:sort={handleSort}>
	<span class="sortable-item__text">{item.text}</span>
</SortableList>
