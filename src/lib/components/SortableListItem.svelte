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
		getIndex,
		INTERACTIVE_ELEMENTS,
		INTERACTIVE_ROLE_ATTRIBUTES,
		isInSameRow,
		joinCSSClasses,
	} from '$lib/utils/index.js';

	type $$Props = ItemProps & { class?: string };

	let itemRef: HTMLLIElement;

	export let id: $$Props['id'];
	export let index: $$Props['index'];
	export let isLocked: $$Props['isLocked'] = false;
	export let isDisabled: $$Props['isDisabled'] = false;
	export let transitionIn: $$Props['transitionIn'] = undefined;
	export let transitionOut: $$Props['transitionOut'] = undefined;

	$: _transitionIn =
		transitionIn ||
		((node: HTMLElement) =>
			scaleFly(node, { axis: $rootProps.direction === 'vertical' ? 'y' : 'x' }));
	$: _transitionOut =
		transitionOut ||
		((node: HTMLElement) =>
			scaleFly(node, { axis: $rootProps.direction === 'vertical' ? 'y' : 'x' }));

	$: classes = joinCSSClasses('ssl-item', $$restProps.class);

	const rootProps = getRootProps();

	const root = getRoot();
	const itemRects = getItemRects();
	const draggedItem = getDraggedItem();
	const targetItem = getTargetItem();
	const focusedItem = getFocusedItem();

	const dragState = getDragState();
	const isBetweenBounds = getIsBetweenBounds();
	const isRTL = getIsRTL();

	$: isGhost = !!itemRef?.parentElement?.classList.contains('ssl-ghost');
	$: {
		setInteractiveElementsTabIndex($dragState === 'kbd-drag', focusedId);
	}

	onMount(() => {
		setInteractiveElementsTabIndex();
	});

	const selectors = [...INTERACTIVE_ELEMENTS, ...INTERACTIVE_ROLE_ATTRIBUTES].join(', ');
	async function setInteractiveElementsTabIndex(...args: unknown[]) {
		await tick();
		itemRef
			?.querySelectorAll<HTMLElement>(selectors)
			.forEach(
				(el) =>
					(el.tabIndex =
						$dragState !== 'kbd-drag' &&
						focusedId === String(id) &&
						!$rootProps.isDisabled &&
						!isDisabled
							? 0
							: -1)
			);
	}

	$: currentRect = $itemRects ? $itemRects[index] : null;
	$: draggedId = $draggedItem ? $draggedItem.id : null;
	$: draggedIndex = $draggedItem ? getIndex($draggedItem) : null;
	// $itemRects is used as a reliable reference to the item’s position in the list
	// without the risk of catching in-between values while an item is translating.
	$: draggedRect = $itemRects && typeof draggedIndex === 'number' ? $itemRects[draggedIndex] : null;
	$: targetIndex = $targetItem ? getIndex($targetItem) : null;
	$: targetRect = $itemRects && typeof targetIndex === 'number' ? $itemRects[targetIndex] : null;
	$: focusedId = $focusedItem ? $focusedItem.id : null;

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

	function getStyleTransform(...args: unknown[]) {
		if (isGhost) return 'none';
		if (
			$dragState === 'idle' ||
			$dragState === 'ptr-cancel' ||
			$dragState === 'kbd-cancel' ||
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

	$: styleWidth = getStyleWidth($draggedItem, $isBetweenBounds);
	$: styleHeight = getStyleHeight($draggedItem, $isBetweenBounds);
	$: styleTransform = getStyleTransform($draggedItem, $targetItem, $dragState, $isBetweenBounds);

	async function handleFocus() {
		await tick();
		$focusedItem = itemRef;
	}

	// `focusout` is preferred over `blur` since it detects the loss of focus
	// on the current element and it’s descendants too.
	async function handleFocusOut(e: FocusEvent) {
		const relatedTarget = e.relatedTarget as HTMLElement | null;
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
	style:width={styleWidth}
	style:height={styleHeight}
	style:transform={styleTransform}
	data-item-id={id}
	data-item-index={index}
	data-drag-state={draggedId === String(id) ? $dragState : 'idle'}
	data-is-ghost={isGhost}
	data-is-between-bounds={$isBetweenBounds || (draggedId === String(id) && $isBetweenBounds)}
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
		margin: calc(var(--ssl-gap) / 2);
		position: relative;
		list-style: none;
		user-select: none;
		backface-visibility: hidden;
		z-index: 1;

		&:not(:has([data-role='handle'])),
		& [data-role='handle'] {
			touch-action: none;
			cursor: grab;
		}

		&[data-drag-state='ptr-drag'],
		&[data-drag-state='ptr-drag'] [data-role='handle'] {
			cursor: grabbing;
		}

		&[data-is-locked='true'] {
			cursor: initial;
		}

		&[aria-disabled='true'] {
			cursor: not-allowed;

			& > * {
				pointer-events: none;
			}
		}

		&:not([data-drag-state='idle']),
		&:has(~ *:not([data-drag-state='idle'])),
		&:not([data-drag-state='idle']) ~ * {
			transition:
				width var(--ssl-transition-duration),
				height var(--ssl-transition-duration),
				margin var(--ssl-transition-duration),
				transform var(--ssl-transition-duration),
				z-index var(--ssl-transition-duration);
		}

		&[data-is-ghost='true'] {
			margin: 0;
			transition: none;
		}

		&:focus,
		&:focus-visible,
		&:focus-within {
			z-index: 2;
		}

		&[data-drag-state='kbd-drag'] {
			z-index: 4;
		}

		/* The z-index is different from the one in [data-drag-state='kbd-drag'] just to force
			 the «transitionend» event to be fired when the item is dropped using the keyboard. */
		&[data-drag-state='kbd-drop'],
		&[data-drag-state='kbd-cancel'] {
			z-index: 3;
		}

		&[data-drag-state*='ptr'] {
			z-index: 0;
		}
	}
</style>
