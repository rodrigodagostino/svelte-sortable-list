<!--
@component
## <SortableListGhost>
Serves as the dragged item placeholder during the drag-and-drop interactions triggered by a pointer device.

### Props
- `ghostRef`: reference to the Ghost used in its parent component.
- `state`: state in which the Ghost is in.

### Usage
```svelte
	<SortableListGhost bind:ghostRef state={ghostState} />
```
-->

<script lang="ts">
	import SortableListItem from './SortableListItem.svelte';
	import { portal } from '$lib/actions/index.js';
	import {
		getDraggedItem,
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
		getIndex,
		isInSameRow,
		preserveFormFieldValues,
	} from '$lib/utils/index.js';

	type $$Props = GhostProps;

	export let ghostRef: $$Props['ghostRef'];
	export let state: $$Props['state'];

	const rootProps = getRootProps();

	const root = getRoot();
	const pointer = getPointer();
	const pointerOrigin = getPointerOrigin();
	const itemRects = getItemRects();
	const draggedItem = getDraggedItem();
	const targetItem = getTargetItem();

	$: draggedId = $draggedItem ? $draggedItem.id : null;
	$: draggedIndex = $draggedItem ? getIndex($draggedItem) : null;
	// $itemRects is used as a reliable reference to the item’s position in the list
	// without the risk of catching in-between values while an item is translating.
	$: draggedRect = $itemRects && typeof draggedIndex === 'number' ? $itemRects[draggedIndex] : null;
	$: targetIndex = $targetItem ? getIndex($targetItem) : null;
	$: targetRect = $itemRects && typeof targetIndex === 'number' ? $itemRects[targetIndex] : null;

	function cloneDraggedItemContent(...args: unknown[]) {
		if (!$draggedItem) return;

		const clone = $draggedItem.cloneNode(true) as HTMLLIElement;
		preserveFormFieldValues($draggedItem, clone);
		ghostRef?.children[0].replaceChildren(...clone.children);
	}
	$: if (state === 'ptr-drag') cloneDraggedItemContent(state);

	function getStyleLeft(...args: unknown[]) {
		if (state === 'idle' || typeof draggedIndex !== 'number' || !draggedRect || !$itemRects)
			return '0';

		if (state === 'ptr-remove') return ghostRef.style.left;

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
		if (state === 'idle' || typeof draggedIndex !== 'number' || !draggedRect || !$itemRects)
			return '0';

		if (state === 'ptr-remove') return ghostRef.style.top;

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
		if (state === 'idle' || !$root || !$pointer || !$pointerOrigin) return 'translate3d(0, 0, 0)';

		const ghostRect = ghostRef.getBoundingClientRect();
		const rootRect = $root.getBoundingClientRect();

		if (state === 'ptr-drag' && draggedRect) {
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

		if (state === 'ptr-predrop' && typeof draggedIndex === 'number' && draggedRect) {
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

		if (state === 'ptr-drop') return 'translate3d(0, 0, 0)';

		if (state === 'ptr-remove') return ghostRef.style.transform;
	}

	$: styleLeft = getStyleLeft(state);
	$: styleTop = getStyleTop(state);
	$: styleTransform = getStyleTransform(state, $pointer);
</script>

<div
	bind:this={ghostRef}
	class="ssl-ghost"
	style:left={styleLeft}
	style:top={styleTop}
	style:transform={styleTransform}
	style:--ssl-gap="{$rootProps.gap}px"
	style:--ssl-wrap={$rootProps.hasWrapping ? 'wrap' : 'nowrap'}
	style:--ssl-transition-duration="{$rootProps.transition?.duration}ms"
	style:--ssl-transition-easing={$rootProps.transition?.easing}
	data-ghost-state={state}
	data-can-clear-on-drag-out={$rootProps.canClearOnDragOut}
	data-can-remove-on-drop-out={$rootProps.canRemoveOnDropOut}
	aria-hidden="true"
	use:portal
>
	<SortableListItem
		id={draggedId || 'ssl-ghost-item'}
		index={draggedIndex ?? -1}
		class={$draggedItem?.className.replace(/\s*s-[a-zA-Z0-9]{12}\s*/g, '')}
	/>
</div>

<style>
	.ssl-ghost {
		position: fixed;
		user-select: none;
		backface-visibility: hidden;
		visibility: hidden;
		z-index: 9999;

		&[data-ghost-state='ptr-predrop'][data-can-clear-on-drag-out='true']:not(
				:has([data-is-between-bounds='true'])
			),
		&[data-ghost-state='ptr-drop'] {
			transition:
				transform var(--ssl-transition-duration) var(--ssl-transition-easing),
				z-index 0s var(--ssl-transition-duration);
		}

		&[data-ghost-state='ptr-remove'] {
			transition: z-index 0s var(--ssl-transition-duration);
		}

		&:not([data-ghost-state='idle']) {
			visibility: visible;
		}

		&[data-ghost-state='ptr-drag'],
		&[data-ghost-state='ptr-predrop'] {
			z-index: 10000;
		}

		/* The z-index is different from the one in [data-ghost-state='ptr-drag'] and [data-ghost-state='ptr-predrop'] just to force
			 the «transitionend» event to be fired when the ghost is dragged and dropped without being moved. */
		&[data-ghost-state='ptr-drop'],
		&[data-ghost-state='ptr-remove'] {
			z-index: 9999;
		}
	}
</style>
