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
	import { defaultItems, defaultProps } from '../fixtures.js';
	import { rootProps } from '../stores.js';

	let items = $state([...defaultItems]);

	onMount(() => {
		$rootProps = { ...defaultProps };
	});

	function handleSort({ prevItemIndex, nextItemIndex }: SortEventDetail) {
		items = sortItems(items, prevItemIndex, nextItemIndex);
	}

	function handleRemove({ itemIndex }: RemoveEventDetail) {
		items = removeItem(items, itemIndex);
	}
</script>

<svelte:head>
	<title>Unstyled | Svelte Sortable List</title>
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
