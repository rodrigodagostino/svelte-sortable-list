<script lang="ts">
	import { onMount } from 'svelte';
	import { SortableList, sortItems, removeItem } from '$lib/index.js';
	import { defaultRootProps, getDefaultItems } from '../fixtures.js';
	import layoutState from '../states.svelte.js';
	import '$lib/styles.css';

	let items = $state(getDefaultItems(5));

	onMount(() => {
		layoutState.props = {
			...defaultRootProps,
			direction: 'horizontal',
		};
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
	<title>RTL — Svelte Sortable List</title>
</svelte:head>

<div class="wrapper" dir="rtl">
	<SortableList.Root {...layoutState.props} ondrop={handleDrop} ondragend={handleDragEnd}>
		{#each items as item, index (item.id)}
			<SortableList.Item {...item} {index}>
				<div class="ssl-item-content">
					<span class="ssl-item-content__text">{item.text}</span>
				</div>
			</SortableList.Item>
		{/each}
	</SortableList.Root>
</div>
