<script lang="ts">
	import { onMount } from 'svelte';
	import {
		SortableList,
		SortableItem,
		removeItem,
		sortItems,
		type RemoveEventDetail,
		type SortEventDetail,
	} from '$lib/index.js';
	import { defaultProps } from '../fixtures.js';
	import { props } from '../stores.js';
	import '$lib/styles.css';

	let items = Array.from({ length: 100 }, (_, i) => ({
		id: `list-item-${i + 1}`,
		text: `List item ${i + 1}`,
	}));

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
</script>

<svelte:head>
	<title>Auto scrolling | Svelte Sortable List</title>
</svelte:head>

<SortableList {...$props} on:sort={handleSort} on:remove={handleRemove}>
	{#each items as item, index (item.id)}
		<SortableItem id={item.id} {index}>
			<div class="ssl-item__content">
				{item.text}
			</div>
		</SortableItem>
	{/each}
</SortableList>
