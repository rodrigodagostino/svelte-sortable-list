<script lang="ts">
	import { onMount } from 'svelte';
	import {
		SortableList,
		SortableItem,
		Remove,
		IconRemove,
		removeItem,
		sortItems,
		type RemoveEventDetail,
		type SortEventDetail,
	} from '$lib/index.js';
	import { defaultItems, defaultProps } from '../fixtures.js';
	import { props } from '../stores.js';
	import '$lib/styles.css';

	let items = [...defaultItems];
	let newItem: string;

	onMount(() => {
		$props = { ...defaultProps };
	});

	function handleSort(event: CustomEvent<SortEventDetail>) {
		const { prevItemIndex, nextItemIndex } = event.detail;
		items = sortItems(items, prevItemIndex, nextItemIndex);
	}

	function handleRemove(event: CustomEvent<RemoveEventDetail>) {
		const { itemIndex } = event.detail;
		items = removeItem(items, itemIndex);
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
		<SortableItem {...item} {index}>
			<div class="ssl-item__content">
				{item.text}
			</div>
			<Remove>
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
	<input type="text" class="form-input" bind:value={newItem} required />
	<button type="submit" class="button">Add item</button>
</form>

<style lang="scss">
	.button:has(+ form) {
		margin-top: 2rem;
	}
</style>
