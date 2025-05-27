<script lang="ts">
	import { onMount } from 'svelte';
	import {
		SortableList,
		SortableItem,
		Remove,
		removeItem,
		sortItems,
		type DropEventDetail,
		type DragEndEventDetail,
	} from '$lib/index.js';
	import { defaultItems, defaultProps } from '../fixtures.js';
	import { props } from '../stores.js';
	import { toKebabCase } from '../utils.js';
	import '$lib/styles.css';

	let items = [...defaultItems];
	let newItem: string;

	onMount(() => {
		$props = { ...defaultProps };
	});

	function handleDrop(event: CustomEvent<DropEventDetail>) {
		const { draggedItemIndex, isBetweenBounds, canRemoveOnDropOut } = event.detail;
		if (!isBetweenBounds && canRemoveOnDropOut) items = removeItem(items, draggedItemIndex);
	}

	function handleDragEnd(event: CustomEvent<DragEndEventDetail>) {
		const { draggedItemIndex, targetItemIndex, isCanceled } = event.detail;
		if (!isCanceled && typeof targetItemIndex === 'number' && draggedItemIndex !== targetItemIndex)
			items = sortItems(items, draggedItemIndex, targetItemIndex);
	}

	function handleRemoveClick(event: MouseEvent) {
		const target = event.target as HTMLElement;
		const item: HTMLLIElement | null = target.closest('.ssl-item');
		const itemIndex = Number(item?.dataset.itemIndex);
		if (!item || itemIndex < 0) return;
		items = removeItem(items, itemIndex);
	}
</script>

<svelte:head>
	<title>Dynamic items | Svelte Sortable List</title>
</svelte:head>

<SortableList {...$props} on:drop={handleDrop} on:dragend={handleDragEnd}>
	{#each items as item, index (item.id)}
		<SortableItem {...item} {index}>
			<div class="ssl-item__content">
				{item.text}
			</div>
			<Remove on:click={handleRemoveClick} />
		</SortableItem>
	{/each}
</SortableList>

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
