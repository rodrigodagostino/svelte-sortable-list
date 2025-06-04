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
	import { defaultItems, defaultProps } from '../fixtures.js';
	import { props } from '../stores.js';
	import '$lib/styles.css';

	let items = [...defaultItems];

	onMount(() => {
		$props = {
			...defaultProps,
			hasLockedAxis: true,
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
	<title>Has locked axis | Svelte Sortable List</title>
</svelte:head>

<div class="wrapper direction-{$props.direction}">
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
	:global([data-page-pathname='with-locked-axis'] .wrapper) {
		position: relative;
	}

	:global([data-page-pathname='with-locked-axis'] .wrapper::after) {
		content: '';
		position: absolute;
		z-index: -1;
	}

	:global([data-page-pathname='with-locked-axis'] .wrapper.direction-vertical::after) {
		top: -8rem;
		bottom: -8rem;
		left: calc(50% - 0.125rem);
		right: calc(50% - 0.125rem);
		background-image: linear-gradient(
			to bottom,
			var(--gray-200),
			var(--gray-200) 60%,
			transparent 60%,
			transparent 100%
		);
		background-size: 0.25rem 1.5rem;
		mask-image: linear-gradient(
			to bottom,
			transparent,
			black 4rem,
			black calc(100% - 4rem),
			transparent
		);
	}

	:global([data-page-pathname='with-locked-axis'] .wrapper.direction-horizontal::after) {
		top: calc(50% - 0.125rem);
		bottom: calc(50% - 0.125rem);
		left: -8rem;
		right: -8rem;
		background-image: linear-gradient(
			to right,
			var(--gray-200),
			var(--gray-200) 60%,
			transparent 60%,
			transparent 100%
		);
		background-size: 1.5rem 0.25rem;
		mask-image: linear-gradient(
			to right,
			transparent,
			black 4rem,
			black calc(100% - 4rem),
			transparent
		);
	}
</style>
