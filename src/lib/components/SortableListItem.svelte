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
		getRootProps,
		getTargetItem,
	} from '$lib/stores/index.js';
	import { scaleFade } from '$lib/transitions/index.js';
	import type { SortableListItemProps } from '$lib/types/index.js';
	import { dispatch, getId, getIndex, isInSameRow } from '$lib/utils/index.js';

	type $$Props = SortableListItemProps;

	let itemRef: HTMLLIElement;

	export let id: $$Props['id'];
	export let index: $$Props['index'];
	export let isLocked: $$Props['isLocked'] = false;
	export let isDisabled: $$Props['isDisabled'] = false;

	const rootProps = getRootProps();

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
						!$rootProps.isDisabled &&
						!isDisabled
							? 0
							: -1)
			);
	}

	$: currentItemRect = $itemsData ? $itemsData[index] : null;
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

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function getStyleWidth(...args: unknown[]) {
		if (!$rootProps.canRemoveOnDropOut) return undefined;
		if (draggedItemId === String(id) && !$isBetweenBounds && $rootProps.canRemoveOnDropOut)
			return '0';
		else if (draggedItemId === String(id) && $isBetweenBounds) return `${currentItemRect?.width}px`;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function getStyleHeight(...args: unknown[]) {
		if (!$rootProps.canRemoveOnDropOut) return undefined;
		if (draggedItemId === String(id) && !$isBetweenBounds && $rootProps.canRemoveOnDropOut)
			return '0';
		else if (draggedItemId === String(id) && $isBetweenBounds)
			return `${currentItemRect?.height}px`;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function getStyleMargin(...args: unknown[]) {
		if (draggedItemId === String(id) && !$isBetweenBounds && $rootProps.canRemoveOnDropOut)
			return '0';
		else return 'calc(var(--ssl-gap) / 2)';
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function getStyleTransform(...args: unknown[]) {
		if (
			!$itemsData ||
			!$draggedItem ||
			!$targetItem ||
			currentItemRect === null ||
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
			(!$isBetweenBounds && !$rootProps.canClearOnDragOut && $rootProps.canRemoveOnDropOut)
		)
			return 'translate3d(0, 0, 0)';

		const listElement = itemRef.closest<HTMLUListElement>('.ssl-list')!;
		const alignItems = window.getComputedStyle(listElement).alignItems;

		if (draggedItemId !== String(id)) {
			if (
				(index > draggedItemIndex && index <= targetItemIndex) ||
				(index < draggedItemIndex && index >= targetItemIndex)
			) {
				const step = index > draggedItemIndex ? -1 : 1;
				const operator = index > draggedItemIndex === !$isRTL ? '-' : '';
				const x =
					$rootProps.direction === 'vertical'
						? '0'
						: isInSameRow(currentItemRect, $itemsData[index + step])
							? `${operator}${draggedItemRect.width + $rootProps.gap!}px`
							: `${$itemsData[index + step].x + $itemsData[index + step].width - currentItemRect.x - currentItemRect.width}px`;
				const y =
					$rootProps.direction === 'vertical'
						? `${operator}${draggedItemRect.height + $rootProps.gap!}px`
						: isInSameRow(currentItemRect, $itemsData[index + step])
							? '0'
							: alignItems === 'center'
								? `${$itemsData[index + step].y - currentItemRect.y + ($itemsData[index + step].height - currentItemRect.height) / 2}px`
								: alignItems === 'end' || alignItems === 'flex-end'
									? `${$itemsData[index + step].y + $itemsData[index + step].height - currentItemRect.y - currentItemRect.height}px`
									: `${$itemsData[index + step].y - currentItemRect.y}px`;

				return `translate3d(${x}, ${y}, 0)`;
			} else {
				return 'translate3d(0, 0, 0)';
			}
		} else {
			const x =
				$rootProps.direction === 'vertical'
					? '0'
					: draggedItemIndex < targetItemIndex
						? `${targetItemRect.x + targetItemRect.width - draggedItemRect.x - draggedItemRect.width}px`
						: `${targetItemRect.x - draggedItemRect.x}px`;
			const y =
				$rootProps.direction === 'vertical'
					? draggedItemIndex < targetItemIndex
						? `${targetItemRect.y + targetItemRect.height - draggedItemRect.y - draggedItemRect.height}px`
						: `${targetItemRect.y - draggedItemRect.y}px`
					: isInSameRow(draggedItemRect, targetItemRect)
						? '0'
						: alignItems === 'center'
							? `${targetItemRect.y - draggedItemRect.y + (targetItemRect.height - draggedItemRect.height) / 2}px`
							: alignItems === 'end' || alignItems === 'flex-end'
								? `${targetItemRect.y + targetItemRect.height - draggedItemRect.y - draggedItemRect.height}px`
								: `${targetItemRect.y - draggedItemRect.y}px`;

			return `translate3d(${x}, ${y}, 0)`;
		}
	}

	$: styleCursor =
		$rootProps.isDisabled || isDisabled
			? 'not-allowed'
			: $isPointerDragging && draggedItemId === String(id)
				? 'grabbing'
				: !hasHandle && !$rootProps.isLocked && !isLocked
					? 'grab'
					: 'initial';
	$: styleWidth = getStyleWidth($draggedItem, $isBetweenBounds);
	$: styleHeight = getStyleHeight($draggedItem, $isBetweenBounds);
	$: styleMargin = getStyleMargin($rootProps.direction, $draggedItem, $isBetweenBounds);
	$: styleOpacity =
		draggedItemId === String(id) &&
		($isPointerDragging || $isPointerDropping) &&
		!$rootProps.hasDropMarker
			? 0
			: 1;
	$: styleOverflow =
		draggedItemId === String(id) &&
		($isPointerDragging || $isPointerDropping) &&
		$rootProps.canRemoveOnDropOut
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
			? `width ${$rootProps.transitionDuration}ms, height ${$rootProps.transitionDuration}ms,` +
				`margin ${$rootProps.transitionDuration}ms, transform ${$rootProps.transitionDuration}ms,` +
				`z-index ${$rootProps.transitionDuration}ms`
			: `none`;

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

<!--
@component
## SortableItem
Serves as an individual item within `<SortableList.Root>`. Holds the data and content for each list item, as well as the `<SortableList.ItemHandle>` and `<SortableList.ItemRemove>` components when needed.

### Props
- `id`: unique identifier for each item.
- `index`: position of the item in the list.
- `isLocked`: will prevent the item from being dragged.
- `isDisabled`: will prevent the item from being dragged and change its appearance to dimmed.

### Usage
```svelte
	<SortableList.Item id={item.id} {index}>
		<div class="ssl-item-content">
			{item.text}
		</div>
	</SortableList.Item>
```
-->

<li
	bind:this={itemRef}
	{id}
	class="ssl-item"
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
	data-is-locked={$rootProps.isLocked || isLocked}
	tabindex={focusedItemId === String(id) ? 0 : -1}
	role="option"
	aria-label={$$restProps['aria-label'] || undefined}
	aria-labelledby={$$restProps['aria-labelledby'] || undefined}
	aria-selected={focusedItemId === String(id)}
	aria-disabled={$rootProps.isDisabled || isDisabled}
	on:focus={handleFocus}
	on:focusout={handleFocusOut}
	in:scaleFade={{ duration: $rootProps.transitionDuration }}
	out:scaleFade={{
		duration:
			!$isBetweenBounds && $rootProps.canRemoveOnDropOut ? 0 : $rootProps.transitionDuration,
	}}
>
	<slot />
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

		&[aria-disabled='true'] > :global(*) {
			pointer-events: none;
		}
	}
</style>
