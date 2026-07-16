<!--
@component
## <SortableList.Item>
Serves as an individual item within `<SortableList.Root>`. Holds the data and content for each list item, as well as the `<SortableList.ItemHandle>` and `<SortableList.ItemRemove>` components when needed.

### Props
- `ref`: reference to the item element (HTMLLIElement). `[bindable]`
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
		getItemRectsSnapshot,
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
		isOrResidesInInteractiveElement,
		joinCSSClasses,
	} from '$lib/utils/index.js';

	type $$Props = ItemProps & { class?: string };

	export let ref: $$Props['ref'] = null;
	export let id: $$Props['id'];
	export let index: $$Props['index'];
	export let isLocked: $$Props['isLocked'] = false;
	export let isDisabled: $$Props['isDisabled'] = false;
	export let transitionIn: $$Props['transitionIn'] = undefined;
	export let transitionOut: $$Props['transitionOut'] = undefined;

	function defaultTransition(node: HTMLElement) {
		return scaleFly(node, { axis: $rootProps.direction === 'vertical' ? 'y' : 'x' });
	}
	const _transitionIn = transitionIn || defaultTransition;
	const _transitionOut = transitionOut || defaultTransition;

	$: classes = joinCSSClasses('ssl-item', $$restProps.class);

	const rootProps = getRootProps();

	const itemRectsSnapshot = getItemRectsSnapshot();
	const draggedItem = getDraggedItem();
	const targetItem = getTargetItem();
	const focusedItem = getFocusedItem();

	const dragState = getDragState();
	const isBetweenBounds = getIsBetweenBounds();
	const isRTL = getIsRTL();

	$: isGhost = !!ref?.parentElement?.classList.contains('ssl-ghost');
	$: {
		setInteractiveElementsTabIndex($dragState === 'kbd-drag-start', focusedId);
	}

	onMount(() => {
		setInteractiveElementsTabIndex();
	});

	const selectors = [...INTERACTIVE_ELEMENTS, ...INTERACTIVE_ROLE_ATTRIBUTES].join(', ');
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async function setInteractiveElementsTabIndex(...args: unknown[]) {
		await tick();
		ref
			?.querySelectorAll<HTMLElement>(selectors)
			.forEach(
				(el) =>
					(el.tabIndex =
						$dragState !== 'kbd-drag-start' &&
						$dragState !== 'kbd-drag' &&
						focusedId === String(id) &&
						!$rootProps.isDisabled &&
						!isDisabled
							? 0
							: -1)
			);
	}

	$: rectSnapshot = $itemRectsSnapshot ? $itemRectsSnapshot[index] : null;
	$: draggedId = $draggedItem ? $draggedItem.id : null;
	$: draggedIndex = $draggedItem ? getIndex($draggedItem) : null;
	// $itemRectsSnapshot is used as a reliable reference to the item’s position in the list
	// without the risk of catching in-between values while an item is translating.
	$: draggedRectSnapshot =
		$itemRectsSnapshot && typeof draggedIndex === 'number'
			? $itemRectsSnapshot[draggedIndex]
			: null;
	$: targetIndex = $targetItem ? getIndex($targetItem) : null;
	$: targetRectSnapshot =
		$itemRectsSnapshot && typeof targetIndex === 'number' ? $itemRectsSnapshot[targetIndex] : null;
	$: focusedId = $focusedItem ? $focusedItem.id : null;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function getStyleWidth(...args: unknown[]) {
		if (draggedId !== String(id)) return undefined;
		if (
			!isGhost &&
			$rootProps.direction === 'horizontal' &&
			!$isBetweenBounds &&
			$rootProps.canRemoveOnDropOut
		)
			return '0';
		return `${rectSnapshot?.width}px`;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function getStyleHeight(...args: unknown[]) {
		if (draggedId !== String(id)) return undefined;
		if (
			!isGhost &&
			$rootProps.direction === 'vertical' &&
			!$isBetweenBounds &&
			$rootProps.canRemoveOnDropOut
		)
			return '0';
		return `${rectSnapshot?.height}px`;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function getStyleTransform(...args: unknown[]) {
		if (isGhost) return 'none';
		if (
			$dragState === 'idle' ||
			$dragState === 'ptr-cancel' ||
			$dragState === 'kbd-cancel' ||
			!$itemRectsSnapshot ||
			!$draggedItem ||
			!$targetItem ||
			rectSnapshot === null ||
			draggedIndex === null ||
			draggedRectSnapshot === null ||
			targetIndex === null ||
			targetRectSnapshot === null
		)
			return 'translate3d(0, 0, 0)';

		if (draggedId !== String(id)) {
			if (
				(index > draggedIndex && index <= targetIndex) ||
				(index < draggedIndex && index >= targetIndex)
			) {
				const step = index > draggedIndex ? -1 : 1;
				const direction = index > draggedIndex === !$isRTL ? -1 : 1;
				const neighborRectSnapshot = $itemRectsSnapshot[index + step];
				const isSameRow = isInSameRow(rectSnapshot, neighborRectSnapshot);

				const x =
					$rootProps.direction === 'vertical'
						? 0
						: isSameRow
							? direction * (draggedRectSnapshot.width + $rootProps.gap!)
							: neighborRectSnapshot.right - rectSnapshot.right;
				const y =
					$rootProps.direction === 'vertical'
						? direction * (draggedRectSnapshot.height + $rootProps.gap!)
						: isSameRow
							? 0
							: calculateTranslateWithAlignment(
									$rootProps.ref!,
									neighborRectSnapshot,
									rectSnapshot
								);

				return `translate3d(${x}px, ${y}px, 0)`;
			} else {
				return 'translate3d(0, 0, 0)';
			}
		} else {
			const x =
				$rootProps.direction === 'vertical'
					? 0
					: calculateTranslate(
							'x',
							targetRectSnapshot,
							draggedRectSnapshot,
							draggedIndex,
							targetIndex
						);
			const y =
				$rootProps.direction === 'vertical'
					? calculateTranslate(
							'y',
							targetRectSnapshot,
							draggedRectSnapshot,
							draggedIndex,
							targetIndex
						)
					: isInSameRow(draggedRectSnapshot, targetRectSnapshot)
						? 0
						: calculateTranslateWithAlignment(
								$rootProps.ref!,
								targetRectSnapshot,
								draggedRectSnapshot
							);

			return `translate3d(${x}px, ${y}px, 0)`;
		}
	}

	$: styleWidth = getStyleWidth($draggedItem, $isBetweenBounds);
	$: styleHeight = getStyleHeight($draggedItem, $isBetweenBounds);
	$: styleTransform = getStyleTransform($dragState, $targetItem);

	async function handleFocus(e: FocusEvent) {
		if ($dragState.includes('ptr')) {
			e.preventDefault();
			return;
		}

		await tick();
		$focusedItem = ref!;
	}

	// `focusout` is preferred over `blur` since it detects the loss of focus
	// on the current element and it’s descendants too.
	async function handleFocusOut(e: FocusEvent) {
		const relatedTarget = e.relatedTarget as HTMLElement | null;
		if (!relatedTarget || (relatedTarget && !relatedTarget.closest('.ssl-item'))) {
			if (!$focusedItem) return;
			dispatch(ref!, 'itemfocusout', { item: $focusedItem });
			await tick();
			$focusedItem = null;
		}
	}

	// Prevent context menu from opening on long-press in Chrome for Android.
	function handleTouchStart(e: TouchEvent) {
		if (e.target && ref && !isOrResidesInInteractiveElement(e.target as HTMLElement, ref))
			e.preventDefault();
	}
</script>

<li
	bind:this={ref}
	{id}
	class={classes}
	style:width={styleWidth}
	style:height={styleHeight}
	style:transform={styleTransform}
	data-item-id={id}
	data-item-index={index}
	data-drag-state={draggedId === String(id) ? $dragState : 'idle'}
	data-is-ghost={isGhost}
	data-is-between-bounds={!$isBetweenBounds && draggedId === String(id) ? false : true}
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
	on:touchstart|nonpassive={handleTouchStart}
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

		&:not(:has(.ssl-item-handle)),
		& .ssl-item-handle {
			touch-action: none;
			cursor: grab;
		}

		&[data-drag-state*='ptr-drag'],
		&[data-drag-state*='ptr-drag'] .ssl-item-handle {
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
				transform var(--ssl-transition-duration);
		}

		&[data-is-ghost='true'] {
			margin: 0;
			transition: none;
		}

		&[data-drag-state*='ptr'] {
			z-index: 0;
		}

		&[data-drag-state*='kbd'] {
			z-index: 2;
		}
	}
</style>
