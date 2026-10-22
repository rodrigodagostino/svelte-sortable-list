<script lang="ts">
	import { onMount } from 'svelte';
	import { SortableList, insertItem, removeItem, sortItems } from '$lib/index.js';
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

	function handleListsDragEnd(e: SortableList.RootEvents['ondragend']) {
		const { draggedItemIndex, targetItemIndex, isCanceled } = e;
		if (isCanceled || typeof targetItemIndex !== 'number' || draggedItemIndex === targetItemIndex)
			return;

		lists = sortItems(lists, draggedItemIndex, targetItemIndex);
	}

	function handleItemsDrop(e: SortableList.RootEvents['ondrop']) {
		const { sourceListId, draggedItemIndex, isWithinBounds, canRemoveOnDropOut } = e;
		if (!isWithinBounds && canRemoveOnDropOut) {
			const list = lists.find((l) => l.id === sourceListId);
			if (!list) return;

			list.items = removeItem(list.items, draggedItemIndex);
		}
	}

	function handleItemsDragEnd(e: SortableList.RootEvents['ondragend']) {
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
			if (!sourceList || !targetList || !draggedItem) return;

			targetList.items = insertItem(targetList.items, draggedItem, targetItemIndex);
			sourceList.items = removeItem(sourceList.items, draggedItemIndex);
		}
	}
</script>

<svelte:head>
	<title>Nested lists — Svelte Sortable List</title>
</svelte:head>

<div class="board direction-{layoutState.props.direction}" role="group" aria-label="Kanban board">
	<SortableList.Root
		class="board"
		id="board"
		direction="horizontal"
		gap={32}
		transition={layoutState.props.transition}
		aria-label="Kanban board"
		ondragend={handleListsDragEnd}
	>
		{#each lists as { id, title, items }, index (id)}
			<SortableList.Item id="column-{id}" {index}>
				<div class="ssl-item-content column">
					<div class="column__header">
						<SortableList.Handle />
						<h2 class="column__title" id="column-title-{id}">{title}</h2>
						<span>{items.length}</span>
					</div>
					<SortableList.Root
						{...layoutState.props}
						group="nested-list-group"
						{id}
						{index}
						aria-labelledby="column-title-{id}"
						ondrop={(e) => handleItemsDrop(e)}
						ondragend={(e) => handleItemsDragEnd(e)}
					>
						{#each items as item, itemIndex (item.id)}
							<SortableList.Item {...item} index={itemIndex}>
								<div class="ssl-item-content">
									<span class="ssl-item-content__text">{item.text}</span>
								</div>
							</SortableList.Item>
						{/each}
					</SortableList.Root>
				</div>
			</SortableList.Item>
		{/each}
	</SortableList.Root>
</div>

<style>
	:global([data-page-pathname='nested-lists']) {
		& :global(.app-main .container) {
			align-items: start;
			max-width: calc(100% + 6rem);
			margin-inline: -3rem;

			&:has(.board.direction-vertical) {
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

			&:has(.board.direction-horizontal) {
				margin-inline-end: auto;
				overflow: auto hidden;
			}
		}

		:global(.ssl-root[data-is-nested='false']) {
			align-items: start;
		}

		:global(.ssl-item) {
			white-space: nowrap;
		}

		& :global(.column) {
			flex-direction: column;
			align-items: stretch;
			width: 11rem;
			max-width: none;
			padding: 1rem;
			background-color: var(--ssl-gray-150);
			text-transform: none;

			/* Keep two columns side by side on narrow viewports, so one can be dragged over the other. */
			@media (min-width: 30em) {
				width: 16rem;
				white-space: nowrap;
			}
		}

		& :global(.column__header) {
			display: flex;
			align-items: center;
			gap: 0.5rem;
		}

		& :global(.column__header .ssl-handle) {
			margin-inline-start: -0.5rem;
		}

		& :global(.column__title) {
			flex: 1;
			font-size: 1rem;
		}
	}
</style>
