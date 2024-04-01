<script lang="ts">
	import { onMount } from 'svelte';
	import { SortableList, reorderItems, type SortableListProps } from '$lib/index.js';
	import { disabledItems, defaultProps } from '../fixtures.js';
	import { props } from '../stores.js';
	import '$lib/styles.css';

	let items: SortableListProps['items'] = [...disabledItems];

	onMount(() => {
		$props = { ...defaultProps };
	});

	function handleSort(event: CustomEvent) {
		const { oldIndex, newIndex } = event.detail;
		items = reorderItems(items, oldIndex, newIndex);
	}
</script>

<svelte:head>
	<title>Disabled items | Svelte Sortable List</title>
</svelte:head>

<SortableList {items} {...$props} let:item on:sort={handleSort}>
	{item.text}
</SortableList>
