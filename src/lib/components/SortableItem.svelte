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
	export let hasRemoveOnDragOut: SortableItemProps['hasRemoveOnDragOut'];

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
	export let isRemoving: boolean;
	export let isBetweenBounds: boolean;

	export let slots: {
		handle?: boolean;
		remove?: boolean;
	};

	const dispatch = createEventDispatcher();

	$: styleCursor =
		isDragging && draggedItem?.id === String(item.id)
			? 'grabbing'
			: !slots.handle
				? 'grab'
				: 'initial';
	$: styleTransform = getStyleTransform(
		draggedItem,
		targetItem,
		isCanceling,
		isRemoving,
		isBetweenBounds
	);
	$: styleTransition =
		isDragging || (isDropping && !isRemoving) || isSelecting || isDeselecting
			? `transform ${transitionDuration}ms, z-index ${transitionDuration}ms`
			: `z-index ${transitionDuration}ms`;
	$: styleVisibility =
		(isDragging || isDropping) && draggedItem?.id === String(item.id) && !hasDropMarker
			? 'hidden'
			: 'visible';

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function getStyleTransform(...args: unknown[]) {
		if (
			(!isDragging && !isDropping && !isSelecting && !isDeselecting) ||
			isCanceling ||
			!draggedItem
		)
			return 'translate3d(0, 0, 0)';

		if (!isBetweenBounds && hasRemoveOnDragOut) {
			if (index > draggedItem.index) {
				const x = direction === 'vertical' ? '0' : `-${draggedItem.width + gap}px`;
				const y = direction === 'vertical' ? `-${draggedItem.height + gap}px` : '0';
				return `translate3d(${x}, ${y}, 0)`;
			} else {
				return 'translate3d(0, 0, 0)';
			}
		}

		if (!targetItem) return 'translate3d(0, 0, 0)';

		if (draggedItem.id !== String(item.id)) {
			if (
				(index > draggedItem.index && index <= targetItem.index) ||
				(index < draggedItem.index && index >= targetItem.index)
			) {
				const operator = index > draggedItem.index && index <= targetItem.index ? '-' : '';
				const x = direction === 'vertical' ? '0' : `${operator}${draggedItem.width + gap}px`;
				const y = direction === 'vertical' ? `${operator}${draggedItem.height + gap}px` : '0';
				return `translate3d(${x}, ${y}, 0)`;
			} else {
				return 'translate3d(0, 0, 0)';
			}
		} else {
			const draggedItemWidth = draggedItem.index < targetItem.index ? draggedItem.width : 0;
			const draggedItemHeight = draggedItem.index < targetItem.index ? draggedItem.height : 0;
			const targetItemWidth = draggedItem.index < targetItem.index ? targetItem.width : 0;
			const targetItemHeight = draggedItem.index < targetItem.index ? targetItem.height : 0;
			const x =
				direction === 'vertical'
					? '0'
					: `${targetItem.x + targetItemWidth - draggedItem.x - draggedItemWidth}px`;
			const y =
				direction === 'vertical'
					? `${targetItem.y + targetItemHeight - draggedItem.y - draggedItemHeight}px`
					: '0';
			return `translate3d(${x}, ${y}, 0)`;
		}
	}

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

			function handleItemDrop({ propertyName }: TransitionEvent) {
				if (propertyName === 'transform') {
					draggedItem = null;
					targetItem = null;
					itemsOrigin = null;
					isDeselecting = false;
					isCanceling = false;

					itemRef.removeEventListener('transitionend', handleItemDrop);
				}
			}

			itemRef.addEventListener('transitionend', handleItemDrop);
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
	out:scaleFly={{ x: 120, duration: isRemoving ? 0 : 400 }}
>
	<div class="sortable-item__inner">
		{#if slots.handle}
			<div class="sortable-item__handle" style:cursor="grab" aria-hidden="true">
				<slot name="handle" />
			</div>
		{/if}
		<div class="sortable-item__content">
			<slot {item} {index} />
		</div>
		{#if slots.remove}
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

		&.is-selecting {
			z-index: 3;
		}

		&.is-deselecting {
			// The following z-index is different from the one in .is-selecting for
			// the sole purpose of ensuring the «transitionend» event is fired when
			// the item is dropped using the keyboard.
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
