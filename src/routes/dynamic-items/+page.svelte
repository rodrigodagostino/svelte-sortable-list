<script lang="ts">
	import { SortableList, IconRemove, reorderItems, type SortableListProps } from '$lib/index.js';
	import { defaultItems } from '../fixtures.js';
	import '$lib/styles.css';

	let items: SortableListProps['items'] = [...defaultItems];
	let newItem: string;

	function handleSort(event: CustomEvent) {
		const { oldIndex, newIndex } = event.detail;
		items = reorderItems(items, oldIndex, newIndex);
	}

	function handleRemove(event: CustomEvent) {
		const { id } = event.detail;
		items = items.filter((i) => String(i.id) !== id);
	}
</script>

<svelte:head>
	<title>Dynamic items | Svelte Sortable List</title>
</svelte:head>

<SortableList {items} let:item on:sort={handleSort} on:remove={handleRemove}>
	{item.text}
	<IconRemove slot="remove" />
</SortableList>

<button class="form__button" on:click={() => (items = defaultItems)}>Reset</button>

<form
	class="form"
	on:submit|preventDefault={() => (items = [...items, { id: Date.now(), text: newItem }])}
>
	<input type="text" class="form__input" bind:value={newItem} required />
	<button type="submit" class="form__button">Add item</button>
</form>
