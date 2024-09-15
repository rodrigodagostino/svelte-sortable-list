<script lang="ts">
	import { onMount } from 'svelte';
	import {
		SortableList,
		SortableItem,
		Remove,
		IconRemove,
		removeItem,
		sortItems,
	} from '$lib/index.js';
	import { defaultItems, defaultProps } from '../fixtures.js';
	import { props } from '../stores.js';
	import '$lib/styles.css';

	let items = [...defaultItems];
	let newItem: string;

	onMount(() => {
		$props = { ...defaultProps };
	});

	function handleSort(event: CustomEvent) {
		const { prevIndex, nextIndex } = event.detail;
		items = sortItems(items, prevIndex, nextIndex);
	}

	function handleRemove(event: CustomEvent) {
		const { itemId } = event.detail;
		items = removeItem(items, itemId);
	}

	function toKebabCase(str: string) {
		return str
			.replace(/([a-z])([A-Z])/g, '$1-$2')
			.replace(/[\s_]+/g, '-')
			.toLowerCase();
	}
</script>

<svelte:head>
	<title>Dynamic items | Svelte Sortable List</title>
</svelte:head>

<SortableList {...$props} on:sort={handleSort} on:remove={handleRemove}>
	{#each items as item, index (item.id)}
		<SortableItem id={item.id} {index}>
			<div class="ssl-item__content">
				{item.text}
			</div>
			<Remove itemId={item.id}>
				<IconRemove />
			</Remove>
		</SortableItem>
	{/each}
</SortableList>

<button class="button" on:click={() => (items = defaultItems)}>Reset</button>

<form
	class="form"
	on:submit|preventDefault={() =>
		(items = [...items, { id: `${toKebabCase(newItem)}-${Date.now()}`, text: newItem }])}
>
	<input type="text" class="form__input" bind:value={newItem} required />
	<button type="submit" class="button">Add item</button>
</form>
