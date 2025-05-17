<script lang="ts">
	import { onMount } from 'svelte';
	import {
		SortableList,
		SortableItem,
		sortItems,
		removeItem,
		type RemoveEventDetail,
		type SortEventDetail,
	} from '$lib/index.js';
	import { disabledItems, defaultProps } from '../fixtures.js';
	import { rootProps } from '../stores.js';
	import '$lib/styles.css';

	let items = $state([...disabledItems]);

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
	<title>Disabled items | Svelte Sortable List</title>
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
