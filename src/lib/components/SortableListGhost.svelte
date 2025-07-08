<script lang="ts">
	import SortableListItem from './SortableListItem.svelte';
	import { portal } from '$lib/actions/index.js';
	import {
		getDraggedItem,
		getDragState,
		getIsBetweenBounds,
		getItemRects,
		getPointer,
		getPointerOrigin,
		getRoot,
		getRootProps,
		getTargetItem,
	} from '$lib/stores/index.js';
	import type { SortableListGhostProps as GhostProps } from '$lib/types/index.js';
	import {
		calculateTranslate,
		calculateTranslateWithAlignment,
		getId,
		getIndex,
		isInSameRow,
		preserveFormFieldValues,
	} from '$lib/utils/index.js';

	type $$Props = GhostProps;

	export let ghostRef: $$Props['ghostRef'];
	export let status: $$Props['status'];

	const rootProps = getRootProps();

	const root = getRoot();
	const pointer = getPointer();
	const pointerOrigin = getPointerOrigin();
	const itemRects = getItemRects();
	const draggedItem = getDraggedItem();
	const targetItem = getTargetItem();

	const dragState = getDragState();
	const isBetweenBounds = getIsBetweenBounds();

	$: draggedId = $draggedItem ? getId($draggedItem) : null;
	$: draggedIndex = $draggedItem ? getIndex($draggedItem) : null;
	// $itemRects is used as a reliable reference to the item’s position in the list
	// without the risk of catching in-between values while an item is translating.
	$: draggedRect = $itemRects && typeof draggedIndex === 'number' ? $itemRects[draggedIndex] : null;
	$: targetIndex = $targetItem ? getIndex($targetItem) : null;
	$: targetRect = $itemRects && typeof targetIndex === 'number' ? $itemRects[targetIndex] : null;

	function cloneDraggedItemContent(...args: unknown[]) {
		if (!$draggedItem) return '';

		const clone = $draggedItem.cloneNode(true) as HTMLLIElement;
		preserveFormFieldValues($draggedItem, clone);
		return clone.innerHTML;
	}
	$: draggedContent = cloneDraggedItemContent($draggedItem);

	function getStyleWidth(...args: unknown[]) {
		if (!draggedRect) return '0';
		return `${draggedRect?.width || 0}px`;
	}

	function getStyleHeight(...args: unknown[]) {
		if (!draggedRect) return '0';
		return `${draggedRect?.height || 0}px`;
	}

	function getStyleLeft(...args: unknown[]) {
		if (status === 'unset' || typeof draggedIndex !== 'number' || !draggedRect || !$itemRects)
			return '0';

		if (status === 'remove') return ghostRef.style.left;

		if (!$targetItem || typeof targetIndex !== 'number' || !targetRect) return `${draggedRect.x}px`;

		const left =
			$rootProps.direction === 'vertical'
				? draggedRect.x
				: draggedIndex < targetIndex
					? targetRect.right - draggedRect.width
					: targetRect.x;
		return `${left}px`;
	}

	function getStyleTop(...args: unknown[]) {
		if (status === 'unset' || typeof draggedIndex !== 'number' || !draggedRect || !$itemRects)
			return '0';

		if (status === 'remove') return ghostRef.style.top;

		if (!$targetItem || typeof targetIndex !== 'number' || !targetRect) return `${draggedRect.y}px`;

		const alignItems = $root && window.getComputedStyle($root).alignItems;
		const top =
			$rootProps.direction === 'vertical'
				? draggedIndex < targetIndex
					? targetRect.bottom - draggedRect.height
					: targetRect.y
				: isInSameRow(draggedRect, targetRect)
					? draggedRect.y
					: alignItems === 'center'
						? targetRect.y + (targetRect.height - draggedRect.height) / 2
						: alignItems === 'end' || alignItems === 'flex-end'
							? targetRect.bottom - draggedRect.height
							: targetRect.y;
		return `${top}px`;
	}

	function getStyleTransform(...args: unknown[]) {
		if (status === 'unset' || !$root || !$pointer || !$pointerOrigin) return 'translate3d(0, 0, 0)';

		const ghostRect = ghostRef.getBoundingClientRect();
		const rootRect = $root.getBoundingClientRect();

		if (status === 'init' && draggedRect) {
			if (!$rootProps.hasBoundaries) {
				const x =
					$rootProps.direction === 'horizontal' ||
					($rootProps.direction === 'vertical' && !$rootProps.hasLockedAxis)
						? `${$pointer.x - $pointerOrigin.x}px`
						: 0;
				const y =
					$rootProps.direction === 'vertical' ||
					($rootProps.direction === 'horizontal' && !$rootProps.hasLockedAxis)
						? `${$pointer.y - $pointerOrigin.y}px`
						: 0;
				return `translate3d(${x}, ${y}, 0)`;
			}

			const x =
				$rootProps.direction === 'horizontal' ||
				($rootProps.direction === 'vertical' && !$rootProps.hasLockedAxis)
					? // If the ghost is dragged to the left of the list,
						// place it to the right of the left edge of the list.
						$pointer.x - ($pointerOrigin.x - draggedRect.x) < rootRect.x + $rootProps.gap! / 2
						? `${rootRect.x - draggedRect.x + $rootProps.gap! / 2}px`
						: // If the ghost is dragged to the right of the list,
							// place it to the left of the right edge of the list.
							$pointer.x + ghostRect.width - ($pointerOrigin.x - draggedRect.x) >
							  rootRect.right - $rootProps.gap! / 2
							? `${rootRect.right - draggedRect.x - ghostRect.width - $rootProps.gap! / 2}px`
							: `${$pointer.x - $pointerOrigin.x}px`
					: 0;
			const y =
				$rootProps.direction === 'vertical' ||
				($rootProps.direction === 'horizontal' && !$rootProps.hasLockedAxis)
					? // If the ghost is dragged above the top of the list,
						// place it right below the top edge of the list.
						$pointer.y - ($pointerOrigin.y - draggedRect.y) < rootRect.y + $rootProps.gap! / 2
						? `${rootRect.y - draggedRect.y + $rootProps.gap! / 2}px`
						: // If the ghost is dragged below the bottom of the list,
							// place it right above the bottom edge of the list.
							$pointer.y + ghostRect.height - ($pointerOrigin.y - draggedRect.y) >
							  rootRect.bottom - $rootProps.gap! / 2
							? `${rootRect.bottom - draggedRect.y - ghostRect.height - $rootProps.gap! / 2}px`
							: `${$pointer.y - $pointerOrigin.y}px`
					: 0;
			return `translate3d(${x}, ${y}, 0)`;
		}

		if (status === 'preset' && typeof draggedIndex === 'number' && draggedRect) {
			if (!$targetItem || typeof targetIndex !== 'number' || !targetRect)
				return 'translate3d(0, 0, 0)';

			const x =
				$rootProps.direction === 'vertical'
					? `${ghostRect.x - targetRect.x + (ghostRect.width - targetRect.width) / 2}px`
					: calculateTranslate('x', ghostRect, targetRect, draggedIndex, targetIndex);
			const y =
				$rootProps.direction === 'vertical'
					? calculateTranslate('y', ghostRect, targetRect, draggedIndex, targetIndex)
					: calculateTranslateWithAlignment($root, ghostRect, targetRect);

			return `translate3d(${x}, ${y}, 0)`;
		}

		if (status === 'set') return 'translate3d(0, 0, 0)';

		if (status === 'remove') return ghostRef.style.transform;
	}

	function getStyleTransition(...args: unknown[]) {
		if (status === 'unset' || status === 'init') return undefined;
		// The next first condition applies to `canClearOnDragOut`.
		if ((status === 'preset' && !$targetItem) || status === 'set')
			return (
				`transform ${$rootProps.transition!.duration}ms ${$rootProps.transition!.easing},` +
				`z-index 0s ${$rootProps.transition!.duration}ms`
			);
		if (status === 'remove') return `z-index 0s ${$rootProps.transition!.duration}ms`;
	}

	function getStyleVisibility(...args: unknown[]) {
		if (status === 'unset') return 'hidden';
		return 'visible';
	}

	function getStyleZIndex(...args: unknown[]) {
		if (status === 'unset') return undefined;
		if (status === 'init' || status === 'preset') return '10000';
		// zIndex is only set and then re-set to force the transitionend event to be fired
		// when the ghost is dragged and dropped without being moved.
		if (status === 'set' || status === 'remove') return '9999';
	}

	$: styleWidth = getStyleWidth($draggedItem);
	$: styleHeight = getStyleHeight($draggedItem);
	$: styleLeft = getStyleLeft(status);
	$: styleTop = getStyleTop(status);
	$: styleTransform = getStyleTransform(status, $pointer);
	$: styleTransition = getStyleTransition(status);
	$: styleVisibility = getStyleVisibility(status);
	$: styleZIndex = getStyleZIndex(status);
</script>

<div
	bind:this={ghostRef}
	class="ssl-ghost"
	style:--ssl-gap="{$rootProps.gap}px"
	style:--ssl-wrap={$rootProps.hasWrapping ? 'wrap' : 'nowrap'}
	style:--ssl-transition-duration="{$rootProps.transition?.duration}ms"
	style:cursor={$dragState === 'pointer-dragging' ? 'grabbing' : 'grab'}
	style:width={styleWidth}
	style:height={styleHeight}
	style:left={styleLeft}
	style:top={styleTop}
	style:transform={styleTransform}
	style:transition={styleTransition}
	style:visibility={styleVisibility}
	style:z-index={styleZIndex}
	data-drag-state={$dragState.includes('pointer') ? $dragState : 'idle'}
	data-is-between-bounds={$isBetweenBounds}
	data-can-remove-on-drop-out={$rootProps.canRemoveOnDropOut}
	aria-hidden="true"
	use:portal
>
	<SortableListItem
		id={draggedId || 'ghost-item'}
		index={draggedIndex ?? -1}
		class={$draggedItem?.className || 'ghost-item'}
	>
		{@html draggedContent}
	</SortableListItem>
</div>

<!--
@component
## Ghost
Serves as the dragged item placeholder during the drag-and-drop interactions triggered by a pointer device.

### Props
- `status`: state in which the ghost is.
- `rootRef`: reference to the parent list.

### Usage
```svelte
	<SortableListGhost bind:ghostRef status={ghostStatus} {rootRef} />
```
-->

<style>
	.ssl-ghost {
		position: fixed;
		list-style: none;
		user-select: none;
		backface-visibility: hidden;
		z-index: 9999;
	}
</style>
