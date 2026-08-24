<script lang="ts">
	import { onMount } from 'svelte';
	import { SortableList, sortItems, removeItem, insertItem } from '$lib/index.js';
	import { defaultRootProps, getDefaultLists } from '../fixtures.js';
	import layoutState from '../states.svelte.js';
	import '$lib/styles.css';

	let lists = $state(
		getDefaultLists([
			{ title: 'To Do', length: 5 },
			{ title: 'Doing', length: 3 },
			{ title: 'Done', length: 4 },
		])
	);

	onMount(() => {
		layoutState.props = {
			...defaultRootProps,
		};
	});

	function handleDrop(e: SortableList.RootEvents['ondrop']) {
		const { sourceListId, draggedItemIndex, isWithinBounds, canRemoveOnDropOut } = e;
		if (!isWithinBounds && canRemoveOnDropOut) {
			const list = lists.find((l) => l.id === sourceListId);
			if (!list) return;

			list.items = removeItem(list.items, draggedItemIndex);
		}
	}

	function handleDragEnd(e: SortableList.RootEvents['ondragend']) {
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

		if (!targetListId) {
			const list = lists.find((l) => l.id === sourceListId);
			if (!list) return;

			list.items = sortItems(list.items, draggedItemIndex, targetItemIndex);
		} else {
			const sourceList = lists.find((list) => list.id === sourceListId);
			const targetList = lists.find((list) => list.id === targetListId);
			const draggedItem = sourceList?.items.find((item) => item.id === draggedItemId);
			if (!targetList || typeof targetItemIndex !== 'number' || !draggedItem) return;
			if (!sourceList || typeof draggedItemIndex !== 'number') return;

			targetList.items = insertItem(targetList.items, draggedItem, targetItemIndex);
			sourceList.items = removeItem(sourceList.items, draggedItemIndex);
		}
	}
</script>

<svelte:head>
	<title>Multiple lists — Svelte Sortable List</title>
</svelte:head>

<div class="lists direction-{layoutState.props.direction}">
	{#each lists as { id, title, items }, index (id)}
		<div class="list">
			<div class="list__header">
				<h2 class="list__title">{title}</h2>
				<span>{items.length}</span>
			</div>
			<SortableList.Root
				{...layoutState.props}
				group="list-group"
				{id}
				{index}
				ondrop={(e) => handleDrop(e)}
				ondragend={(e) => handleDragEnd(e)}
			>
				{#each items as item, index (item.id)}
					<SortableList.Item {...item} {index}>
						<div class="ssl-item-content">
							<span class="ssl-item-content__text">{item.text}</span>
						</div>
					</SortableList.Item>
				{/each}
			</SortableList.Root>
		</div>
	{/each}
</div>

<style>
	:global([data-page-pathname='multiple-lists']) {
		& :global(.app-main .container) {
			align-items: start;
			max-width: calc(100% + 6rem);
			margin-inline: -3rem;

			&:has(.lists.direction-vertical) {
				margin-block-start: 8vh;
				margin-block-start: 8dvh;

				@media (min-width: 46em) {
					align-items: center;
				}

				@media (min-width: 58em) {
					margin-block-start: 20vh;
					margin-block-start: 20dvh;
				}
			}

			&:has(.lists.direction-horizontal) {
				margin-inline-end: auto;
				overflow-x: auto;
			}
		}
	}

	.lists {
		display: grid;
		gap: 2rem;
		padding-inline: 3rem;
		padding-block-end: 3rem;

		&.direction-vertical {
			grid-template-columns: repeat(3, minmax(12rem, 1fr));
		}

		&.direction-horizontal {
			grid-template-rows: 1fr;
		}
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
			background-color: var(--ssl-indigo-200);
			border-color: var(--ssl-indigo-400);
		}
	}

	.list__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.list__title {
		font-size: 1rem;
	}

	:global(.ssl-item) {
		white-space: nowrap;
	}
</style>
