<script lang="ts">
	import { onMount, tick } from 'svelte';
	import {
		getDraggedItem,
		getFocusedItem,
		getIsGhostBetweenBounds,
		getIsCancelingKeyboardDragging,
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
	import type { SortableItemProps } from '$lib/types/index.js';
	import { dispatch, getId, getIndex, screenReaderText } from '$lib/utils/index.js';

	let itemRef: HTMLLIElement;

	export let id: SortableItemProps['id'];
	export let index: SortableItemProps['index'];
	export let isLocked: SortableItemProps['isLocked'] = false;
	export let isDisabled: SortableItemProps['isDisabled'] = false;

	const listProps = getListProps();

	const itemsOrigin = getItemsOrigin();
	const draggedItem = getDraggedItem();
	const targetItem = getTargetItem();
	const focusedItem = getFocusedItem();

	const isPointerDragging = getIsPointerDragging();
	const isPointerDropping = getIsPointerDropping();
	const isKeyboardDragging = getIsKeyboardDragging();
	const isKeyboardDropping = getIsKeyboardDropping();
	const isCancelingKeyboardDragging = getIsCancelingKeyboardDragging();
	const isGhostBetweenBounds = getIsGhostBetweenBounds();
	const isRemoving = getIsRemoving();

	let hasHandle = false;
	$: {
		setInteractiveElementsTabIndex($isKeyboardDragging, focusedItemId);
	}

	onMount(() => {
		hasHandle = !!itemRef?.querySelector('[data-role="handle"]');
		setInteractiveElementsTabIndex();
	});
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async function setInteractiveElementsTabIndex(...args: unknown[]) {
		await tick();
		itemRef
			?.querySelectorAll<HTMLElement>(
				'a, audio, button, input, optgroup, option, select, textarea, video, ' +
					'[role="button"], [role="checkbox"], [role="link"], [role="tab"]'
			)
			.forEach(
				(el) =>
					(el.tabIndex =
						!$isKeyboardDragging &&
						focusedItemId === String(id) &&
						!$listProps.isDisabled &&
						!isDisabled
							? 0
							: -1)
			);
	}

	$: draggedItemId = ($draggedItem && getId($draggedItem)) ?? null;
	$: draggedItemIndex = ($draggedItem && getIndex($draggedItem)) ?? null;
	// $itemsOrigin is used as a reliable reference to the item’s position in the list
	// without the risk of catching in-between values while the item is translating.
	$: draggedItemRect =
		typeof draggedItemIndex === 'number' && $itemsOrigin ? $itemsOrigin[draggedItemIndex] : null;
	$: targetItemIndex = ($targetItem && getIndex($targetItem)) ?? null;
	$: targetItemRect =
		typeof targetItemIndex === 'number' && $itemsOrigin ? $itemsOrigin[targetItemIndex] : null;
	$: focusedItemId = $focusedItem ? getId($focusedItem) : null;

	$: styleCursor =
		$listProps.isDisabled || isDisabled
			? 'not-allowed'
			: $isPointerDragging && draggedItemId === String(id)
				? 'grabbing'
				: !hasHandle && !$listProps.isLocked && !isLocked
					? 'grab'
					: 'initial';
	$: styleWidth = getStyleWidth($draggedItem, $isGhostBetweenBounds);
	$: styleHeight = getStyleHeight($draggedItem, $isGhostBetweenBounds);
	$: styleMargin = getStyleMargin($listProps.direction, $draggedItem, $isGhostBetweenBounds);
	$: styleOpacity =
		draggedItemId === String(id) &&
		($isPointerDragging || $isPointerDropping) &&
		!$listProps.hasDropMarker
			? 0
			: 1;
	$: styleOverflow =
		draggedItemId === String(id) &&
		($isPointerDragging || $isPointerDropping) &&
		$listProps.canRemoveItemOnDropOut
			? 'hidden'
			: undefined;
	$: styleTransform = getStyleTransform(
		$draggedItem,
		$targetItem,
		$isCancelingKeyboardDragging,
		$isGhostBetweenBounds
	);
	$: styleTransition = $draggedItem
		? `width ${$listProps.transitionDuration}ms, height ${$listProps.transitionDuration}ms,` +
			`margin ${$listProps.transitionDuration}ms, transform ${$listProps.transitionDuration}ms,` +
			`z-index ${$listProps.transitionDuration}ms`
		: `none`;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function getStyleWidth(...args: unknown[]) {
		if (!$listProps.canRemoveItemOnDropOut) return undefined;

		if (
			draggedItemId === String(id) &&
			((!$isGhostBetweenBounds && $listProps.canRemoveItemOnDropOut) || $isRemoving)
		)
			return '0';
		else if (
			draggedItemId === String(id) &&
			$isGhostBetweenBounds &&
			$listProps.canRemoveItemOnDropOut
		)
			return `${draggedItemRect?.width}px`;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function getStyleHeight(...args: unknown[]) {
		if (!$listProps.canRemoveItemOnDropOut) return undefined;

		if (
			draggedItemId === String(id) &&
			(($listProps.canRemoveItemOnDropOut && !$isGhostBetweenBounds) || $isRemoving)
		)
			return '0';
		else if (
			draggedItemId === String(id) &&
			$listProps.canRemoveItemOnDropOut &&
			$isGhostBetweenBounds
		)
			return `${draggedItemRect?.height}px`;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function getStyleMargin(...args: unknown[]) {
		if (
			draggedItemId === String(id) &&
			(($listProps.canRemoveItemOnDropOut && !$isGhostBetweenBounds) || $isRemoving)
		)
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
			$isCancelingKeyboardDragging ||
			(!$isGhostBetweenBounds &&
				!$listProps.canClearTargetOnDragOut &&
				$listProps.canRemoveItemOnDropOut) ||
			$isRemoving
		)
			return 'translate3d(0, 0, 0)';

		if (draggedItemId !== String(id)) {
			if (
				(index > draggedItemIndex && index <= targetItemIndex) ||
				(index < draggedItemIndex && index >= targetItemIndex)
			) {
				const operator = index > draggedItemIndex && index <= targetItemIndex ? '-' : '';
				const x =
					$listProps.direction === 'vertical'
						? '0'
						: `${operator}${draggedItemRect.width + $listProps.gap!}px`;
				const y =
					$listProps.direction === 'vertical'
						? `${operator}${draggedItemRect.height + $listProps.gap!}px`
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

	async function handleFocus() {
		await tick();
		$focusedItem = itemRef;
	}

	// `focusout` is preferred over `blur` since it detects the loss of focus
	// on the current element and it’s descendants too.
	async function handleFocusOut(event: FocusEvent) {
		const relatedTarget = event.relatedTarget as HTMLElement | null;
		if (!relatedTarget || (relatedTarget && !relatedTarget.closest('.ssl-item'))) {
			if (!$focusedItem) return;
			dispatch(itemRef, 'itemfocusout', { item: $focusedItem });
			await tick();
			$focusedItem = null;
		}
	}
</script>

<li
	bind:this={itemRef}
	class="ssl-item"
	class:is-pointer-dragging={$isPointerDragging && draggedItemId === String(id)}
	class:is-pointer-dropping={$isPointerDropping && draggedItemId === String(id)}
	class:is-keyboard-dragging={$isKeyboardDragging && draggedItemId === String(id)}
	class:is-keyboard-dropping={$isKeyboardDropping && draggedItemId === String(id)}
	class:is-locked={$listProps.isLocked || isLocked}
	class:is-disabled={$listProps.isDisabled || isDisabled}
	class:is-removing={$isRemoving && draggedItemId === String(id)}
	style:--transition-duration="{$listProps.transitionDuration}ms"
	style:cursor={styleCursor}
	style:width={styleWidth}
	style:height={styleHeight}
	style:margin={styleMargin}
	style:opacity={styleOpacity}
	style:overflow={styleOverflow}
	style:transform={styleTransform}
	style:transition={styleTransition}
	id="ssl-item-{id}"
	data-id={id}
	data-index={index}
	role="option"
	tabindex={focusedItemId === String(id) ? 0 : -1}
	aria-roledescription={screenReaderText.item(
		index,
		$listProps.isDisabled || isDisabled || $listProps.isLocked || isLocked
	)}
	aria-selected={focusedItemId === String(id)}
	aria-disabled={$listProps.isDisabled || isDisabled}
	on:focus={handleFocus}
	on:focusout={handleFocusOut}
	in:scaleFade={{ duration: $listProps.transitionDuration }}
	out:scaleFade={{ duration: $isRemoving ? 0 : $listProps.transitionDuration }}
>
	<div class="ssl-item__inner">
		<slot />
	</div>
</li>

<style lang="scss">
	.ssl-item {
		position: relative;
		list-style: none;
		user-select: none;
		backface-visibility: hidden;
		z-index: 1;

		&:focus,
		&:focus-visible,
		&:focus-within {
			z-index: 2;
		}

		&.is-keyboard-dragging {
			z-index: 4;
		}

		&.is-keyboard-dropping {
			// The following z-index is different from the one in .is-keyboard-dragging for
			// the sole purpose of ensuring the «transitionend» event is fired when
			// the item is dropped using the keyboard.
			z-index: 3;
		}

		&.is-pointer-dragging,
		&.is-pointer-dropping {
			z-index: 0;
		}

		&[aria-disabled='true'] > * {
			pointer-events: none;
		}
	}
</style>
