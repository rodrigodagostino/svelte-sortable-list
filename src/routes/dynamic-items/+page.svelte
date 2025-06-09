<script lang="ts">
	import { onMount } from 'svelte';
	import { SortableList, removeItem, sortItems } from '$lib/index.js';
	import { defaultItems, defaultProps } from '../fixtures.js';
	import { props } from '../stores.js';
	import { toKebabCase } from '../utils.js';
	import '$lib/styles.css';

	let items = [...defaultItems];
	let newItem: string;

	onMount(() => {
		$props = { ...defaultProps };
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

	function handleRemoveClick(event: MouseEvent) {
		const target = event.target as HTMLElement;
		const item = target.closest<HTMLLIElement>('.ssl-item');
		const itemIndex = Number(item?.dataset.itemIndex);
		if (!item || itemIndex < 0) return;
		items = removeItem(items, itemIndex);
	}
</script>

<svelte:head>
	<title>Dynamic items | Svelte Sortable List</title>
</svelte:head>

<SortableList.Root {...$props} on:drop={handleDrop} on:dragend={handleDragEnd}>
	{#each items as item, index (item.id)}
		<SortableList.Item {...item} {index}>
			<div class="ssl-item-content">
				<span class="ssl-item-content__text">{item.text}</span>
				<SortableList.ItemRemove on:click={handleRemoveClick} />
			</div>
		</SortableList.Item>
	{/each}
</SortableList.Root>

<button class="button" on:click={() => (items = defaultItems)}>Reset</button>

<form
	class="form"
	on:submit|preventDefault={() =>
		(items = [...items, { id: `${toKebabCase(newItem)}-${Date.now()}`, text: newItem }])}
>
	<input type="text" class="form-input" bind:value={newItem} required />
	<button type="submit" class="button">Add item</button>
</form>

<style>
	.button:has(+ form) {
		margin-top: 2rem;
	}
</style>
