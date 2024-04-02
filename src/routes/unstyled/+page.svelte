<script lang="ts">
	import { onMount } from 'svelte';
	import { SortableList, reorderItems, type SortableListProps } from '$lib/index.js';
	import { defaultItems, defaultProps } from '../fixtures.js';
	import { props } from '../stores.js';

	let items: SortableListProps['items'] = [...defaultItems];

	onMount(() => {
		$props = { ...defaultProps };
	});

	function handleSort(event: CustomEvent) {
		const { prevIndex, nextIndex } = event.detail;
		items = reorderItems(items, prevIndex, nextIndex);
	}
</script>

<svelte:head>
	<title>Unstyled | Svelte Sortable List</title>
</svelte:head>

<SortableList {items} {...$props} let:item on:sort={handleSort}>
	{item.text}
</SortableList>
