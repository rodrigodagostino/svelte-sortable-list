<script lang="ts">
	import { onMount } from 'svelte';
	import { SortableList, sortItems, removeItem } from '$lib/index.js';
	import { defaultRootProps, getDefaultItems } from '../fixtures.js';
	import { rootProps } from '../stores.js';
	import '$lib/styles.css';

	let columns = Array.from({ length: 3 }, (_, i) => ({
		id: `column-item-${i + 1}`,
		text: `Column ${i + 1}`,
		items: getDefaultItems(5).map((item) => ({
			id: `${i + 1}-${item.id}`,
			text: item.text,
		})),
	}));

	onMount(() => {
		$rootProps = {
			...defaultRootProps,
			direction: 'horizontal',
		};
	});

	function handleDrop(event: SortableList.RootEvents['drop']) {
		const { draggedItemIndex, isBetweenBounds, canRemoveOnDropOut } = event.detail;
		if (!isBetweenBounds && canRemoveOnDropOut) columns = removeItem(columns, draggedItemIndex);
	}

	function handleDragEnd(event: SortableList.RootEvents['dragend']) {
		const { draggedItemIndex, targetItemIndex, isCanceled } = event.detail;
		if (!isCanceled && typeof targetItemIndex === 'number' && draggedItemIndex !== targetItemIndex)
			columns = sortItems(columns, draggedItemIndex, targetItemIndex);
	}
</script>

<svelte:head>
	<title>Nested | Svelte Sortable List</title>
</svelte:head>

<SortableList.Root {...$rootProps} on:drop={handleDrop} on:dragend={handleDragEnd}>
	{#each columns as column, index (column.id)}
		<SortableList.Item id={column.id} {index}>
			<div class="ssl-item-content">
				<p>{column.text}</p>

				<hr />

				<SortableList.Root
					{...$rootProps}
					direction="vertical"
					group={column.id}
					on:drop={(event) => {
						const { draggedItemIndex, isBetweenBounds, canRemoveOnDropOut } = event.detail;
						if (!isBetweenBounds && canRemoveOnDropOut)
							column.items = removeItem(column.items, draggedItemIndex);
					}}
					on:dragend={(event) => {
						const { draggedItemIndex, targetItemIndex, isCanceled } = event.detail;
						if (
							!isCanceled &&
							typeof targetItemIndex === 'number' &&
							draggedItemIndex !== targetItemIndex
						)
							column.items = sortItems(column.items, draggedItemIndex, targetItemIndex);
					}}
				>
					{#each column.items as item, index (item.id)}
						<SortableList.Item {...item} {index} group={column.id}>
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

<style>
	.ssl-item-content {
		display: flex;
		flex-direction: column;
		padding: 16px;
	}

	hr {
		width: 100%;
	}
</style>
