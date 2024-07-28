<script lang="ts">
	import { onMount } from 'svelte';
	import { SortableList, SortableItem, sortItems } from '$lib/index.js';
	import { defaultProps, varyingItems } from '../fixtures.js';
	import { props } from '../stores.js';
	import '$lib/styles.css';

	let items = [...varyingItems];

	onMount(() => {
		$props = { ...defaultProps };
	});

	function handleSort(event: CustomEvent) {
		const { prevIndex, nextIndex } = event.detail;
		items = sortItems(items, prevIndex, nextIndex);
	}
</script>

<svelte:head>
	<title>Varying heights | Svelte Sortable List</title>
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
