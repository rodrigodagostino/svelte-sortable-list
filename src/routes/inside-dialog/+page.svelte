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
	import { props } from '../stores.js';
	import '$lib/styles.css';

	let items = [...defaultItems];

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
	<title>Inside dialog | Svelte Sortable List</title>
</svelte:head>

<button class="button" on:click={() => document.querySelector('dialog')?.showModal()}>
	Open dialog
</button>
<dialog class="dialog">
	<button class="dialog__close button" on:click={() => document.querySelector('dialog')?.close()}>
		Close dialog
	</button>
	<SortableList {...$props} on:sort={handleSort} on:remove={handleRemove}>
		{#each items as item, index (item.id)}
			<SortableItem id={item.id} {index}>
				<div class="ssl-item__content">
					{item.text}
				</div>
			</SortableItem>
		{/each}
	</SortableList>
</dialog>

<style lang="scss">
	.dialog {
		min-width: 40rem;
		padding: 4rem;
		background-color: var(--gray-100);
		box-shadow: var(--box-shadow-4);
		border: none;
		color: inherit;
		z-index: 1;

		&__close {
			position: absolute;
			top: 1rem;
			right: 1rem;
			height: 2.25rem;
			font-size: 0.875rem;
		}
	}
</style>
