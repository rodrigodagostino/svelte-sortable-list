<script lang="ts">
	import { onMount } from 'svelte';
	import { SortableList, SortableItem, removeItem, sortItems } from '$lib/index.js';
	import { defaultProps, varyingItems } from '../fixtures.js';
	import { props } from '../stores.js';
	import '$lib/styles.css';

	let items = [...varyingItems];

	onMount(() => {
		$props = {
			...defaultProps,
			hasRemoveOnDragOut: true,
		};
	});

	function handleSort(event: CustomEvent) {
		const { prevIndex, nextIndex } = event.detail;
		items = sortItems(items, prevIndex, nextIndex);
	}

	function handleRemove(event: CustomEvent) {
		const { itemId } = event.detail;
		items = removeItem(items, itemId);
	}
</script>

<svelte:head>
	<title>Has remove on drag out | Svelte Sortable List</title>
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

<button class="button" on:click={() => (items = varyingItems)}>Reset</button>
