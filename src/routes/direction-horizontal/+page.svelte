<script lang="ts">
	import { onMount } from 'svelte';
	import { SortableList, sortItems, type SortableListProps } from '$lib/index.js';
	import { defaultItems, defaultProps } from '../fixtures.js';
	import { props } from '../stores.js';
	import '$lib/styles.css';

	let items: SortableListProps['items'] = [...defaultItems];

	onMount(() => {
		$props = {
			...defaultProps,
			direction: 'horizontal',
		};
	});

	function handleSort(event: CustomEvent) {
		const { prevIndex, nextIndex } = event.detail;
		items = sortItems(items, prevIndex, nextIndex);
	}
</script>

<svelte:head>
	<title>Direction horizontal | Svelte Sortable List</title>
</svelte:head>

<SortableList {items} {...$props} let:item on:sort={handleSort}>
	{item.text}
</SortableList>
