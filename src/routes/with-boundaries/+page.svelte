<script lang="ts">
	import { onMount } from 'svelte';
	import {
		SortableList,
		SortableItem,
		removeItem,
		sortItems,
		type DropEventDetail,
		type DragEndEventDetail,
	} from '$lib/index.js';
	import { defaultProps, varyingItems } from '../fixtures.js';
	import { props } from '../stores.js';
	import '$lib/styles.css';

	let items = [...varyingItems];

	onMount(() => {
		$props = {
			...defaultProps,
			hasBoundaries: true,
		};
	});

	function handleDrop(event: CustomEvent<DropEventDetail>) {
		const { draggedItemIndex, isBetweenBounds, canRemoveOnDropOut } = event.detail;
		if (!isBetweenBounds && canRemoveOnDropOut) items = removeItem(items, draggedItemIndex);
	}

	function handleDragEnd(event: CustomEvent<DragEndEventDetail>) {
		const { draggedItemIndex, targetItemIndex, isCanceled } = event.detail;
		if (!isCanceled && typeof targetItemIndex === 'number' && draggedItemIndex !== targetItemIndex)
			items = sortItems(items, draggedItemIndex, targetItemIndex);
	}
</script>

<svelte:head>
	<title>Has boundaries | Svelte Sortable List</title>
</svelte:head>

<div class="wrapper">
	<SortableList {...$props} on:drop={handleDrop} on:dragend={handleDragEnd}>
		{#each items as item, index (item.id)}
			<SortableItem {...item} {index}>
				<div class="ssl-content">
					<span class="ssl-content__text">{item.text}</span>
				</div>
			</SortableItem>
		{/each}
	</SortableList>
</div>

<style>
	:global([data-page-pathname='with-boundaries'] .wrapper) {
		position: relative;
	}

	:global([data-page-pathname='with-boundaries'] .wrapper::after) {
		content: '';
		position: absolute;
		inset: -0.25rem;
		border: 0.25rem dashed var(--gray-200);
		z-index: -1;
	}
</style>
