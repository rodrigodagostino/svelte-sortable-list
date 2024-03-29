<script lang="ts">
	import { createEventDispatcher, onMount, tick } from 'svelte';
	import { scaleFly } from '$lib/transitions/index.js';
	import { getItemData, screenReaderText } from '$lib/utils/index.js';
	import type { ItemData, SortableItemProps } from '$lib/types.js';

	export let item: SortableItemProps['item'];
	export let index: SortableItemProps['index'];
	export let gap: SortableItemProps['gap'];
	export let direction: SortableItemProps['direction'];
	export let transitionDuration: SortableItemProps['transitionDuration'];
	export let hasDropMarker: SortableItemProps['hasDropMarker'];

	let itemRef: HTMLLIElement;
	export let itemsOrigin: ItemData[] | null;
	export let focusedItem: ItemData | null;
	export let draggedItem: ItemData | null;
	export let targetItem: ItemData | null;
	export let isDragging: boolean;
	export let isDropping: boolean;
	export let isSelecting: boolean;
	export let isDeselecting: boolean;
	export let isCanceling: boolean;

	export let hasHandle: boolean;
	export let hasRemove: boolean;

	const dispatch = createEventDispatcher();

	$: styleCursor =
		isDragging && draggedItem?.id === String(item.id)
			? 'grabbing'
			: !hasHandle
				? 'grab'
				: 'initial';
	$: styleTransform =
		(isDragging || isDropping || isSelecting || isDeselecting) &&
		draggedItem !== null &&
		targetItem !== null
			? draggedItem.id !== String(item.id)
				? !isCanceling && index > draggedItem.index && index <= targetItem.index
					? `translate3d(${direction === 'vertical' ? `0, -${draggedItem.height + gap}px` : `-${draggedItem.width + gap}px, 0`}, 0)`
					: !isCanceling && index < draggedItem.index && index >= targetItem.index
						? `translate3d(${direction === 'vertical' ? `0, ${draggedItem.height + gap}px` : `${draggedItem.width + gap}px, 0`}, 0)`
						: 'translate3d(0, 0, 0)'
				: !isCanceling && draggedItem.index < targetItem.index
					? `translate3d(${direction === 'vertical' ? `0, ${targetItem.y + targetItem.height - draggedItem.y - draggedItem.height}px` : `${targetItem.x + targetItem.width - draggedItem.x - draggedItem.width}px, 0`}, 0)`
					: !isCanceling && draggedItem.index > targetItem.index
						? `translate3d(${direction === 'vertical' ? `0, ${targetItem.y - draggedItem.y}px` : `${targetItem.x - draggedItem.x}px, 0`}, 0)`
						: 'translate3d(0, 0, 0)'
			: 'translate3d(0, 0, 0)';
	$: styleTransition =
		isDragging || isDropping || isSelecting || isDeselecting
			? `transform ${transitionDuration}ms`
			: '';
	$: styleVisibility =
		(isDragging || isDropping) && draggedItem?.id === String(item.id) && !hasDropMarker
			? 'hidden'
			: 'visible';

	async function setInteractiveElementsTabIndex() {
		await tick();
		itemRef
			.querySelectorAll<HTMLElement>(
				'a, audio, button, input, optgroup, option, select, textarea, video, ' +
					'[role="button"], [role="checkbox"], [role="link"], [role="tab"]'
			)
			.forEach((el) => (el.tabIndex = focusedItem?.id === String(item.id) ? 0 : -1));
	}

	onMount(() => setInteractiveElementsTabIndex());

	function cleanUp() {
		focusedItem = null;

		if (isSelecting) {
			isSelecting = false;
			isDeselecting = true;
			isCanceling = true;

			const timeoutId = setTimeout(() => {
				draggedItem = null;
				targetItem = null;
				itemsOrigin = null;
				isDeselecting = false;
				isCanceling = false;

				clearTimeout(timeoutId);
			}, transitionDuration);
		}
	}

	async function handleFocus() {
		await tick();
		focusedItem = getItemData(itemRef);
		await tick();
		setInteractiveElementsTabIndex();
	}

	async function handleFocusOut(event: FocusEvent) {
		const relatedTarget = event.relatedTarget as HTMLElement | null;
		if (relatedTarget && !relatedTarget.closest('.sortable-item')) cleanUp();
		await tick();
		setInteractiveElementsTabIndex();
	}

	function handlePointerDown(event: PointerEvent) {
		// Prevent item focus on pointer down.
		event.preventDefault();
	}

	async function handleDocumentPointerDown(event: PointerEvent) {
		const target = event.target as HTMLElement;
		if (focusedItem?.id === String(item.id) && !target.closest('.sortable-item')) {
			cleanUp();
			await tick();
			setInteractiveElementsTabIndex();
		}
	}
</script>

<svelte:document on:pointerdown={handleDocumentPointerDown} />

<li
	bind:this={itemRef}
	class="sortable-item"
	class:is-dragging={isDragging && draggedItem?.id === String(item.id)}
	class:is-dropping={isDropping && draggedItem?.id === String(item.id)}
	class:is-selecting={isSelecting && draggedItem?.id === String(item.id)}
	class:is-deselecting={isDeselecting && draggedItem?.id === String(item.id)}
	style:--transition-duration="{transitionDuration}ms"
	style:cursor={styleCursor}
	style:transform={styleTransform}
	style:transition={styleTransition}
	style:visibility={styleVisibility}
	id="sortable-item-{item.id}"
	data-id={item.id}
	data-index={index}
	role="option"
	tabindex={focusedItem?.id === String(item.id) ? 0 : -1}
	aria-roledescription={screenReaderText.item(index, item.isDisabled || false)}
	aria-selected={focusedItem?.id === String(item.id)}
	aria-disabled={item.isDisabled}
	on:focus={handleFocus}
	on:focusout={handleFocusOut}
	on:blur={setInteractiveElementsTabIndex}
	on:pointerdown={handlePointerDown}
	in:scaleFly={{ x: -120 }}
	out:scaleFly={{ x: 120 }}
>
	<div class="sortable-item__inner">
		{#if hasHandle}
			<div class="sortable-item__handle" style:cursor="grab" aria-hidden="true">
				<slot name="handle" />
			</div>
		{/if}
		<div class="sortable-item__content">
			<slot {item} {index} />
		</div>
		{#if hasRemove}
			<button class="sortable-item__remove" on:click={() => dispatch('remove')}>
				<slot name="remove" />
			</button>
		{/if}
	</div>
</li>

<style lang="scss">
	.sortable-item {
		position: relative;
		list-style: none;
		user-select: none;
		backface-visibility: hidden;
		z-index: 1;

		&__handle,
		&__content {
			display: flex;
			align-items: center;
		}

		&__handle {
			flex-shrink: 0;
		}

		&:focus-visible,
		&.is-selecting,
		&.is-deselecting {
			z-index: 2;
		}

		&.is-dragging,
		&.is-dropping {
			z-index: 0;
		}

		&[aria-disabled='true'] {
			pointer-events: none;
		}
	}
</style>
