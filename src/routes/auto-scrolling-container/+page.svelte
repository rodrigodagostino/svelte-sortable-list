<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { SortableList, removeItem, sortItems } from '$lib/index.js';
	import { autoScroll } from '$lib/modules/index.js';
	import { defaultRootProps, getDefaultItems } from '../fixtures.js';
	import layoutState from '../states.svelte.js';
	import '$lib/styles.css';

	/**
	 * Configured through the query string for the E2E tests (read once at mount):
	 * - `autoScroll=off`: leaves the `autoScroll()` module out.
	 * - `threshold` / `margin`: options passed to `autoScroll()`.
	 */
	const params = page.url.searchParams;
	const threshold = params.has('threshold') ? Number(params.get('threshold')) : undefined;
	const margin = params.has('margin') ? Number(params.get('margin')) : undefined;
	const modules = params.get('autoScroll') === 'off' ? [] : [autoScroll({ threshold, margin })];

	let items = $state(getDefaultItems(100));

	onMount(() => {
		layoutState.props = { ...defaultRootProps };
	});

	function handleDrop(e: SortableList.RootEvents['ondrop']) {
		const { draggedItemIndex, isWithinBounds, canRemoveOnDropOut } = e;
		if (!isWithinBounds && canRemoveOnDropOut) items = removeItem(items, draggedItemIndex);
	}

	function handleDragEnd(e: SortableList.RootEvents['ondragend']) {
		const { draggedItemIndex, targetItemIndex, isCanceled } = e;
		if (!isCanceled && typeof targetItemIndex === 'number' && draggedItemIndex !== targetItemIndex)
			items = sortItems(items, draggedItemIndex, targetItemIndex);
	}
</script>

<svelte:head>
	<title>Auto scrolling container — Svelte Sortable List</title>
</svelte:head>

<div class="wrapper direction-{layoutState.props.direction}">
	<SortableList.Root {...layoutState.props} {modules} ondrop={handleDrop} ondragend={handleDragEnd}>
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
