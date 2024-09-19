<script lang="ts">
	import { onMount } from 'svelte';
	import { SortableList, SortableItem, sortItems, type SortEventDetail } from '$lib/index.js';
	import { defaultItems, defaultProps } from '../fixtures.js';
	import { props } from '../stores.js';
	import '$lib/styles.css';

	let items = [...defaultItems];

	onMount(() => {
		$props = {
			...defaultProps,
			direction: 'horizontal',
		};
	});

	function handleSort(event: CustomEvent<SortEventDetail>) {
		const { prevItemIndex, nextItemIndex } = event.detail;
		items = sortItems(items, prevItemIndex, nextItemIndex);
	}
</script>

<svelte:head>
	<title>Direction horizontal | Svelte Sortable List</title>
</svelte:head>

<SortableList {...$props} on:sort={handleSort}>
	{#each items as item, index (item.id)}
		<SortableItem id={item.id} {index}>
			<div class="ssl-item__content">
				{item.text}
			</div>
		</SortableItem>
	{/each}
</SortableList>
