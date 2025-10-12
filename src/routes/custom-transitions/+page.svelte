<script lang="ts">
	import { onMount } from 'svelte';
	import { SortableList, removeItem, sortItems } from '$lib/index.js';
	import { scaleFly } from '$lib/transitions/index.js';
	import { defaultRootProps, getDefaultItems } from '../fixtures.js';
	import layoutState from '../states.svelte.js';
	import { toKebabCase } from '../utils.js';
	import '$lib/styles.css';

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

	function handleRemoveClick(e: MouseEvent) {
		const target = e.target as HTMLElement;
		const item = target.closest<HTMLLIElement>('.ssl-item');
		const itemIndex = Number(item?.dataset.itemIndex);
		if (!item || itemIndex < 0) return;
		items = removeItem(items, itemIndex);
	}

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		const formData = new FormData(e.target as HTMLFormElement);
		const text = formData.get('text') as string;
		items = [...items, { id: `${toKebabCase(text)}-${Date.now()}`, text }];
	}
</script>

<svelte:head>
	<title>Custom transitions — Svelte Sortable List</title>
</svelte:head>

<SortableList.Root
	{...layoutState.props}
	transition={{
		duration: 320,
		easing: 'cubic-bezier(0.8, -0.4, 0.5, 1)',
	}}
	ondrop={handleDrop}
	ondragend={handleDragEnd}
>
	{#each items as item, index (item.id)}
		<SortableList.Item
			{...item}
			{index}
			transitionIn={(node) => scaleFly(node, { duration: 320, x: -200 })}
			transitionOut={(node) => scaleFly(node, { duration: 320, x: 200 })}
		>
			<div class="ssl-item-content">
				<span class="ssl-item-content__text">{item.text}</span>
				<SortableList.ItemRemove onclick={handleRemoveClick} />
			</div>
		</SortableList.Item>
	{/each}
</SortableList.Root>

<button class="button" onclick={() => (items = getDefaultItems(5))}>Reset</button>
<form class="form" onsubmit={handleSubmit}>
	<input type="text" class="form-input" name="text" required />
	<button type="submit" class="button">Add item</button>
</form>

<style>
	.button:has(:global(+ form)) {
		margin-top: 2rem;
	}
</style>
