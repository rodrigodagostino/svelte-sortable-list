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
	import '$lib/styles.css';

	let items = $state([...defaultItems]);
	let isDialogOpen = $state(false);

	onMount(() => {
		$rootProps = { ...defaultProps };
	});

	function handleSort({ prevItemIndex, nextItemIndex }: SortEventDetail) {
		items = sortItems(items, prevItemIndex, nextItemIndex);
	}

	function handleRemove({ itemIndex }: RemoveEventDetail) {
		items = removeItem(items, itemIndex);
	}

	function handleOpenDialog() {
		isDialogOpen = true;
	}

	function handleCloseDialog() {
		isDialogOpen = false;
	}
</script>

<svelte:head>
	<title>Inside custom dialog | Svelte Sortable List</title>
</svelte:head>

<button class="button" onclick={handleOpenDialog}>Open dialog</button>
<div class="dialog" class:is-open={isDialogOpen} role="dialog" aria-modal="true">
	<div class="dialog__window">
		<button class="dialog__close button" onclick={handleCloseDialog}>Close dialog</button>
		<SortableList {...$rootProps} onSort={handleSort} onRemove={handleRemove}>
			{#each items as item, index (item.id)}
				<SortableItem {...item} {index}>
					<div class="ssl-item__content">
						{item.text}
					</div>
				</SortableItem>
			{/each}
		</SortableList>
	</div>
	<button class="dialog__backdrop" onclick={handleCloseDialog}>Close dialog</button>
</div>

<style lang="scss">
	:global(html:has(.dialog.is-open)) {
		overflow: hidden;
	}

	.dialog {
		position: fixed;
		inset: 0;
		visibility: hidden;
		opacity: 0;
		transition:
			opacity 320ms,
			visibility 0s 320ms;
		z-index: 9999;

		&.is-open {
			visibility: visible;
			opacity: 1;
			transition: opacity 320ms;
		}

		&__window {
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			width: 40rem;
			max-width: 90vw;
			max-width: 90dvw;
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
			border: none;
			background-color: rgba(0, 0, 0, 0.32);
			z-index: 0;
		}
	}
</style>
