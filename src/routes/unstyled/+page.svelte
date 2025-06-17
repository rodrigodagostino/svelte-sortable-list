<script lang="ts">
	import { onMount } from 'svelte';
	import { SortableList, removeItem, sortItems } from '$lib/index.js';
	import { defaultProps, getDefaultItems } from '../fixtures.js';
	import { props } from '../stores.js';

	let items = getDefaultItems(5);

	onMount(() => {
		$props = { ...defaultProps };
	});

	function handleDrop(event: SortableList.RootEvents['drop']) {
		const { draggedItemIndex, isBetweenBounds, canRemoveOnDropOut } = event.detail;
		if (!isBetweenBounds && canRemoveOnDropOut) items = removeItem(items, draggedItemIndex);
	}

	function handleDragEnd(event: SortableList.RootEvents['dragend']) {
		const { draggedItemIndex, targetItemIndex, isCanceled } = event.detail;
		if (!isCanceled && typeof targetItemIndex === 'number' && draggedItemIndex !== targetItemIndex)
			items = sortItems(items, draggedItemIndex, targetItemIndex);
	}
</script>

<svelte:head>
	<title>Unstyled | Svelte Sortable List</title>
</svelte:head>

<SortableList.Root {...$props} on:drop={handleDrop} on:dragend={handleDragEnd}>
	{#each items as item, index (item.id)}
		<SortableList.Item {...item} {index}>
			{item.text}
		</SortableList.Item>
	{/each}
</SortableList.Root>
