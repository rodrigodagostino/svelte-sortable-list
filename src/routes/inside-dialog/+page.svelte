<script lang="ts">
	import { onMount } from 'svelte';
	import { SortableList, removeItem, sortItems } from '$lib/index.js';
	import { defaultRootProps, getDefaultItems } from '../fixtures.js';
	import layoutState from '../states.svelte.js';
	import '$lib/styles.css';

	let dialogRef: HTMLDialogElement | undefined = $state();
	let dialogInnerRef: HTMLDivElement | undefined = $state();

	let items = $state(getDefaultItems(5));

	onMount(() => {
		layoutState.props = { ...defaultRootProps };
	});

	function handleDrop(e: SortableList.RootEvents['ondrop']) {
		const { draggedItemIndex, isBetweenBounds, canRemoveOnDropOut } = e;
		if (!isBetweenBounds && canRemoveOnDropOut) items = removeItem(items, draggedItemIndex);
	}

	function handleDragEnd(e: SortableList.RootEvents['ondragend']) {
		const { draggedItemIndex, targetItemIndex, isCanceled } = e;
		if (!isCanceled && typeof targetItemIndex === 'number' && draggedItemIndex !== targetItemIndex)
			items = sortItems(items, draggedItemIndex, targetItemIndex);
	}

	function handleClickDialog(e: MouseEvent) {
		const target = e.target as HTMLElement;
		const dialogInnerRect = dialogInnerRef?.getBoundingClientRect();
		if (
			target?.nodeName === 'DIALOG' &&
			dialogInnerRect &&
			(e.clientX < dialogInnerRect.left ||
				e.clientX > dialogInnerRect.right ||
				e.clientY < dialogInnerRect.top ||
				e.clientY > dialogInnerRect.bottom)
		)
			handleCloseDialog();
	}

	function handleOpenDialog() {
		dialogRef?.showModal();
	}

	function handleCloseDialog() {
		dialogRef?.close();
	}
</script>

<svelte:head>
	<title>Inside dialog — Svelte Sortable List</title>
</svelte:head>

<button class="button" onclick={handleOpenDialog}>Open dialog</button>
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog
	bind:this={dialogRef}
	class="dialog direction-{layoutState.props.direction}"
	onclick={handleClickDialog}
>
	<button class="dialog__close button" onclick={handleCloseDialog}>
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
	<div bind:this={dialogInnerRef} class="dialog__inner">
		<SortableList.Root {...layoutState.props} ondrop={handleDrop} ondragend={handleDragEnd}>
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
		margin: auto;
		background-color: var(--ssl-gray-100);
		box-shadow: var(--ssl-box-shadow-4);
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
