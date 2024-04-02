<script lang="ts">
	import { onMount } from 'svelte';
	import { SortableList, reorderItems, type SortableListProps } from '$lib/index.js';
	import { defaultProps, varyingItems } from '../fixtures.js';
	import { props } from '../stores.js';
	import '$lib/styles.css';

	let items: SortableListProps['items'] = [...varyingItems];

	onMount(() => {
		$props = { ...defaultProps };
	});

	function handleSort(event: CustomEvent) {
		const { prevIndex, nextIndex } = event.detail;
		items = reorderItems(items, prevIndex, nextIndex);
	}
</script>

<svelte:head>
	<title>Varying heights | Svelte Sortable List</title>
</svelte:head>

<SortableList {items} {...$props} let:item on:sort={handleSort}>
	{item.text}
</SortableList>
