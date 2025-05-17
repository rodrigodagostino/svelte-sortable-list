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
	import { rootProps } from '../stores.js';
	import '$lib/styles.css';

	let items = $state([...defaultItems]);
	let newItem: string = $state('');

	onMount(() => {
		$rootProps = { ...defaultProps };
	});

	function handleSort({ prevItemIndex, nextItemIndex }: SortEventDetail) {
		items = sortItems(items, prevItemIndex, nextItemIndex);
	}

	function handleRemove({ itemIndex }: RemoveEventDetail) {
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

<SortableList {...$rootProps} onSort={handleSort} onRemove={handleRemove}>
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

<button class="button" onclick={() => (items = defaultItems)}>Reset</button>

<form
	class="form"
	onsubmit={(ev) => {
		items = [...items, { id: `${toKebabCase(newItem)}-${Date.now()}`, text: newItem }];
		ev.preventDefault();
	}}
>
	<input type="text" class="form__input" bind:value={newItem} required />
	<button type="submit" class="button">Add item</button>
</form>

<style lang="scss">
	.button:has(:global(+ form)) {
		margin-top: 2rem;
	}
</style>
