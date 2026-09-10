<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { SortableList, insertItem, removeItem, sortItems } from '$lib/index.js';
	import { defaultRootProps, getDefaultLists } from '../fixtures.js';
	import layoutState from '../states.svelte.js';
	import '$lib/styles.css';

	/**
	 * Benchmark fixture driven by `benchmarking/run.mjs`. Tuned through the query string (read once, reload
	 * after changing it):
	 * - `count`: items per list (default 500).
	 * - `lists`: number of lists; more than one puts them in the same group (default 1).
	 * - `scroll=container`: wraps each list in a fixed-height scroll container (default: document scroll).
	 * - `duration`: transition duration in ms (default 320).
	 * - `handle=1` / `remove=1`: render a handle / remove button inside each item.
	 */
	const params = page.url.searchParams;
	const count = Number(params.get('count') ?? 500);
	const listCount = Math.max(1, Number(params.get('lists') ?? 1));
	const hasScrollContainer = params.get('scroll') === 'container';
	const duration = Number(params.get('duration') ?? defaultRootProps.transition?.duration ?? 320);
	const hasHandle = params.get('handle') === '1';
	const hasRemove = params.get('remove') === '1';

	let lists = $state(
		getDefaultLists(
			Array.from({ length: listCount }, (_, i) => ({ title: `List ${i + 1}`, length: count }))
		)
	);
	let addedCount = 0;

	interface HarnessEvent {
		type: string;
		t: number;
		key?: string;
	}
	// Timestamps the benchmark reads back through `window.__ssl.events`: library callbacks plus the
	// pointer/keyboard release that preceded them, to measure release → `ondragend` latency.
	const events: HarnessEvent[] = [];
	function record(type: string, key?: string) {
		events.push(
			key === undefined ? { type, t: performance.now() } : { type, t: performance.now(), key }
		);
	}

	onMount(() => {
		layoutState.props = {
			...defaultRootProps,
			transition: { ...defaultRootProps.transition, duration },
		};

		window.addEventListener('pointerup', () => record('pointerup'), true);
		window.addEventListener('keydown', (e) => record('keydown', e.key), true);
		(window as unknown as { __ssl: unknown }).__ssl = {
			ready: true,
			events,
			addItem() {
				addedCount += 1;
				lists[0].items = insertItem(
					lists[0].items,
					{ id: `added-item-${addedCount}`, text: `Added Item ${addedCount}` },
					lists[0].items.length
				);
			},
			removeLastItem() {
				lists[0].items = removeItem(lists[0].items, lists[0].items.length - 1);
			},
		};
	});

	function handleDrop(e: SortableList.RootEvents['ondrop']) {
		record('drop');
		const { sourceListId, draggedItemIndex, isWithinBounds, canRemoveOnDropOut } = e;
		if (!isWithinBounds && canRemoveOnDropOut) {
			const list = lists.find((l) => l.id === sourceListId);
			if (list) list.items = removeItem(list.items, draggedItemIndex);
		}
	}

	function handleDragEnd(e: SortableList.RootEvents['ondragend']) {
		record('dragend');
		const {
			sourceListId,
			targetListId,
			draggedItemId,
			draggedItemIndex,
			targetItemId,
			targetItemIndex,
			isCanceled,
		} = e;
		if (isCanceled || typeof targetItemIndex !== 'number' || draggedItemId === targetItemId) return;

		const sourceList = lists.find((l) => l.id === sourceListId);
		if (!sourceList) return;
		if (!targetListId) {
			sourceList.items = sortItems(sourceList.items, draggedItemIndex, targetItemIndex);
			return;
		}

		const targetList = lists.find((l) => l.id === targetListId);
		const draggedItem = sourceList.items.find((item) => item.id === draggedItemId);
		if (!targetList || !draggedItem) return;
		targetList.items = insertItem(targetList.items, draggedItem, targetItemIndex);
		sourceList.items = removeItem(sourceList.items, draggedItemIndex);
	}

	function handleRemoveClick(listId: string, itemId: string) {
		const list = lists.find((l) => l.id === listId);
		if (!list) return;
		list.items = removeItem(
			list.items,
			list.items.findIndex((item) => item.id === itemId)
		);
	}
</script>

<svelte:head>
	<title>Benchmarking — Svelte Sortable List</title>
</svelte:head>

{#snippet listItems(listId: string, items: SortableList.ItemData[])}
	{#each items as item, index (item.id)}
		<SortableList.Item {...item} {index}>
			<div class="ssl-item-content">
				{#if hasHandle}
					<SortableList.ItemHandle />
				{/if}
				<span class="ssl-item-content__text">{item.text}</span>
				{#if hasRemove}
					<SortableList.ItemRemove onclick={() => handleRemoveClick(listId, item.id)} />
				{/if}
			</div>
		</SortableList.Item>
	{/each}
{/snippet}

<div class="lists" class:has-scroll-container={hasScrollContainer} style:--list-count={listCount}>
	{#each lists as { id, title, items }, index (id)}
		<div class="list">
			<h2 class="list__title" id="list-title-{id}">{title} ({items.length})</h2>
			{#if listCount > 1}
				<SortableList.Root
					{...layoutState.props}
					group="benchmarking-group"
					{id}
					{index}
					aria-labelledby="list-title-{id}"
					onmounted={index === 0 ? () => performance.mark('ssl-mounted') : undefined}
					ondragstart={() => record('dragstart')}
					ondrag={() => record('drag')}
					ondrop={handleDrop}
					ondragend={handleDragEnd}
				>
					{@render listItems(id, items)}
				</SortableList.Root>
			{:else}
				<SortableList.Root
					{...layoutState.props}
					{id}
					aria-labelledby="list-title-{id}"
					onmounted={() => performance.mark('ssl-mounted')}
					ondragstart={() => record('dragstart')}
					ondrag={() => record('drag')}
					ondrop={handleDrop}
					ondragend={handleDragEnd}
				>
					{@render listItems(id, items)}
				</SortableList.Root>
			{/if}
		</div>
	{/each}
</div>

<style>
	:global([data-page-pathname='benchmarking'] .app-main .container) {
		align-items: start;
		max-width: calc(100% + 6rem);
		margin-inline: -3rem;

		@media (min-width: 46em) {
			align-items: center;
		}
	}

	.lists {
		display: grid;
		grid-template-columns: repeat(var(--list-count), minmax(12rem, 1fr));
		gap: 2rem;
		align-items: start;
		padding-inline: 3rem;
		padding-block-end: 3rem;
	}

	.list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		background-color: var(--ssl-gray-150);
		border: 1px solid var(--ssl-gray-400);
		border-radius: 0.25rem;
		transition:
			background-color 320ms,
			border-color 320ms;

		&:has(:global(.ssl-root[data-is-target='true'])) {
			color: var(--ssl-indigo-900);
			background-color: var(--ssl-indigo-200);
			border-color: var(--ssl-indigo-400);
		}
	}

	.lists.has-scroll-container .list {
		height: 36rem;
		overflow: hidden auto;
	}

	.list__title {
		font-size: 1rem;
	}
</style>
