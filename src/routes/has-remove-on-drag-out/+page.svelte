<script lang="ts">
	import { onMount } from 'svelte';
	import { SortableList, reorderItems, type SortableListProps } from '$lib/index.js';
	import { defaultProps, varyingItems } from '../fixtures.js';
	import { props } from '../stores.js';
	import '$lib/styles.css';

	let items: SortableListProps['items'] = [...varyingItems];

	onMount(() => {
		$props = {
			...defaultProps,
			hasRemoveOnDragOut: true,
		};
	});

	function handleSort(event: CustomEvent) {
		const { prevIndex, nextIndex } = event.detail;
		items = reorderItems(items, prevIndex, nextIndex);
	}

	function handleRemove(event: CustomEvent) {
		const { id } = event.detail;
		items = items.filter((i) => String(i.id) !== id);
	}
</script>

<svelte:head>
	<title>Has remove on drag out | Svelte Sortable List</title>
</svelte:head>

<SortableList {items} {...$props} let:item on:sort={handleSort} on:remove={handleRemove}>
	{item.text}
</SortableList>

<button class="form__button" on:click={() => (items = varyingItems)}>Reset</button>
