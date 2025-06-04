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
	import { defaultProps } from '../fixtures.js';
	import { props } from '../stores.js';
	import '$lib/styles.css';

	let items = Array.from({ length: 100 }, (_, i) => ({
		id: `list-item-${i + 1}`,
		text: `List item ${i + 1}`,
	}));

	onMount(() => {
		$props = { ...defaultProps };
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
	<title>Auto scrolling | Svelte Sortable List</title>
</svelte:head>

<SortableList {...$props} on:drop={handleDrop} on:dragend={handleDragEnd}>
	{#each items as item, index (item.id)}
		<SortableItem id={item.id} {index}>
			<div class="ssl-content">
				<span class="ssl-content__text">{item.text}</span>
			</div>
		</SortableItem>
	{/each}
</SortableList>
