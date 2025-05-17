<script lang="ts">
	import { onMount } from 'svelte';
	import {
		SortableItem,
		SortableList,
		removeItem,
		sortItems,
		type RemoveEventDetail,
		type SortEventDetail,
	} from '$lib/index.js';
	import { defaultItems, defaultProps } from '../fixtures.js';
	import { rootProps } from '../stores.js';
	import '$lib/styles.css';

	let items = $state([...defaultItems]);

	onMount(() => {
		$rootProps = {
			...defaultProps,
			transitionDuration: 0,
		};
	});

	function handleSort({ prevItemIndex, nextItemIndex }: SortEventDetail) {
		items = sortItems(items, prevItemIndex, nextItemIndex);
	}

	function handleRemove({ itemIndex }: RemoveEventDetail) {
		items = removeItem(items, itemIndex);
	}
</script>

<svelte:head>
	<title>No animations | Svelte Sortable List</title>
</svelte:head>

<SortableList {...$rootProps} onSort={handleSort} onRemove={handleRemove}>
	{#each items as item, index (item.id)}
		<SortableItem {...item} {index}>
			<div class="ssl-item__content">
				{item.text}
			</div>
		</SortableItem>
	{/each}
</SortableList>
