<script lang="ts">
	import { onMount } from 'svelte';
	import { SortableList, sortItems, type SortableListProps } from '$lib/index.js';
	import { disabledItems, defaultProps } from '../fixtures.js';
	import { props } from '../stores.js';
	import '$lib/styles.css';

	let items: SortableListProps['items'] = [...disabledItems];

	onMount(() => {
		$props = { ...defaultProps };
	});

	function handleSort(event: CustomEvent) {
		const { prevIndex, nextIndex } = event.detail;
		items = sortItems(items, prevIndex, nextIndex);
	}
</script>

<svelte:head>
	<title>Disabled items | Svelte Sortable List</title>
</svelte:head>

<SortableList {items} {...$props} let:item on:sort={handleSort}>
	{item.text}
</SortableList>
