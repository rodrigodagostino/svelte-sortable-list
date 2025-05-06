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
	<title>Auto scroll inside container | Svelte Sortable List</title>
</svelte:head>

<div class="wrapper direction-{$props.direction}">
	<SortableList {...$props} on:sort={handleSort} on:remove={handleRemove}>
		{#each items as item, index (item.id)}
			<SortableItem id={item.id} {index}>
				<div class="ssl-item__content">
					{item.text}
				</div>
			</SortableItem>
		{/each}
	</SortableList>
</div>

<style lang="scss">
	.wrapper {
		padding: 1.75rem 2rem;
		background-color: var(--gray-150);

		&.direction-vertical {
			height: 32rem;
			max-height: 80vh;
			max-height: 80dvh;
			border-top: 0.375rem solid var(--gray-300);
			border-bottom: 0.375rem solid var(--gray-300);
			overflow: hidden auto;
		}

		&.direction-horizontal {
			width: 32rem;
			max-width: 100%;
			border-left: 0.375rem solid var(--gray-300);
			border-right: 0.375rem solid var(--gray-300);
			overflow: auto hidden;
		}
	}
</style>
