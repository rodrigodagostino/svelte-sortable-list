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
	class="rounded-lg focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-indigo-600"
	ondrop={handleDrop}
	ondragend={handleDragEnd}
>
	{#each items as item, index (item.id)}
		<SortableList.Item
			{...item}
			{index}
			class="group rounded-md focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-indigo-600 [&[data-drag-state*='kbd-drag']]:shadow-md [&[data-drag-state*='ptr-drag']]:shadow-md [&[data-is-ghost='false'][data-drag-state*='ptr-drag']]:opacity-0 [&[data-is-ghost='false'][data-drag-state='ptr-drop']]:opacity-0"
		>
			<div
				class="flex items-center justify-center rounded-md bg-indigo-600 px-8 py-4 transition-colors group-focus-within:bg-indigo-800 group-[[data-drag-state*='kbd-drag']]:bg-indigo-500 group-[[data-drag-state*='ptr-drag']]:bg-indigo-500 group-[[data-is-ghost='false']:hover]:bg-indigo-800"
			>
				<span class="text-base font-medium uppercase text-white">{item.text}</span>
			</div>
		</SortableList.Item>
	{/each}
</SortableList.Root>
