<script lang="ts">
	import { onMount } from 'svelte';
	import { SortableList, sortItems, removeItem } from '$lib/index.js';
	import { defaultRootProps, getDefaultItems, getDisabledItems } from '../fixtures.js';
	import { rootProps } from '../stores.js';
	import '$lib/styles.css';

	const defaultItems = getDefaultItems(3);
	const disabledItems = getDisabledItems(2);
	let items = [
		defaultItems[0],
		disabledItems[0],
		disabledItems[1],
		defaultItems[1],
		defaultItems[2],
	];

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
	<title>Disabled items — Svelte Sortable List</title>
</svelte:head>

<SortableList.Root {...$rootProps} on:drop={handleDrop} on:dragend={handleDragEnd}>
	{#each items as item, index (item.id)}
		<SortableList.Item {...item} {index}>
			<div class="ssl-item-content">
				<span class="ssl-item-content__text">{item.text}</span>
			</div>
		</SortableList.Item>
	{/each}
</SortableList.Root>
