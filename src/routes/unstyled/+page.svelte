<script lang="ts">
	import { onMount } from 'svelte';
	import { SortableList, removeItem, sortItems } from '$lib/index.js';
	import { defaultRootProps, getDefaultItems } from '../fixtures.js';
	import { rootProps } from '../stores.js';

	let items = getDefaultItems(5);

	onMount(() => {
		$rootProps = { ...defaultRootProps };
	});

	function handleDrop(e: SortableList.RootEvents['drop']) {
		const { draggedItemIndex, isBetweenBounds, canRemoveOnDropOut } = e.detail;
		if (!isBetweenBounds && canRemoveOnDropOut) items = removeItem(items, draggedItemIndex);
	}

	function handleDragEnd(e: SortableList.RootEvents['dragend']) {
		const { draggedItemIndex, targetItemIndex, isCanceled } = e.detail;
		if (!isCanceled && typeof targetItemIndex === 'number' && draggedItemIndex !== targetItemIndex)
			items = sortItems(items, draggedItemIndex, targetItemIndex);
	}
</script>

<svelte:head>
	<title>Unstyled — Svelte Sortable List</title>
</svelte:head>

<SortableList.Root {...$rootProps} on:drop={handleDrop} on:dragend={handleDragEnd}>
	{#each items as item, index (item.id)}
		<SortableList.Item {...item} {index}>
			{item.text}
		</SortableList.Item>
	{/each}
</SortableList.Root>
