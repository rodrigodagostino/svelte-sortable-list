<script lang="ts">
	import { createEventDispatcher, onMount, tick } from 'svelte';
	import {
		getDraggedItem,
		getFocusedItem,
		getIsBetweenBounds,
		getIsCanceling,
		getIsKeyboardDragging,
		getIsKeyboardDropping,
		getIsPointerDragging,
		getIsPointerDropping,
		getIsRemoving,
		getItemsOrigin,
		getListProps,
		getTargetItem,
	} from '$lib/stores/index.js';
	import { scaleFade } from '$lib/transitions/index.js';
	import type { SortableItemProps } from '$lib/types.js';
	import { getId, getIndex, screenReaderText } from '$lib/utils/index.js';

	let itemRef: HTMLLIElement;

	export let item: SortableItemProps['item'];
	export let index: SortableItemProps['index'];

	const listProps = getListProps();

	const itemsOrigin = getItemsOrigin();
	const draggedItem = getDraggedItem();
	const targetItem = getTargetItem();
	const focusedItem = getFocusedItem();

	const isPointerDragging = getIsPointerDragging();
	const isPointerDropping = getIsPointerDropping();
	const isKeyboardDragging = getIsKeyboardDragging();
	const isKeyboardDropping = getIsKeyboardDropping();
	const isCanceling = getIsCanceling();
	const isRemoving = getIsRemoving();
	const isBetweenBounds = getIsBetweenBounds();

	export let slots: {
		handle?: boolean;
		remove?: boolean;
	};

	const dispatch = createEventDispatcher();

	$: draggedItemId = ($draggedItem && getId($draggedItem)) ?? null;
	$: draggedItemIndex = ($draggedItem && getIndex($draggedItem)) ?? null;
	// itemsOrigin is used as a reliable reference to the item’s position in the list
	// without the risk of catching in-between values while the item is translating.
	$: draggedItemRect =
		typeof draggedItemIndex === 'number' && $itemsOrigin ? $itemsOrigin[draggedItemIndex] : null;
	$: targetItemIndex = ($targetItem && getIndex($targetItem)) ?? null;
	$: targetItemRect =
		typeof targetItemIndex === 'number' && $itemsOrigin ? $itemsOrigin[targetItemIndex] : null;
	$: focusedItemId = $focusedItem ? getId($focusedItem) : null;

	$: {
		if ($isKeyboardDragging) setInteractiveElementsTabIndex();
	}

	$: styleCursor =
		$isPointerDragging && draggedItemId === String(item.id)
			? 'grabbing'
			: !slots.handle
				? 'grab'
				: 'initial';
	$: styleWidth = getStyleWidth($draggedItem, $isBetweenBounds);
	$: styleHeight = getStyleHeight($draggedItem, $isBetweenBounds);
	$: styleMargin = getStyleMargin($listProps.direction, $draggedItem, $isBetweenBounds);
	$: styleOverflow = $isPointerDragging && $listProps.hasRemoveOnDragOut ? 'hidden' : undefined;
	$: styleTransform = getStyleTransform(
		$draggedItem,
		$targetItem,
		$isCanceling,
		$isRemoving,
		$isBetweenBounds
	);
	$: styleTransition =
		$isPointerDragging || $isPointerDropping || $isKeyboardDragging || $isKeyboardDropping
			? `width ${$listProps.transitionDuration}ms, height ${$listProps.transitionDuration}ms,` +
				`margin ${$listProps.transitionDuration}ms, transform ${$listProps.transitionDuration}ms,` +
				`z-index ${$listProps.transitionDuration}ms`
			: `z-index ${$listProps.transitionDuration}ms`;
	$: styleVisibility =
		($isPointerDragging || $isPointerDropping) &&
		draggedItemId === String(item.id) &&
		!$listProps.hasDropMarker
			? 'hidden'
			: 'visible';

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function getStyleWidth(...args: unknown[]) {
		if (!$listProps.hasRemoveOnDragOut) return undefined;

		if (draggedItemId === String(item.id) && !$isBetweenBounds && $listProps.hasRemoveOnDragOut)
			return '0';
		else if (draggedItemId === String(item.id) && $isBetweenBounds && $listProps.hasRemoveOnDragOut)
			return `${draggedItemRect?.width}px`;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function getStyleHeight(...args: unknown[]) {
		if (!$listProps.hasRemoveOnDragOut) return undefined;

		if (draggedItemId === String(item.id) && !$isBetweenBounds && $listProps.hasRemoveOnDragOut)
			return '0';
		else if (draggedItemId === String(item.id) && $isBetweenBounds && $listProps.hasRemoveOnDragOut)
			return `${draggedItemRect?.height}px`;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function getStyleMargin(...args: unknown[]) {
		if (draggedItemId === String(item.id) && !$isBetweenBounds && $listProps.hasRemoveOnDragOut)
			return '0';
		else
			return $listProps.direction === 'vertical'
				? 'calc(var(--gap) / 2) 0'
				: '0 calc(var(--gap) / 2)';
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function getStyleTransform(...args: unknown[]) {
		if (
			!$itemsOrigin ||
			!$draggedItem ||
			!$targetItem ||
			draggedItemIndex === null ||
			draggedItemRect === null ||
			targetItemIndex === null ||
			targetItemRect === null ||
			(!$isPointerDragging &&
				!$isPointerDropping &&
				!$isKeyboardDragging &&
				!$isKeyboardDropping) ||
			$isCanceling
		)
			return 'translate3d(0, 0, 0)';

		if (draggedItemId !== String(item.id)) {
			if (
				(index > draggedItemIndex && index <= targetItemIndex) ||
				(index < draggedItemIndex && index >= targetItemIndex)
			) {
				const operator = index > draggedItemIndex && index <= targetItemIndex ? '-' : '';
				const x =
					$listProps.direction === 'vertical'
						? '0'
						: `${operator}${draggedItemRect.width + $listProps.gap}px`;
				const y =
					$listProps.direction === 'vertical'
						? `${operator}${draggedItemRect.height + $listProps.gap}px`
						: '0';
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
				$listProps.direction === 'vertical'
					? '0'
					: `${targetItemRect.x + targetItemWidth - draggedItemRect.x - draggedItemWidth}px`;
			const y =
				$listProps.direction === 'vertical'
					? `${targetItemRect.y + targetItemHeight - draggedItemRect.y - draggedItemHeight}px`
					: '0';
			return `translate3d(${x}, ${y}, 0)`;
		}
	}

	async function setInteractiveElementsTabIndex() {
		await tick();
		itemRef
			?.querySelectorAll<HTMLElement>(
				'a, audio, button, input, optgroup, option, select, textarea, video, ' +
					'[role="button"], [role="checkbox"], [role="link"], [role="tab"]'
			)
			.forEach(
				(el) => (el.tabIndex = !$isKeyboardDragging && focusedItemId === String(item.id) ? 0 : -1)
			);
	}

	onMount(() => {
		setInteractiveElementsTabIndex();
	});

	async function handleFocus() {
		await tick();
		$focusedItem = itemRef;
		await tick();
		setInteractiveElementsTabIndex();
	}

	async function handleFocusOut(event: FocusEvent) {
		const relatedTarget = event.relatedTarget as HTMLElement | null;
		if (relatedTarget && !relatedTarget.closest('.ssl-item')) {
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
		const focusedItemId = $focusedItem && getId($focusedItem);
		if (focusedItemId === String(item.id) && !target.closest('.ssl-item')) {
			cleanUp();
			await tick();
			setInteractiveElementsTabIndex();
		}
	}

	function cleanUp() {
		$focusedItem = null;

		if ($isKeyboardDragging) {
			$isKeyboardDragging = false;
			$isKeyboardDropping = true;
			$isCanceling = true;

			function handleItemDrop({ propertyName }: TransitionEvent) {
				if (propertyName === 'transform') {
					$draggedItem = null;
					$targetItem = null;
					$itemsOrigin = null;
					$isKeyboardDropping = false;
					$isCanceling = false;

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
	class="ssl-item"
	class:is-pointer-dragging={$isPointerDragging && draggedItemId === String(item.id)}
	class:is-pointer-dropping={$isPointerDropping && draggedItemId === String(item.id)}
	class:is-keyboard-dragging={$isKeyboardDragging && draggedItemId === String(item.id)}
	class:is-keyboard-dropping={$isKeyboardDropping && draggedItemId === String(item.id)}
	class:is-removing={$isRemoving && draggedItemId === String(item.id)}
	style:--transition-duration="{$listProps.transitionDuration}ms"
	style:cursor={styleCursor}
	style:width={styleWidth}
	style:height={styleHeight}
	style:margin={styleMargin}
	style:overflow={styleOverflow}
	style:transform={styleTransform}
	style:transition={styleTransition}
	style:visibility={styleVisibility}
	id="ssl-item-{item.id}"
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
	in:scaleFade
	out:scaleFade={{ duration: $isRemoving ? 0 : 400 }}
>
	<div class="ssl-item__inner">
		{#if slots.handle}
			<div
				class="ssl-item__handle"
				style:cursor={$isPointerDragging ? 'grabbing' : 'grab'}
				aria-hidden="true"
			>
				<slot name="handle" />
			</div>
		{/if}
		<div class="ssl-item__content">
			<slot {item} {index} />
		</div>
		{#if slots.remove}
			<button class="ssl-item__remove" on:click={() => dispatch('remove')}>
				<slot name="remove" />
			</button>
		{/if}
	</div>
</li>

<style lang="scss">
	.ssl-item {
		position: relative;
		list-style: none;
		user-select: none;
		backface-visibility: hidden;
		z-index: 1;

		&.is-keyboard-dragging {
			z-index: 3;
		}

		&.is-keyboard-dropping {
			// The following z-index is different from the one in .is-keyboard-dragging for
			// the sole purpose of ensuring the «transitionend» event is fired when
			// the item is dropped using the keyboard.
			z-index: 2;
		}

		&.is-pointer-dragging,
		&.is-pointer-dropping {
			z-index: 0;
		}

		&[aria-disabled='true'] {
			pointer-events: none;
		}
	}
</style>
