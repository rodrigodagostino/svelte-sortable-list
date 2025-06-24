<script lang="ts">
	import { onMount } from 'svelte';
	import { SortableList, removeItem, sortItems } from '$lib/index.js';
	import { defaultRootProps, getVaryingItems } from '../fixtures.js';
	import { rootProps } from '../stores.js';
	import '$lib/styles.css';

	let items = getVaryingItems(5);

	onMount(() => {
		$rootProps = {
			...defaultRootProps,
			hasBoundaries: true,
		};
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
	<title>Has boundaries | Svelte Sortable List</title>
</svelte:head>

<div class="wrapper">
	<SortableList.Root {...$rootProps} on:drop={handleDrop} on:dragend={handleDragEnd}>
		{#each items as item, index (item.id)}
			<SortableList.Item {...item} {index}>
				<div class="ssl-item-content">
					<span class="ssl-item-content__text">{item.text}</span>
				</div>
			</SortableList.Item>
		{/each}
	</SortableList.Root>
</div>

<style>
	:global([data-page-pathname='with-boundaries'] .wrapper) {
		position: relative;

		&::after {
			content: '';
			position: absolute;
			inset: -0.25rem;
			border: 0.25rem dashed var(--gray-200);
			z-index: -1;
		}
	}
</style>
