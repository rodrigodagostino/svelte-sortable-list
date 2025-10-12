<script lang="ts">
	import { onMount } from 'svelte';
	import { SortableList, removeItem, sortItems } from '$lib/index.js';
	import { defaultRootProps, getDefaultItems } from '../fixtures.js';
	import layoutState from '../states.svelte.js';
	import '$lib/styles.css';

	let items = $state(getDefaultItems(100));

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
	<title>Auto scrolling container horizontal — Svelte Sortable List</title>
</svelte:head>

<div class="wrapper direction-{layoutState.props.direction}">
	<SortableList.Root {...layoutState.props} ondrop={handleDrop} ondragend={handleDragEnd}>
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
	:global([data-page-pathname='auto-scrolling-container-horizontal'] .wrapper) {
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

			& .ssl-item-content__text {
				white-space: nowrap;
			}
		}
	}
</style>
