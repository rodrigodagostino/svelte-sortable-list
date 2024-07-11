<script lang="ts">
	import { createEventDispatcher, onMount, tick } from 'svelte';
	import { scaleFly } from '$lib/transitions/index.js';
	import { getId, getIndex, screenReaderText } from '$lib/utils/index.js';
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
	export let draggedItem: HTMLLIElement | null;
	export let targetItem: HTMLLIElement | null;
	export let focusedItem: HTMLLIElement | null;

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

	$: draggedItemId = (draggedItem && getId(draggedItem)) ?? null;
	$: draggedItemIndex = (draggedItem && getIndex(draggedItem)) ?? null;
	// itemsOrigin is used as a reliable reference to the item’s position in the list
	// without the risk of catching in-between values while the item is translating.
	$: draggedItemRect =
		typeof draggedItemIndex === 'number' && itemsOrigin ? itemsOrigin[draggedItemIndex] : null;
	$: targetItemIndex = (targetItem && getIndex(targetItem)) ?? null;
	$: targetItemRect =
		typeof targetItemIndex === 'number' && itemsOrigin ? itemsOrigin[targetItemIndex] : null;
	$: focusedItemId = focusedItem ? getId(focusedItem) : null;

	$: {
		if (isSelecting) setInteractiveElementsTabIndex();
	}

	$: styleCursor =
		isDragging && draggedItemId === String(item.id)
			? 'grabbing'
			: !slots.handle
				? 'grab'
				: 'initial';
	$: styleWidth = getStyleWidth(draggedItem, isBetweenBounds);
	$: styleHeight = getStyleHeight(draggedItem, isBetweenBounds);
	$: styleMargin = getStyleMargin(draggedItem, isBetweenBounds);
	$: styleOverflow = isDragging && hasRemoveOnDragOut ? 'hidden' : undefined;
	$: styleTransform = getStyleTransform(
		draggedItem,
		targetItem,
		isCanceling,
		isRemoving,
		isBetweenBounds
	);
	$: styleTransition =
		isDragging || isDropping || isSelecting || isDeselecting
			? `width ${transitionDuration}ms, height ${transitionDuration}ms,` +
				`margin ${transitionDuration}ms, transform ${transitionDuration}ms,` +
				`z-index ${transitionDuration}ms`
			: `z-index ${transitionDuration}ms`;
	$: styleVisibility =
		(isDragging || isDropping) && draggedItemId === String(item.id) && !hasDropMarker
			? 'hidden'
			: 'visible';

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function getStyleWidth(...args: unknown[]) {
		if (!hasRemoveOnDragOut) return undefined;

		if (draggedItemId === String(item.id) && !isBetweenBounds && hasRemoveOnDragOut) return '0';
		else if (draggedItemId === String(item.id) && isBetweenBounds && hasRemoveOnDragOut)
			return `${draggedItemRect?.width}px`;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function getStyleHeight(...args: unknown[]) {
		if (!hasRemoveOnDragOut) return undefined;

		if (draggedItemId === String(item.id) && !isBetweenBounds && hasRemoveOnDragOut) return '0';
		else if (draggedItemId === String(item.id) && isBetweenBounds && hasRemoveOnDragOut)
			return `${draggedItemRect?.height}px`;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function getStyleMargin(...args: unknown[]) {
		if (draggedItemId === String(item.id) && !isBetweenBounds && hasRemoveOnDragOut) return '0';
		else return direction === 'vertical' ? 'calc(var(--gap) / 2) 0' : '0 calc(var(--gap) / 2)';
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function getStyleTransform(...args: unknown[]) {
		if (
			!itemsOrigin ||
			!draggedItem ||
			!targetItem ||
			draggedItemIndex === null ||
			draggedItemRect === null ||
			targetItemIndex === null ||
			targetItemRect === null ||
			(!isDragging && !isDropping && !isSelecting && !isDeselecting) ||
			isCanceling
		)
			return 'translate3d(0, 0, 0)';

		if (draggedItemId !== String(item.id)) {
			if (
				(index > draggedItemIndex && index <= targetItemIndex) ||
				(index < draggedItemIndex && index >= targetItemIndex)
			) {
				const operator = index > draggedItemIndex && index <= targetItemIndex ? '-' : '';
				const x = direction === 'vertical' ? '0' : `${operator}${draggedItemRect.width + gap}px`;
				const y = direction === 'vertical' ? `${operator}${draggedItemRect.height + gap}px` : '0';
				return `translate3d(${x}, ${y}, 0)`;
			} else {
				return 'translate3d(0, 0, 0)';
			}
		} else {
			const draggedItemWidth = draggedItemIndex < targetItemIndex ? draggedItemRect.width : 0;
			const draggedItemHeight = draggedItemIndex < targetItemIndex ? draggedItemRect.height : 0;
			const targetItemWidth = draggedItemIndex < targetItemIndex ? targetItemRect.width : 0;
			const targetItemHeight = draggedItemIndex < targetItemIndex ? targetItemRect.height : 0;
			const x =
				direction === 'vertical'
					? '0'
					: `${targetItemRect.x + targetItemWidth - draggedItemRect.x - draggedItemWidth}px`;
			const y =
				direction === 'vertical'
					? `${targetItemRect.y + targetItemHeight - draggedItemRect.y - draggedItemHeight}px`
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
			.forEach((el) => (el.tabIndex = !isSelecting && focusedItemId === String(item.id) ? 0 : -1));
	}

	onMount(() => {
		setInteractiveElementsTabIndex();
	});

	async function handleFocus() {
		await tick();
		focusedItem = itemRef;
		await tick();
		setInteractiveElementsTabIndex();
	}

	async function handleFocusOut(event: FocusEvent) {
		const relatedTarget = event.relatedTarget as HTMLElement | null;
		if (relatedTarget && !relatedTarget.closest('.sortable-item')) {
			cleanUp();
		}
		await tick();
		setInteractiveElementsTabIndex();
	}

	function handlePointerDown(event: PointerEvent) {
		// Prevent item focus on pointer down.
		event.preventDefault();
	}

	async function handleDocumentPointerDown(event: PointerEvent) {
		const target = event.target as HTMLElement;
		const focusedItemId = focusedItem && getId(focusedItem);
		if (focusedItemId === String(item.id) && !target.closest('.sortable-item')) {
			cleanUp();
			await tick();
			setInteractiveElementsTabIndex();
		}
	}

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
</script>

<svelte:document on:pointerdown={handleDocumentPointerDown} />

<li
	bind:this={itemRef}
	class="sortable-item"
	class:is-dragging={isDragging && draggedItemId === String(item.id)}
	class:is-dropping={isDropping && draggedItemId === String(item.id)}
	class:is-selecting={isSelecting && draggedItemId === String(item.id)}
	class:is-deselecting={isDeselecting && draggedItemId === String(item.id)}
	class:is-removing={isRemoving && draggedItemId === String(item.id)}
	style:--transition-duration="{transitionDuration}ms"
	style:cursor={styleCursor}
	style:width={styleWidth}
	style:height={styleHeight}
	style:margin={styleMargin}
	style:overflow={styleOverflow}
	style:transform={styleTransform}
	style:transition={styleTransition}
	style:visibility={styleVisibility}
	id="sortable-item-{item.id}"
	data-id={item.id}
	data-index={index}
	role="option"
	tabindex={focusedItemId === String(item.id) ? 0 : -1}
	aria-roledescription={screenReaderText.item(index, item.isDisabled || false)}
	aria-selected={focusedItemId === String(item.id)}
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

		&__inner {
			display: flex;
			align-items: center;
			gap: 0.75rem;
		}

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
