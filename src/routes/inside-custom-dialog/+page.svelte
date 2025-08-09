<script lang="ts">
	import { onMount } from 'svelte';
	import { SortableList, removeItem, sortItems } from '$lib/index.js';
	import { defaultRootProps, getDefaultItems } from '../fixtures.js';
	import { rootProps } from '../stores.js';
	import '$lib/styles.css';

	let items = getDefaultItems(5);
	let isDialogOpen = false;

	onMount(() => {
		$rootProps = { ...defaultRootProps };
	});

	function handleDrop(e: SortableList.RootEvents['drop']) {
		const { draggedItemIndex, isBetweenBounds, canRemoveOnDropOut } = e.detail;
		if (!isBetweenBounds && canRemoveOnDropOut) items = removeItem(items, draggedItemIndex);
	}

	function handleDragEnd(e: SortableList.RootEvents['dragend']) {
		const { draggedItemIndex, targetItemIndex, isCanceled } = e.detail;
		if (!isCanceled && typeof targetItemIndex === 'number' && draggedItemIndex !== targetItemIndex)
			items = sortItems(items, draggedItemIndex, targetItemIndex);
	}

	function handleOpenDialog() {
		isDialogOpen = true;
	}

	function handleCloseDialog() {
		isDialogOpen = false;
	}
</script>

<svelte:head>
	<title>Inside custom dialog — Svelte Sortable List</title>
</svelte:head>

<button class="button" on:click={handleOpenDialog}>Open dialog</button>
<div
	class="dialog direction-{$rootProps.direction}"
	class:is-open={isDialogOpen}
	role="dialog"
	aria-modal="true"
>
	<div class="dialog__window">
		<button class="dialog__close button" on:click={handleCloseDialog}>
			<svg
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M18 6 6 18" />
				<path d="m6 6 12 12" />
			</svg>
			<span class="sr-only">Close dialog</span>
		</button>
		<SortableList.Root {...$rootProps} on:drop={handleDrop} on:dragend={handleDragEnd}>
			{#each items as item, index (item.id)}
				<SortableList.Item {...item} {index}>
					<div class="ssl-item-content">
						<span class="ssl-item-content__text">{item.text}</span>
					</div>
				</SortableList.Item>
			{/each}
		</SortableList.Root>
	</div>
	<button class="dialog__backdrop" on:click={handleCloseDialog}>Close dialog</button>
</div>

<style>
	:global(html:has(.dialog.is-open)) {
		overflow: hidden;
	}

	.dialog {
		position: fixed;
		inset: 0;
		visibility: hidden;
		opacity: 0;
		transition:
			opacity 240ms,
			visibility 0s 240ms;
		z-index: 9999;

		&.is-open {
			visibility: visible;
			opacity: 1;
			transition: opacity 240ms;
		}

		&.direction-vertical {
			& .dialog__window {
				flex-direction: column;
				align-items: center;
			}
		}

		&.direction-horizontal {
			& .dialog__window {
				width: max-content;
			}
		}
	}

	.dialog__window {
		display: flex;
		flex-direction: column;
		align-items: center;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 40rem;
		max-width: 90vw;
		max-width: 90dvw;
		max-height: 80vh;
		max-height: 80dvh;
		padding: 5rem 4rem;
		background-color: var(--ssl-gray-100);
		box-shadow: var(--ssl-box-shadow-4);
		overflow: auto;
		z-index: 1;
	}

	.dialog__close {
		position: absolute;
		top: 1rem;
		right: 1rem;
		font-size: 0.875rem;
	}

	.dialog__backdrop {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		border: none;
		background-color: rgba(0, 0, 0, 0.32);
		z-index: 0;
	}
</style>
