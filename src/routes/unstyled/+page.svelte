<script lang="ts">
	import { onMount } from 'svelte';
	import { SortableList, SortableItem, sortItems } from '$lib/index.js';
	import { defaultItems, defaultProps } from '../fixtures.js';
	import { props } from '../stores.js';

	let items = [...defaultItems];

	onMount(() => {
		$props = { ...defaultProps };
	});

	function handleSort(event: CustomEvent) {
		const { prevIndex, nextIndex } = event.detail;
		items = sortItems(items, prevIndex, nextIndex);
	}
</script>

<svelte:head>
	<title>Unstyled | Svelte Sortable List</title>
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
