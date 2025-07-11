<script lang="ts">
	import { onMount } from 'svelte';
	import { SortableList, removeItem, sortItems } from '$lib/index.js';
	import { defaultRootProps, getDefaultItems } from '../fixtures.js';
	import { rootProps } from '../stores.js';
	import '../../app.css';

	let items = getDefaultItems(5);

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
	<title>Styled with Tailwind CSS | Svelte Sortable List</title>
</svelte:head>

<SortableList.Root
	{...$rootProps}
	class="rounded-md focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-indigo-600"
	on:drop={handleDrop}
	on:dragend={handleDragEnd}
>
	{#each items as item, index (item.id)}
		<SortableList.Item
			{...item}
			{index}
			class="rounded-md focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-indigo-600 [&[data-drag-state='keyboard-dragging']]:shadow-md [&[data-drag-state='keyboard-dragging']_>_*]:bg-indigo-500 [&[data-drag-state='pointer-dragging']]:shadow-md [&[data-drag-state='pointer-dragging']_>_*]:bg-indigo-500 [&[data-is-ghost='false'][data-drag-state='pointer-dragging']]:opacity-0 [&[data-is-ghost='false'][data-drag-state='pointer-dropping']]:opacity-0 hover:[&[data-is-ghost='false']_>_*]:bg-indigo-800"
		>
			<div
				class="flex items-center justify-center rounded-md bg-indigo-600 px-8 py-4 transition-colors"
			>
				<span class="text-base font-medium uppercase text-white">{item.text}</span>
			</div>
		</SortableList.Item>
	{/each}
</SortableList.Root>
