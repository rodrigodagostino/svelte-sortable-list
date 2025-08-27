<script lang="ts">
	import { onMount } from 'svelte';
	import { SortableList, removeItem, sortItems } from '$lib/index.js';
	import { defaultRootProps, getDefaultItems } from '../fixtures.js';
	import layoutState from '../states.svelte.js';
	import { toKebabCase } from '../utils.js';
	import '$lib/styles.css';

	let items = $state(getDefaultItems(5));
	let newItem: string = $state('');

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

	function handleRemoveClick(e: MouseEvent) {
		const target = e.target as HTMLElement;
		const item = target.closest<HTMLLIElement>('.ssl-item');
		const itemIndex = Number(item?.dataset.itemIndex);
		if (!item || itemIndex < 0) return;
		items = removeItem(items, itemIndex);
	}
</script>

<svelte:head>
	<title>Dynamic items — Svelte Sortable List</title>
</svelte:head>

<SortableList.Root {...layoutState.props} ondrop={handleDrop} ondragend={handleDragEnd}>
	{#each items as item, index (item.id)}
		<SortableList.Item {...item} {index}>
			<div class="ssl-item-content">
				<span class="ssl-item-content__text">{item.text}</span>
				<SortableList.ItemRemove onclick={handleRemoveClick} />
			</div>
		</SortableList.Item>
	{/each}
</SortableList.Root>

<button class="button" onclick={() => (items = getDefaultItems(5))}>Reset</button>

<form
	class="form"
	onsubmit={(e) => {
		e.preventDefault();
		items = [...items, { id: `${toKebabCase(newItem)}-${Date.now()}`, text: newItem }];
	}}
>
	<input type="text" class="form-input" bind:value={newItem} required />
	<button type="submit" class="button">Add item</button>
</form>

<style>
	.button:has(:global(+ form)) {
		margin-top: 2rem;
	}
</style>
