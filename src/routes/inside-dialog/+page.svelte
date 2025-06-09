<script lang="ts">
	import { onMount } from 'svelte';
	import { SortableList, removeItem, sortItems } from '$lib/index.js';
	import { defaultItems, defaultProps } from '../fixtures.js';
	import { props } from '../stores.js';
	import '$lib/styles.css';

	let dialogRef: HTMLDialogElement;

	let items = [...defaultItems];

	onMount(() => {
		$props = { ...defaultProps };
	});

	function handleDrop(event: SortableList.RootEvents['drop']) {
		const { draggedItemIndex, isBetweenBounds, canRemoveOnDropOut } = event.detail;
		if (!isBetweenBounds && canRemoveOnDropOut) items = removeItem(items, draggedItemIndex);
	}

	function handleDragEnd(event: SortableList.RootEvents['dragend']) {
		const { draggedItemIndex, targetItemIndex, isCanceled } = event.detail;
		if (!isCanceled && typeof targetItemIndex === 'number' && draggedItemIndex !== targetItemIndex)
			items = sortItems(items, draggedItemIndex, targetItemIndex);
	}

	function handleClickDialog(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (target?.nodeName === 'DIALOG') handleCloseDialog();
	}

	function handleOpenDialog() {
		dialogRef.showModal();
	}

	function handleCloseDialog() {
		dialogRef.close();
	}
</script>

<svelte:head>
	<title>Inside dialog | Svelte Sortable List</title>
</svelte:head>

<button class="button" on:click={handleOpenDialog}>Open dialog</button>
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<dialog
	bind:this={dialogRef}
	class="dialog direction-{$props.direction}"
	on:click={handleClickDialog}
>
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
	<div class="dialog__inner">
		<SortableList.Root {...$props} on:drop={handleDrop} on:dragend={handleDragEnd}>
			{#each items as item, index (item.id)}
				<SortableList.Item {...item} {index}>
					<div class="ssl-item-content">
						<span class="ssl-item-content__text">{item.text}</span>
					</div>
				</SortableList.Item>
			{/each}
		</SortableList.Root>
	</div>
</dialog>

<style>
	:global(html:has(dialog[open])) {
		overflow: hidden;
	}

	.dialog {
		width: 40rem;
		max-width: 90vw;
		max-width: 90dvw;
		max-height: 80vh;
		max-height: 80dvh;
		padding: 0;
		background-color: var(--gray-100);
		box-shadow: var(--box-shadow-4);
		border: none;
		color: inherit;
		overflow: hidden;
		z-index: 1;

		&:not([open]) {
			pointer-events: none;
			opacity: 0;
		}

		&[open] {
			pointer-events: auto;
			opacity: 1;
			animation: fade-in 240ms forwards;
		}

		&::backdrop {
			background-color: rgba(0, 0, 0, 0.32);
		}

		&.direction-vertical {
			& .dialog__inner {
				flex-direction: column;
				align-items: center;
			}
		}

		&.direction-horizontal {
			& .dialog__inner {
				width: max-content;
			}
		}
	}

	.dialog__inner {
		display: flex;
		max-width: 100%;
		max-height: 80vh;
		max-height: 80dvh;
		padding: 5rem 4rem;
		overflow: auto;
	}

	.dialog__close {
		position: absolute;
		top: 1rem;
		right: 1rem;
		font-size: 0.875rem;
	}

	@keyframes fade-in {
		0% {
			opacity: 0;
		}
		100% {
			opacity: 1;
		}
	}

	@keyframes fade-out {
		0% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}
</style>
