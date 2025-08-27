<script lang="ts">
	import { onMount } from 'svelte';
	import { SortableList, sortItems, removeItem } from '$lib/index.js';
	import { defaultRootProps, getDefaultItems, getDisabledItems } from '../fixtures.js';
	import layoutState from '../states.svelte.js';
	import '$lib/styles.css';

	const defaultItems = getDefaultItems(3);
	const disabledItems = getDisabledItems(2);
	let items = $state([
		defaultItems[0],
		disabledItems[0],
		disabledItems[1],
		defaultItems[1],
		defaultItems[2],
	]);

	onMount(() => {
		layoutState.props = { ...defaultRootProps };
	});

	function handleDrop(e: SortableList.RootEvents['ondrop']) {
		const { draggedItemIndex, isBetweenBounds, canRemoveOnDropOut } = e;
		if (!isBetweenBounds && canRemoveOnDropOut) items = removeItem(items, draggedItemIndex);
	}

	function handleDragEnd(e: SortableList.RootEvents['ondragend']) {
		const { draggedItemIndex, targetItemIndex, isCanceled } = e;
		if (!isCanceled && typeof targetItemIndex === 'number' && draggedItemIndex !== targetItemIndex)
			items = sortItems(items, draggedItemIndex, targetItemIndex);
	}
</script>

<svelte:head>
	<title>Disabled items — Svelte Sortable List</title>
</svelte:head>

<SortableList.Root {...layoutState.props} ondrop={handleDrop} ondragend={handleDragEnd}>
	{#each items as item, index (item.id)}
		<SortableList.Item {...item} {index}>
			<div class="ssl-item-content">
				<span class="ssl-item-content__text">{item.text}</span>
			</div>
		</SortableList.Item>
	{/each}
</SortableList.Root>
