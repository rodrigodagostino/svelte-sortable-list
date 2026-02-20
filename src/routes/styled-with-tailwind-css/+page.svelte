<script lang="ts">
	import { onMount } from 'svelte';
	import { SortableList, removeItem, sortItems } from '$lib/index.js';
	import { defaultRootProps, getDefaultItems } from '../fixtures.js';
	import layoutState from '../states.svelte.js';
	import '../../app.css';

	let items = $state(getDefaultItems(5));

	onMount(() => {
		layoutState.props = { ...defaultRootProps };
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
	<title>Styled with Tailwind CSS — Svelte Sortable List</title>
</svelte:head>

<SortableList.Root
	{...layoutState.props}
	class="rounded-[0.625rem] focus-visible:outline-2 focus-visible:-outline-offset-2! focus-visible:outline-indigo-800!"
	ondrop={handleDrop}
	ondragend={handleDragEnd}
>
	{#each items as item, index (item.id)}
		<SortableList.Item
			{...item}
			{index}
			class="group rounded-md focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-indigo-800!"
		>
			<div
				class="flex items-center justify-center rounded-md bg-indigo-500 px-7 py-2 inset-ring inset-ring-indigo-800 transition-[background-color,box-shadow] group-focus-within:bg-indigo-600 group-data-[drag-state*='kbd-drag']:bg-indigo-400 group-data-[drag-state*='kbd-drag']:shadow-lg group-data-[drag-state*='kbd-drag']:shadow-indigo-900/72 group-data-[drag-state*='ptr-drag']:bg-indigo-400 group-data-[drag-state*='ptr-drag']:shadow-lg group-data-[drag-state*='ptr-drag']:shadow-indigo-900/72 group-[[data-is-ghost='false']:hover]:bg-indigo-600 group-[[data-is-ghost='false'][data-drag-state*='ptr']]:opacity-0"
			>
				<span class="my-2.5 text-base leading-tight font-medium text-white uppercase">
					{item.text}
				</span>
			</div>
		</SortableList.Item>
	{/each}
</SortableList.Root>
