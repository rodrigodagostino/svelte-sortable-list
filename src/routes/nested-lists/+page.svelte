<script lang="ts">
	import { onMount } from 'svelte';
	import { SortableList, insertItem, removeItem, sortItems } from '$lib/index.js';
	import { defaultRootProps, getDefaultLists } from '../fixtures.js';
	import layoutState from '../states.svelte.js';
	import '$lib/styles.css';
	import SortableListIcon from '$lib/components/SortableListIcon.svelte';

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

<div class="wrapper">
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
						<SortableList.Handle>
							<SortableListIcon name="grip-top-right" />
						</SortableList.Handle>
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
			margin-block-start: 5dvh;
			margin-inline: -3rem;

			@media (min-width: 46em) {
				align-items: center;
			}

			@media (min-width: 58em) {
				margin-block-start: 17dvh;
			}
		}

		.wrapper {
			display: grid;
			max-width: 100%;
			padding-inline: 3rem;
			padding-block: 3rem;
			overflow: auto hidden;
		}

		:global(.ssl-root[data-is-nested='false']) {
			align-items: start;
		}

		:global(.ssl-item) {
			white-space: nowrap;

			&:has(:global(.ssl-root[data-is-target='true'])) :global(.column) {
				color: var(--ssl-indigo-900);
				background-color: var(--ssl-indigo-200);
				border-color: var(--ssl-indigo-400);
			}
		}

		& :global(.column) {
			flex-direction: column;
			align-items: stretch;
			width: 11rem;
			max-width: none;
			padding: 1rem;
			background-color: var(--ssl-gray-150);
			box-shadow: inset 0 0 0 0.0625rem var(--ssl-gray-400);
			text-transform: none;

			@media (min-width: 52em) {
				width: 14rem;
				white-space: nowrap;
			}
		}

		& :global(.column__header) {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			padding-top: 0.5rem;
		}

		& :global(.column__header .ssl-handle) {
			position: absolute;
			top: -0.25rem;
			right: -0.25rem;
		}

		& :global(.column__title) {
			flex: 1;
			font-size: 1rem;
		}
	}
</style>
