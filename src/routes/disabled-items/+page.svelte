<script lang="ts">
	import { onMount } from 'svelte';
	import { SortableList, sortItems, removeItem } from '$lib/index.js';
	import { disabledItems, defaultProps, defaultItems } from '../fixtures.js';
	import { props } from '../stores.js';
	import '$lib/styles.css';

	let items = [
		defaultItems[0],
		disabledItems[0],
		disabledItems[1],
		defaultItems[1],
		defaultItems[2],
	];

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
	<title>Disabled items | Svelte Sortable List</title>
</svelte:head>

<SortableList.Root {...$props} on:drop={handleDrop} on:dragend={handleDragEnd}>
	{#each items as item, index (item.id)}
		<SortableList.Item {...item} {index}>
			<div class="ssl-item-content">
				<span class="ssl-item-content__text">{item.text}</span>
			</div>
		</SortableList.Item>
	{/each}
</SortableList.Root>
