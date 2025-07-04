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
		getItemRects,
		getRoot,
		getRootProps,
		getTargetItem,
	} from '$lib/stores/index.js';
	import { scaleFade } from '$lib/transitions/index.js';
	import type { SortableListItemProps as ItemProps } from '$lib/types/index.js';
	import {
		calculateTranslate,
		calculateTranslateWithAlignment,
		dispatch,
		getId,
		getIndex,
		isInSameRow,
	} from '$lib/utils/index.js';

	type $$Props = ItemProps;

	let itemRef: HTMLLIElement;

	export let id: $$Props['id'];
	export let index: $$Props['index'];
	export let isLocked: $$Props['isLocked'] = false;
	export let isDisabled: $$Props['isDisabled'] = false;
	export let transitionIn: $$Props['transitionIn'] = undefined;
	export let transitionOut: $$Props['transitionOut'] = undefined;

	$: _transitionIn = transitionIn || scaleFade;
	$: _transitionOut = transitionOut || scaleFade;

	const rootProps = getRootProps();

	const root = getRoot();
	const itemRects = getItemRects();
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
		setInteractiveElementsTabIndex($isKeyboardDragging, focusedId);
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
						focusedId === String(id) &&
						!$rootProps.isDisabled &&
						!isDisabled
							? 0
							: -1)
			);
	}

	$: currentRect = $itemRects ? $itemRects[index] : null;
	$: draggedId = $draggedItem ? getId($draggedItem) : null;
	$: draggedIndex = $draggedItem ? getIndex($draggedItem) : null;
	// $itemRects is used as a reliable reference to the item’s position in the list
	// without the risk of catching in-between values while an item is translating.
	$: draggedRect = $itemRects && typeof draggedIndex === 'number' ? $itemRects[draggedIndex] : null;
	$: targetIndex = $targetItem ? getIndex($targetItem) : null;
	$: targetRect = $itemRects && typeof targetIndex === 'number' ? $itemRects[targetIndex] : null;
	$: focusedId = $focusedItem ? getId($focusedItem) : null;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function getStyleWidth(...args: unknown[]) {
		if (!$rootProps.canRemoveOnDropOut) return undefined;
		if (draggedId === String(id) && !$isBetweenBounds && $rootProps.canRemoveOnDropOut) return '0';
		else if (draggedId === String(id) && $isBetweenBounds) return `${currentRect?.width}px`;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function getStyleHeight(...args: unknown[]) {
		if (!$rootProps.canRemoveOnDropOut) return undefined;
		if (draggedId === String(id) && !$isBetweenBounds && $rootProps.canRemoveOnDropOut) return '0';
		else if (draggedId === String(id) && $isBetweenBounds) return `${currentRect?.height}px`;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function getStyleMargin(...args: unknown[]) {
		if (draggedId === String(id) && !$isBetweenBounds && $rootProps.canRemoveOnDropOut) return '0';
		else return 'calc(var(--ssl-gap) / 2)';
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function getStyleTransform(...args: unknown[]) {
		if (
			(!$isPointerDragging &&
				!$isPointerDropping &&
				!$isKeyboardDragging &&
				!$isKeyboardDropping) ||
			!$itemRects ||
			!$draggedItem ||
			!$targetItem ||
			currentRect === null ||
			draggedIndex === null ||
			draggedRect === null ||
			targetIndex === null ||
			targetRect === null ||
			$isPointerCanceling ||
			$isKeyboardCanceling ||
			(!$isBetweenBounds && !$rootProps.canClearOnDragOut && $rootProps.canRemoveOnDropOut)
		)
			return 'translate3d(0, 0, 0)';

		if (draggedId !== String(id)) {
			if (
				(index > draggedIndex && index <= targetIndex) ||
				(index < draggedIndex && index >= targetIndex)
			) {
				const step = index > draggedIndex ? -1 : 1;
				const operator = index > draggedIndex === !$isRTL ? '-' : '';
				const x =
					$rootProps.direction === 'vertical'
						? '0'
						: isInSameRow(currentRect, $itemRects[index + step])
							? `${operator}${draggedRect.width + $rootProps.gap!}px`
							: `${$itemRects[index + step].right - currentRect.right}px`;
				const y =
					$rootProps.direction === 'vertical'
						? `${operator}${draggedRect.height + $rootProps.gap!}px`
						: isInSameRow(currentRect, $itemRects[index + step])
							? '0'
							: calculateTranslateWithAlignment($root!, $itemRects[index + step], currentRect);

				return `translate3d(${x}, ${y}, 0)`;
			} else {
				return 'translate3d(0, 0, 0)';
			}
		} else {
			const x =
				$rootProps.direction === 'vertical'
					? '0'
					: calculateTranslate('x', targetRect, draggedRect, draggedIndex, targetIndex);
			const y =
				$rootProps.direction === 'vertical'
					? calculateTranslate('y', targetRect, draggedRect, draggedIndex, targetIndex)
					: isInSameRow(draggedRect, targetRect)
						? '0'
						: calculateTranslateWithAlignment($root!, targetRect, draggedRect);

			return `translate3d(${x}, ${y}, 0)`;
		}
	}

	$: styleCursor =
		$rootProps.isDisabled || isDisabled
			? 'not-allowed'
			: $isPointerDragging && draggedId === String(id)
				? 'grabbing'
				: !hasHandle && !$rootProps.isLocked && !isLocked
					? 'grab'
					: 'initial';
	$: styleWidth = getStyleWidth($draggedItem, $isBetweenBounds);
	$: styleHeight = getStyleHeight($draggedItem, $isBetweenBounds);
	$: styleMargin = getStyleMargin($rootProps.direction, $draggedItem, $isBetweenBounds);
	$: styleOpacity =
		($isPointerDragging || $isPointerDropping) &&
		draggedId === String(id) &&
		!$rootProps.hasDropMarker
			? 0
			: 1;
	$: styleOverflow =
		($isPointerDragging || $isPointerDropping) &&
		draggedId === String(id) &&
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
			? `width ${$rootProps.transition!.duration}ms, height ${$rootProps.transition!.duration}ms,` +
				`margin ${$rootProps.transition!.duration}ms, transform ${$rootProps.transition!.duration}ms,` +
				`z-index ${$rootProps.transition!.duration}ms`
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
	data-is-pointer-dragging={$isPointerDragging && draggedId === String(id)}
	data-is-pointer-dropping={$isPointerDropping && draggedId === String(id)}
	data-is-keyboard-dragging={$isKeyboardDragging && draggedId === String(id)}
	data-is-keyboard-dropping={$isKeyboardDropping && draggedId === String(id)}
	data-is-between-bounds={$isBetweenBounds}
	data-is-locked={$rootProps.isLocked || isLocked}
	tabindex={focusedId === String(id) ? 0 : -1}
	role="option"
	aria-label={$$restProps['aria-label'] || undefined}
	aria-labelledby={$$restProps['aria-labelledby'] || undefined}
	aria-selected={focusedId === String(id)}
	aria-disabled={$rootProps.isDisabled || isDisabled}
	on:focus={handleFocus}
	on:focusout={handleFocusOut}
	in:_transitionIn
	out:_transitionOut
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
