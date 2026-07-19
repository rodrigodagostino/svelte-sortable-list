<!--
@component
## <SortableListGhost>
Serves as the dragged item placeholder during the drag-and-drop interactions triggered by a pointer device.

### Props
- `ref`: reference to the ghost element (HTMLDivElement). `[bindable]`
- `state`: state in which the ghost is in.

### Usage
```svelte
	<SortableListGhost bind:ref={ghostRef} state={ghostState} />
```
-->

<script lang="ts">
	import SortableListItem from './SortableListItem.svelte';
	import { portal } from '$lib/actions/index.js';
	import {
		getDraggedItem,
		getItemRectsSnapshot,
		getPointer,
		getPointerOrigin,
		getRootProps,
		getScrollOffset,
		getTargetItem,
	} from '$lib/stores/index.js';
	import type { SortableListGhostProps as GhostProps } from '$lib/types/index.js';
	import {
		calculateTranslate,
		calculateTranslateWithAlignment,
		getIndex,
		isInSameRow,
		keepWithinBounds,
		preserveFormFieldValues,
	} from '$lib/utils/index.js';

	type $$Props = GhostProps;

	export let ref: $$Props['ref'] = null;
	export let state: $$Props['state'];

	const rootProps = getRootProps();

	const pointer = getPointer();
	const pointerOrigin = getPointerOrigin();
	const itemRectsSnapshot = getItemRectsSnapshot();
	const draggedItem = getDraggedItem();
	const targetItem = getTargetItem();
	const scrollOffset = getScrollOffset();

	$: draggedId = $draggedItem ? $draggedItem.id : null;
	$: draggedIndex = $draggedItem ? getIndex($draggedItem) : null;
	// $itemRectsSnapshot is used as a reliable reference to the item’s position in the list
	// without the risk of catching in-between values while an item is translating.
	$: draggedRectSnapshot = (() => {
		if (!$itemRectsSnapshot || typeof draggedIndex !== 'number') return null;
		const rect = $itemRectsSnapshot[draggedIndex];
		return !$scrollOffset.left && !$scrollOffset.top
			? rect
			: new DOMRect(
					rect.x - $scrollOffset.left,
					rect.y - $scrollOffset.top,
					rect.width,
					rect.height
				);
	})();
	$: targetIndex = $targetItem ? getIndex($targetItem) : null;
	$: targetRectSnapshot = (() => {
		if (!$itemRectsSnapshot || typeof targetIndex !== 'number') return null;
		const rect = $itemRectsSnapshot[targetIndex];
		return !$scrollOffset.left && !$scrollOffset.top
			? rect
			: new DOMRect(
					rect.x - $scrollOffset.left,
					rect.y - $scrollOffset.top,
					rect.width,
					rect.height
				);
	})();

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function cloneDraggedItemContent(...args: unknown[]) {
		if (!ref || !$draggedItem) return;

		const clone = $draggedItem.cloneNode(true) as HTMLLIElement;
		preserveFormFieldValues($draggedItem, clone);
		// `childNodes` is used to always preserve the dragged item’s content,
		// even when only a text node is present inside.
		ref.children[0].replaceChildren(...clone.childNodes);
	}
	$: if (state === 'ptr-drag-start') cloneDraggedItemContent(state);

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function getStyleLeft(...args: unknown[]) {
		if (
			state === 'idle' ||
			typeof draggedIndex !== 'number' ||
			!ref ||
			!draggedRectSnapshot ||
			!$itemRectsSnapshot
		)
			return '0';

		if (state === 'ptr-remove') return ref.style.left;

		if (!$targetItem || typeof targetIndex !== 'number' || !targetRectSnapshot)
			return `${draggedRectSnapshot.x}px`;

		const left =
			$rootProps.direction === 'vertical'
				? draggedRectSnapshot.x
				: draggedIndex < targetIndex
					? targetRectSnapshot.right - draggedRectSnapshot.width
					: targetRectSnapshot.x;
		return `${left}px`;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function getStyleTop(...args: unknown[]) {
		if (
			state === 'idle' ||
			typeof draggedIndex !== 'number' ||
			!ref ||
			!draggedRectSnapshot ||
			!$itemRectsSnapshot
		)
			return '0';

		if (state === 'ptr-remove') return ref.style.top;

		if (!$targetItem || typeof targetIndex !== 'number' || !targetRectSnapshot)
			return `${draggedRectSnapshot.y}px`;

		const alignItems = $rootProps.ref && window.getComputedStyle($rootProps.ref).alignItems;
		const top =
			$rootProps.direction === 'vertical'
				? draggedIndex < targetIndex
					? targetRectSnapshot.bottom - draggedRectSnapshot.height
					: targetRectSnapshot.y
				: isInSameRow(draggedRectSnapshot, targetRectSnapshot)
					? draggedRectSnapshot.y
					: alignItems === 'center'
						? targetRectSnapshot.y + (targetRectSnapshot.height - draggedRectSnapshot.height) / 2
						: alignItems === 'end' || alignItems === 'flex-end'
							? targetRectSnapshot.bottom - draggedRectSnapshot.height
							: targetRectSnapshot.y;
		return `${top}px`;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function getStyleTransform(...args: unknown[]) {
		if (
			state === 'idle' ||
			state === 'ptr-drop' ||
			!ref ||
			!$rootProps.ref ||
			!$pointer ||
			!$pointerOrigin
		)
			return 'translate3d(0, 0, 0)';

		if ((state === 'ptr-drag-start' || state === 'ptr-drag') && draggedRectSnapshot) {
			if (!$rootProps.hasBoundaries) {
				const x =
					$rootProps.direction === 'horizontal' ||
					($rootProps.direction === 'vertical' && !$rootProps.hasLockedAxis)
						? $pointer.x - $pointerOrigin.x
						: 0;
				const y =
					$rootProps.direction === 'vertical' ||
					($rootProps.direction === 'horizontal' && !$rootProps.hasLockedAxis)
						? $pointer.y - $pointerOrigin.y
						: 0;
				return `translate3d(${x}px, ${y}px, 0)`;
			}

			const rootRect = $rootProps.ref.getBoundingClientRect();
			const x =
				$rootProps.direction === 'horizontal' ||
				($rootProps.direction === 'vertical' && !$rootProps.hasLockedAxis)
					? keepWithinBounds(
							'x',
							$pointer.x,
							$pointerOrigin.x,
							rootRect,
							draggedRectSnapshot,
							$rootProps.gap!
						)
					: 0;
			const y =
				$rootProps.direction === 'vertical' ||
				($rootProps.direction === 'horizontal' && !$rootProps.hasLockedAxis)
					? keepWithinBounds(
							'y',
							$pointer.y,
							$pointerOrigin.y,
							rootRect,
							draggedRectSnapshot,
							$rootProps.gap!
						)
					: 0;
			return `translate3d(${x}px, ${y}px, 0)`;
		}

		if (state === 'ptr-predrop' && typeof draggedIndex === 'number' && draggedRectSnapshot) {
			if (!$targetItem || typeof targetIndex !== 'number' || !targetRectSnapshot)
				return 'translate3d(0, 0, 0)';

			const ghostRect = ref.getBoundingClientRect();
			const x =
				$rootProps.direction === 'vertical'
					? ghostRect.x - targetRectSnapshot.x + (ghostRect.width - targetRectSnapshot.width) / 2
					: calculateTranslate('x', ghostRect, targetRectSnapshot, draggedIndex, targetIndex);
			const y =
				$rootProps.direction === 'vertical'
					? calculateTranslate('y', ghostRect, targetRectSnapshot, draggedIndex, targetIndex)
					: calculateTranslateWithAlignment($rootProps.ref, ghostRect, targetRectSnapshot);

			return `translate3d(${x}px, ${y}px, 0)`;
		}

		if (state === 'ptr-remove') return ref.style.transform;
	}

	$: styleLeft = getStyleLeft(state);
	$: styleTop = getStyleTop(state);
	$: styleTransform = getStyleTransform(state, $pointer);

	function handlePointerDown(e: PointerEvent) {
		// Prevent focusing the item inside when clicking on the ghost.
		e.preventDefault();
	}
</script>

<div
	bind:this={ref}
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
	on:pointerdown={handlePointerDown}
	use:portal
>
	<!-- The following if clause will prevent <SortableListItem> -->
	<!-- from transitioning out on page navigation. -->
	{#if $rootProps?.ref}
		<SortableListItem
			id={draggedId || 'ssl-ghost-item'}
			index={draggedIndex ?? -1}
			class={$draggedItem?.className.replace(/\s*s-[a-zA-Z0-9]{12}\s*/g, '')}
		/>
	{/if}
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
			transition: transform var(--ssl-transition-duration) var(--ssl-transition-easing);
		}

		&:not([data-ghost-state='idle']) {
			visibility: visible;
		}
	}
</style>
