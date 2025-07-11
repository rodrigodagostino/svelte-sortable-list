<!--
@component
## <SortableList.Item>
Serves as an individual item within `<SortableList.Root>`. Holds the data and content for each list item, as well as the `<SortableList.ItemHandle>` and `<SortableList.ItemRemove>` components when needed.

### Props
- `id`: unique identifier for each item.
- `index`: position of the item in the list.
- `isLocked`: if `true`, will prevent the item from being dragged.
- `isDisabled`: if `true`, will prevent the item from being dragged and change its appearance to dimmed.
- `transitionIn`: animation played when the item is added to the list.
- `transitionOut`: animation played when the item is removed from the list.

### Usage
```svelte
	<SortableList.Item id={item.id} {index}>
		<div class="ssl-item-content">
			{item.text}
		</div>
	</SortableList.Item>
```
-->

<script lang="ts">
	import { onMount, tick } from 'svelte';
	import {
		getDragState,
		getDraggedItem,
		getFocusedItem,
		getIsBetweenBounds,
		getIsRTL,
		getItemRects,
		getRoot,
		getRootProps,
		getTargetItem,
	} from '$lib/stores/index.js';
	import { scaleFly } from '$lib/transitions/index.js';
	import type { SortableListItemProps as ItemProps } from '$lib/types/index.js';
	import {
		calculateTranslate,
		calculateTranslateWithAlignment,
		dispatch,
		getId,
		getIndex,
		isInSameRow,
	} from '$lib/utils/index.js';

	type $$Props = ItemProps & { class?: string };

	let itemRef: HTMLLIElement;

	export let id: $$Props['id'];
	export let index: $$Props['index'];
	export let isLocked: $$Props['isLocked'] = false;
	export let isDisabled: $$Props['isDisabled'] = false;
	export let transitionIn: $$Props['transitionIn'] = undefined;
	export let transitionOut: $$Props['transitionOut'] = undefined;

	$: _transitionIn = transitionIn || scaleFly;
	$: _transitionOut = transitionOut || scaleFly;

	$: classes = ['ssl-item', ...($$restProps.class ? [$$restProps.class] : [])].join(' ');

	const rootProps = getRootProps();

	const root = getRoot();
	const itemRects = getItemRects();
	const draggedItem = getDraggedItem();
	const targetItem = getTargetItem();
	const focusedItem = getFocusedItem();

	const dragState = getDragState();
	const isBetweenBounds = getIsBetweenBounds();
	const isRTL = getIsRTL();

	$: hasHandle = !!itemRef?.querySelector('[data-role="handle"]');
	$: isGhost = !!itemRef?.parentElement?.classList.contains('ssl-ghost');
	$: {
		setInteractiveElementsTabIndex($dragState === 'keyboard-dragging', focusedId);
	}

	onMount(() => {
		setInteractiveElementsTabIndex();
	});

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
						$dragState !== 'keyboard-dragging' &&
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

	function getStyleWidth(...args: unknown[]) {
		if (!isGhost && !$rootProps.canRemoveOnDropOut) return undefined;
		if (
			!isGhost &&
			draggedId === String(id) &&
			!$isBetweenBounds &&
			$rootProps.canRemoveOnDropOut &&
			$rootProps.direction === 'horizontal'
		)
			return '0';
		return `${currentRect?.width}px`;
	}

	function getStyleHeight(...args: unknown[]) {
		if (!$rootProps.canRemoveOnDropOut) return undefined;
		if (
			!isGhost &&
			draggedId === String(id) &&
			!$isBetweenBounds &&
			$rootProps.canRemoveOnDropOut &&
			$rootProps.direction === 'vertical'
		)
			return '0';
		return `${currentRect?.height}px`;
	}

	function getStyleMargin(...args: unknown[]) {
		if (isGhost) return undefined;
		if (draggedId === String(id) && !$isBetweenBounds && $rootProps.canRemoveOnDropOut) {
			return $rootProps.direction === 'vertical'
				? '0 calc(var(--ssl-gap) / 2)'
				: 'calc(var(--ssl-gap) / 2) 0';
		}
		return 'calc(var(--ssl-gap) / 2)';
	}

	function getStyleTransform(...args: unknown[]) {
		if (isGhost) return 'none';
		if (
			$dragState === 'idle' ||
			!$itemRects ||
			!$draggedItem ||
			!$targetItem ||
			currentRect === null ||
			draggedIndex === null ||
			draggedRect === null ||
			targetIndex === null ||
			targetRect === null
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
			: $dragState === 'pointer-dragging' && draggedId === String(id)
				? 'grabbing'
				: !hasHandle && !$rootProps.isLocked && !isLocked
					? 'grab'
					: 'initial';
	$: styleWidth = getStyleWidth($draggedItem, $isBetweenBounds);
	$: styleHeight = getStyleHeight($draggedItem, $isBetweenBounds);
	$: styleMargin = getStyleMargin($rootProps.direction, $draggedItem, $isBetweenBounds);
	$: styleOverflow =
		!isGhost &&
		($dragState === 'pointer-dragging' || $dragState === 'pointer-dropping') &&
		draggedId === String(id) &&
		$rootProps.canRemoveOnDropOut
			? 'hidden'
			: undefined;
	$: styleTransform = getStyleTransform($draggedItem, $targetItem, $dragState, $isBetweenBounds);
	$: styleTransition =
		!isGhost &&
		($draggedItem || $dragState === 'pointer-canceling' || $dragState === 'keyboard-canceling')
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

<li
	bind:this={itemRef}
	{id}
	class={classes}
	style:cursor={styleCursor}
	style:width={styleWidth}
	style:height={styleHeight}
	style:margin={styleMargin}
	style:overflow={styleOverflow}
	style:touch-action={!hasHandle ? 'none' : undefined}
	style:transform={styleTransform}
	style:transition={styleTransition}
	data-item-id={id}
	data-item-index={index}
	data-drag-state={draggedId === String(id) ? $dragState : 'idle'}
	data-is-ghost={isGhost}
	data-is-between-bounds={$isBetweenBounds}
	data-is-locked={$rootProps.isLocked || isLocked}
	data-is-disabled={$rootProps.isDisabled || isDisabled}
	tabindex={focusedId === String(id) ? 0 : -1}
	role="option"
	aria-disabled={$rootProps.isDisabled || isDisabled}
	aria-label={$$restProps['aria-label'] || undefined}
	aria-labelledby={$$restProps['aria-labelledby'] || undefined}
	aria-selected={focusedId === String(id)}
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

		&[data-drag-state='keyboard-dragging'] {
			z-index: 4;
		}

		&[data-drag-state='keyboard-dropping'] {
			/* The following z-index is different from the one in .is-keyboard-dragging just to ensure the
				 «transitionend» event is fired when the item is dropped using the keyboard. */
			z-index: 3;
		}

		&[data-drag-state='pointer-dragging'],
		&[data-drag-state='pointer-dropping'] {
			z-index: 0;
		}

		&[aria-disabled='true'] > :global(*) {
			pointer-events: none;
		}
	}
</style>
