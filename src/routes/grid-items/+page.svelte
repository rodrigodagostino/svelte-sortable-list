<script lang="ts">
	import { onMount } from 'svelte';
	import { SortableList, sortItems, type SortableListProps } from '$lib/index.js';
	import { defaultProps, defaultItems } from '../fixtures.js';
	import { props } from '../stores.js';
	import '$lib/styles.css';

	let items: SortableListProps['items'] = [...defaultItems];

	onMount(() => {
		$props = {
			...defaultProps,
			hasBoundaries: true,
		};
	});

	function handleSort(event: CustomEvent) {
		const { prevIndex, nextIndex } = event.detail;
		items = sortItems(items, prevIndex, nextIndex);
	}
</script>

<svelte:head>
	<title>Has Grid | Svelte Sortable List</title>
</svelte:head>

<SortableList {items} {...$props} layout="grid" on:sort={handleSort} let:item>
	{item.text}
</SortableList>

<style>
	/* Add any additional styles for the parent component here if needed */
</style>