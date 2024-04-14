<script lang="ts">
	import { onMount } from 'svelte';
	import { SortableList, IconRemove, sortItems, type SortableListProps } from '$lib/index.js';
	import { defaultItems, defaultProps } from '../fixtures.js';
	import { props } from '../stores.js';
	import '$lib/styles.css';

	let items: SortableListProps['items'] = [...defaultItems];
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
		items = items.filter((item) => String(item.id) !== itemId);
	}
</script>

<svelte:head>
	<title>Dynamic items | Svelte Sortable List</title>
</svelte:head>

<SortableList {items} {...$props} let:item on:sort={handleSort} on:remove={handleRemove}>
	{item.text}
	<IconRemove slot="remove" />
</SortableList>

<button class="button" on:click={() => (items = defaultItems)}>Reset</button>

<form
	class="form"
	on:submit|preventDefault={() => (items = [...items, { id: Date.now(), text: newItem }])}
>
	<input type="text" class="form__input" bind:value={newItem} required />
	<button type="submit" class="button">Add item</button>
</form>
