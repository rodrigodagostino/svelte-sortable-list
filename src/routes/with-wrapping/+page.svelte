<script lang="ts">
	import { onMount } from 'svelte';
	import { SortableList, sortItems, removeItem } from '$lib/index.js';
	import { defaultRootProps, getDefaultItems } from '../fixtures.js';
	import { rootProps } from '../stores.js';
	import '$lib/styles.css';

	let items = getDefaultItems(20);

	onMount(() => {
		$rootProps = {
			...defaultRootProps,
			direction: 'horizontal',
			hasWrapping: true,
		};
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
	<title>With wrapping — Svelte Sortable List</title>
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

<style>
	:global([data-page-pathname='with-wrapping']) {
		& .app-main .container {
			max-width: 64.5rem;
		}

		& .ssl-root {
			justify-content: center;
			align-items: center;
		}

		& .ssl-item-content {
			width: 10rem;
		}
	}
</style>
