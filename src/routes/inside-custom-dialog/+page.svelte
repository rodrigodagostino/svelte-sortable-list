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
	let isDialogOpen = false;

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
	<title>Inside custom dialog | Svelte Sortable List</title>
</svelte:head>

<button class="button" on:click={() => (isDialogOpen = true)}>Open dialog</button>
<div class="dialog" role="dialog" aria-modal="true" class:is-open={isDialogOpen}>
	<div class="dialog__window">
		<button
			class="dialog__close button"
			aria-label="Close modal"
			on:click={() => (isDialogOpen = false)}
		>
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
	</div>
	<button class="dialog__backdrop" on:click={() => (isDialogOpen = false)}>Close dialog</button>
</div>

<style lang="scss">
	.dialog {
		position: fixed;
		inset: 0;
		visibility: hidden;
		opacity: 0;
		z-index: 9999;

		&.is-open {
			visibility: visible;
			opacity: 1;
		}

		&__window {
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			min-width: 40rem;
			padding: 4rem;
			background-color: var(--gray-100);
			box-shadow: var(--box-shadow-4);
			z-index: 1;
		}

		&__close {
			position: absolute;
			top: 1rem;
			right: 1rem;
			height: 2.25rem;
			font-size: 0.875rem;
		}

		&__backdrop {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background-color: rgba(0, 0, 0, 0.1);
			z-index: 0;
		}
	}
</style>
