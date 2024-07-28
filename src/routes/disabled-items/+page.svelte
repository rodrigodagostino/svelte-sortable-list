<script lang="ts">
	import { onMount } from 'svelte';
	import { SortableList, SortableItem, sortItems } from '$lib/index.js';
	import { disabledItems, defaultProps } from '../fixtures.js';
	import { props } from '../stores.js';
	import '$lib/styles.css';

	let items = [...disabledItems];

	onMount(() => {
		$props = { ...defaultProps };
	});

	function handleSort(event: CustomEvent) {
		const { prevIndex, nextIndex } = event.detail;
		items = sortItems(items, prevIndex, nextIndex);
	}
</script>

<svelte:head>
	<title>Disabled items | Svelte Sortable List</title>
</svelte:head>

<SortableList {...$props} on:sort={handleSort}>
	{#each items as item, index (item.id)}
		<SortableItem id={item.id} {index} isDisabled={item.isDisabled}>
			<div class="ssl-item__content">
				{item.text}
			</div>
		</SortableItem>
	{/each}
</SortableList>
