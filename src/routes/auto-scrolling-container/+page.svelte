<script lang="ts">
	import { onMount } from 'svelte';
	import { SortableList, removeItem, sortItems } from '$lib/index.js';
	import { defaultRootProps } from '../fixtures.js';
	import { rootProps } from '../stores.js';
	import '$lib/styles.css';

	let items = Array.from({ length: 100 }, (_, i) => ({
		id: `list-item-${i + 1}`,
		text: `List item ${i + 1}`,
	}));

	onMount(() => {
		$rootProps = { ...defaultRootProps };
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
	<title>Auto scrolling container | Svelte Sortable List</title>
</svelte:head>

<div class="wrapper direction-{$rootProps.direction}">
	<SortableList.Root {...$rootProps} on:drop={handleDrop} on:dragend={handleDragEnd}>
		{#each items as item, index (item.id)}
			<SortableList.Item id={item.id} {index}>
				<div class="ssl-item-content">
					<span class="ssl-item-content__text">{item.text}</span>
				</div>
			</SortableList.Item>
		{/each}
	</SortableList.Root>
</div>

<style>
	:global([data-page-pathname='auto-scrolling-container'] .wrapper) {
		display: flex;
		padding: 1.75rem 2rem;
		background-color: var(--ssl-gray-150);

		&.direction-vertical {
			flex-direction: column;
			height: 32rem;
			max-height: 80vh;
			max-height: 80dvh;
			border-top: 0.375rem solid var(--ssl-gray-300);
			border-bottom: 0.375rem solid var(--ssl-gray-300);
			overflow: hidden auto;
		}

		&.direction-horizontal {
			width: 32rem;
			max-width: 100%;
			border-left: 0.375rem solid var(--ssl-gray-300);
			border-right: 0.375rem solid var(--ssl-gray-300);
			overflow: auto hidden;
		}
	}
</style>
