<script lang="ts">
	import { SortableList, IconRemove, reorderItems } from '$lib/index.js';

	let items: { id: number; text: string }[] = [
		{
			id: 1,
			text: 'List item 1',
		},
		{
			id: 2,
			text: 'List item 2',
		},
		{
			id: 3,
			text: 'List item 3',
		},
		{
			id: 4,
			text: 'List item 4',
		},
		{
			id: 5,
			text: 'List item 5',
		},
	];
	let newItem: string;

	function handleSort(event: CustomEvent) {
		const { oldIndex, newIndex } = event.detail;
		items = reorderItems(items, oldIndex, newIndex);
	}

	function handleRemove(event: CustomEvent) {
		const { id } = event.detail;
		items = items.filter((i) => i.id !== id);
	}
</script>

<svelte:head>
	<title>Dynamic items | Svelte Sortable List</title>
</svelte:head>

<SortableList {items} let:item on:sort={handleSort} on:remove={handleRemove}>
	{item.text}
	<IconRemove slot="remove" />
</SortableList>

<form
	class="form"
	on:submit|preventDefault={() => (items = [...items, { id: Date.now(), text: newItem }])}
>
	<input type="text" class="form__input" bind:value={newItem} required />
	<button type="submit" class="form__button">Add item</button>
</form>

<style lang="scss">
	.form {
		display: flex;
		margin-top: 3rem;

		&__input {
			border: none;
			border: 0.0625rem solid var(--gray-200);
			padding-inline: 0.75rem;
		}

		&__button {
			display: flex;
			align-items: center;
			height: 3rem;
			padding-block: 0;
			background-color: var(--gray-800);
			border: none;
			color: var(--white);
			line-height: 1;
			transition: background-color 240ms;

			&:focus,
			&:hover {
				background-color: var(--gray-600);
			}

			&:active {
				background-color: var(--gray-950);
			}
		}
	}
</style>
