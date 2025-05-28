<script lang="ts">
	import { onMount, tick } from 'svelte';
	import {
		getDraggedItem,
		getFocusedItem,
		getIsBetweenBounds,
		getIsKeyboardCanceling,
		getIsKeyboardDragging,
		getIsKeyboardDropping,
		getIsPointerCanceling,
		getIsPointerDragging,
		getIsPointerDropping,
		getIsRTL,
		getItemsData,
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

	const itemsData = getItemsData();
	const draggedItem = getDraggedItem();
	const targetItem = getTargetItem();
	const focusedItem = getFocusedItem();

	const isPointerDragging = getIsPointerDragging();
	const isPointerDropping = getIsPointerDropping();
	const isKeyboardDragging = getIsKeyboardDragging();
	const isKeyboardDropping = getIsKeyboardDropping();
	const isPointerCanceling = getIsPointerCanceling();
	const isKeyboardCanceling = getIsKeyboardCanceling();
	const isBetweenBounds = getIsBetweenBounds();
	const isRTL = getIsRTL();

	let rectOrigin: DOMRect | null = null;
	let hasHandle = false;
	$: {
		setInteractiveElementsTabIndex($isKeyboardDragging, focusedItemId);
	}

	onMount(() => {
		rectOrigin = itemRef?.getBoundingClientRect();
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

	$: draggedItemId = $draggedItem ? getId($draggedItem) : null;
	$: draggedItemIndex = $draggedItem ? getIndex($draggedItem) : null;
	// $itemsData is used as a reliable reference to the item’s position in the list
	// without the risk of catching in-between values while an item is translating.
	$: draggedItemRect =
		$itemsData && typeof draggedItemIndex === 'number' ? $itemsData[draggedItemIndex] : null;
	$: targetItemIndex = $targetItem ? getIndex($targetItem) : null;
	$: targetItemRect =
		$itemsData && typeof targetItemIndex === 'number' ? $itemsData[targetItemIndex] : null;
	$: focusedItemId = $focusedItem ? getId($focusedItem) : null;

	$: styleCursor =
		$listProps.isDisabled || isDisabled
			? 'not-allowed'
			: $isPointerDragging && draggedItemId === String(id)
				? 'grabbing'
				: !hasHandle && !$listProps.isLocked && !isLocked
					? 'grab'
					: 'initial';
	$: styleWidth = getStyleWidth($draggedItem, $isBetweenBounds);
	$: styleHeight = getStyleHeight($draggedItem, $isBetweenBounds);
	$: styleMargin = getStyleMargin($listProps.direction, $draggedItem, $isBetweenBounds);
	$: styleOpacity =
		draggedItemId === String(id) &&
		($isPointerDragging || $isPointerDropping) &&
		!$listProps.hasDropMarker
			? 0
			: 1;
	$: styleOverflow =
		draggedItemId === String(id) &&
		($isPointerDragging || $isPointerDropping) &&
		$listProps.canRemoveOnDropOut
			? 'hidden'
			: undefined;
	$: styleTransform = getStyleTransform(
		$draggedItem,
		$targetItem,
		$isPointerCanceling,
		$isKeyboardCanceling,
		$isBetweenBounds
	);
	$: styleTransition =
		$draggedItem || $isPointerCanceling || $isKeyboardCanceling
			? `width ${$listProps.transitionDuration}ms, height ${$listProps.transitionDuration}ms,` +
				`margin ${$listProps.transitionDuration}ms, transform ${$listProps.transitionDuration}ms,` +
				`z-index ${$listProps.transitionDuration}ms`
			: `none`;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function getStyleWidth(...args: unknown[]) {
		if (!$listProps.canRemoveOnDropOut) return undefined;
		if (draggedItemId === String(id) && !$isBetweenBounds && $listProps.canRemoveOnDropOut)
			return '0';
		else if (draggedItemId === String(id) && $isBetweenBounds) return `${rectOrigin?.width}px`;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function getStyleHeight(...args: unknown[]) {
		if (!$listProps.canRemoveOnDropOut) return undefined;
		if (draggedItemId === String(id) && !$isBetweenBounds && $listProps.canRemoveOnDropOut)
			return '0';
		else if (draggedItemId === String(id) && $isBetweenBounds) return `${rectOrigin?.height}px`;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function getStyleMargin(...args: unknown[]) {
		if (draggedItemId === String(id) && !$isBetweenBounds && $listProps.canRemoveOnDropOut)
			return '0';
		else
			return $listProps.direction === 'vertical'
				? 'calc(var(--gap) / 2) 0'
				: '0 calc(var(--gap) / 2)';
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function getStyleTransform(...args: unknown[]) {
		if (
			!$itemsData ||
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
			$isPointerCanceling ||
			$isKeyboardCanceling ||
			(!$isBetweenBounds && !$listProps.canClearOnDragOut && $listProps.canRemoveOnDropOut)
		)
			return 'translate3d(0, 0, 0)';

		if (draggedItemId !== String(id)) {
			if (
				(index > draggedItemIndex && index <= targetItemIndex) ||
				(index < draggedItemIndex && index >= targetItemIndex)
			) {
				const operator = !$isRTL
					? index > draggedItemIndex && index <= targetItemIndex
						? '-'
						: ''
					: index > draggedItemIndex && index <= targetItemIndex
						? ''
						: '-';
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
	{id}
	class="ssl-item"
	style:--transition-duration="{$listProps.transitionDuration}ms"
	style:cursor={styleCursor}
	style:width={styleWidth}
	style:height={styleHeight}
	style:margin={styleMargin}
	style:opacity={styleOpacity}
	style:overflow={styleOverflow}
	style:touch-action={!hasHandle ? 'none' : undefined}
	style:transform={styleTransform}
	style:transition={styleTransition}
	data-item-id={id}
	data-item-index={index}
	data-is-pointer-dragging={$isPointerDragging && draggedItemId === String(id)}
	data-is-pointer-dropping={$isPointerDropping && draggedItemId === String(id)}
	data-is-keyboard-dragging={$isKeyboardDragging && draggedItemId === String(id)}
	data-is-keyboard-dropping={$isKeyboardDropping && draggedItemId === String(id)}
	data-is-between-bounds={$isBetweenBounds}
	data-is-locked={$listProps.isLocked || isLocked}
	role="option"
	tabindex={focusedItemId === String(id) ? 0 : -1}
	aria-selected={focusedItemId === String(id)}
	aria-disabled={$listProps.isDisabled || isDisabled}
	aria-roledescription={screenReaderText.item(
		index,
		$listProps.isDisabled || isDisabled || $listProps.isLocked || isLocked
	)}
	on:focus={handleFocus}
	on:focusout={handleFocusOut}
	in:scaleFade={{ duration: $listProps.transitionDuration }}
	out:scaleFade={{
		duration:
			!$isBetweenBounds && $listProps.canRemoveOnDropOut ? 0 : $listProps.transitionDuration,
	}}
>
	<div class="ssl-item__inner">
		<slot />
	</div>
</li>

<style>
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

		&[data-is-keyboard-dragging='true'] {
			z-index: 4;
		}

		&[data-is-keyboard-dropping='true'] {
			/* The following z-index is different from the one in .is-keyboard-dragging just to ensure the
				 «transitionend» event is fired when the item is dropped using the keyboard. */
			z-index: 3;
		}

		&[data-is-pointer-dragging='true'],
		&[data-is-pointer-dropping='true'] {
			z-index: 0;
		}

		&[aria-disabled='true'] > * {
			pointer-events: none;
		}
	}
</style>
