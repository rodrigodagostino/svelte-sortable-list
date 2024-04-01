<script lang="ts">
	import { onMount } from 'svelte';
	import { SortableList, IconHandle, reorderItems, type SortableListProps } from '$lib/index.js';
	import { defaultItems, defaultProps } from '../fixtures.js';
	import { props } from '../stores.js';
	import '$lib/styles.css';

	let items: SortableListProps['items'] = [...defaultItems];

	onMount(() => {
		$props = { ...defaultProps };
	});

	function handleSort(event: CustomEvent) {
		const { oldIndex, newIndex } = event.detail;
		items = reorderItems(items, oldIndex, newIndex);
	}
</script>

<svelte:head>
	<title>With handle | Svelte Sortable List</title>
</svelte:head>

<SortableList {items} {...$props} let:item on:sort={handleSort}>
	<IconHandle slot="handle" />
	{item.text}
</SortableList>
