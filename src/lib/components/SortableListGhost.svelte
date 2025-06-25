<script lang="ts">
	import { portal } from '$lib/actions/index.js';
	import {
		getDraggedItem,
		getIsBetweenBounds,
		getIsPointerDragging,
		getIsPointerDropping,
		getItemsData,
		getPointer,
		getPointerOrigin,
		getRootProps,
		getTargetItem,
	} from '$lib/stores/index.js';
	import type { SortableListGhostProps } from '$lib/types/index.js';
	import { getIndex, isInSameRow } from '$lib/utils/index.js';

	type $$Props = SortableListGhostProps;

	export let ghostRef: $$Props['ghostRef'];
	export let status: $$Props['status'];
	export let rootRef: $$Props['rootRef'];

	const rootProps = getRootProps();

	const pointer = getPointer();
	const pointerOrigin = getPointerOrigin();
	const itemsData = getItemsData();
	const draggedItem = getDraggedItem();
	const targetItem = getTargetItem();

	const isPointerDragging = getIsPointerDragging();
	const isPointerDropping = getIsPointerDropping();
	const isBetweenBounds = getIsBetweenBounds();

	$: if ($draggedItem) {
		const clone = $draggedItem?.cloneNode(true) as HTMLElement;
		// Since `cloneNode()` doesn’t clone `<select>` values, we have to do it manually.
		const selects = $draggedItem?.querySelectorAll<HTMLSelectElement>('select');
		if (selects)
			clone
				.querySelectorAll<HTMLSelectElement>('select')
				.forEach((select, index) => (select.value = selects[index].value));

		ghostRef?.replaceChildren(...clone.childNodes);
	} else {
		ghostRef?.replaceChildren();
	}

	$: draggedIndex = $draggedItem ? getIndex($draggedItem) : null;
	// $itemsData is used as a reliable reference to the item’s position in the list
	// without the risk of catching in-between values while an item is translating.
	$: draggedRect = $itemsData && typeof draggedIndex === 'number' ? $itemsData[draggedIndex] : null;
	$: targetIndex = $targetItem ? getIndex($targetItem) : null;
	$: targetRect = $itemsData && typeof targetIndex === 'number' ? $itemsData[targetIndex] : null;

	function getStyleWidth(draggedItem: HTMLLIElement | null) {
		if (!draggedItem || !$itemsData) return '0';
		return `${draggedRect?.width || 0}px`;
	}

	function getStyleHeight(draggedItem: HTMLLIElement | null) {
		if (!draggedItem || !$itemsData) return '0';
		return `${draggedRect?.height || 0}px`;
	}

	function getStyleLeft(status: $$Props['status']) {
		if (
			status === 'unset' ||
			!$draggedItem ||
			typeof draggedIndex !== 'number' ||
			!draggedRect ||
			!$itemsData
		)
			return '0';

		if (status === 'remove') return ghostRef.style.left;

		if (!$targetItem || typeof targetIndex !== 'number' || !targetRect) return `${draggedRect.x}px`;

		const left =
			$rootProps.direction === 'vertical'
				? draggedRect.x
				: draggedIndex < targetIndex
					? targetRect.x + targetRect.width - draggedRect.width
					: targetRect.x;
		return `${left}px`;
	}

	function getStyleTop(status: $$Props['status']) {
		if (
			status === 'unset' ||
			!$draggedItem ||
			typeof draggedIndex !== 'number' ||
			!draggedRect ||
			!$itemsData
		)
			return '0';

		if (status === 'remove') return ghostRef.style.top;

		if (!$targetItem || typeof targetIndex !== 'number' || !targetRect) return `${draggedRect.y}px`;

		const alignItems = rootRef && window.getComputedStyle(rootRef).alignItems;
		const top =
			$rootProps.direction === 'vertical'
				? draggedIndex < targetIndex
					? targetRect.y + targetRect.height - draggedRect.height
					: targetRect.y
				: isInSameRow(draggedRect, targetRect)
					? draggedRect.y
					: alignItems === 'center'
						? targetRect.y + (targetRect.height - draggedRect.height) / 2
						: alignItems === 'end' || alignItems === 'flex-end'
							? targetRect.y + targetRect.height - draggedRect.height
							: targetRect.y;
		return `${top}px`;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function getStyleTransform(status: $$Props['status'], ...args: unknown[]) {
		if (
			status === 'unset' ||
			!rootRef ||
			!$itemsData ||
			!$pointer ||
			!$pointerOrigin ||
			!$draggedItem
		)
			return 'translate3d(0, 0, 0)';

		const ghostRect = ghostRef.getBoundingClientRect();
		const rootRect = rootRef.getBoundingClientRect();

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

			const alignItems = rootRef && window.getComputedStyle(rootRef).alignItems;
			const x =
				$rootProps.direction === 'vertical'
					? `${ghostRect.x - targetRect.x + (ghostRect.width - targetRect.width) / 2}px`
					: draggedIndex < targetIndex
						? `${ghostRect.x - targetRect.x + ghostRect.width - targetRect.width}px`
						: `${ghostRect.x - targetRect.x}px`;
			const y =
				$rootProps.direction === 'vertical'
					? draggedIndex < targetIndex
						? `${ghostRect.y - targetRect.y + ghostRect.height - targetRect.height}px`
						: `${ghostRect.y - targetRect.y}px`
					: alignItems === 'center'
						? `${ghostRect.y - targetRect.y + (ghostRect.height - targetRect.height) / 2}px`
						: alignItems === 'end' || alignItems === 'flex-end'
							? `${ghostRect.y - targetRect.y + ghostRect.height - targetRect.height}px`
							: `${ghostRect.y - targetRect.y}px`;

			return `translate3d(${x}, ${y}, 0)`;
		}

		if (status === 'set') return 'translate3d(0, 0, 0)';

		if (status === 'remove') return ghostRef.style.transform;
	}

	function getStyleTransition(status: $$Props['status']) {
		if (status === 'unset' || status === 'init') return undefined;
		// The next first condition applies to `canClearOnDragOut`.
		if ((status === 'preset' && !$targetItem) || status === 'set')
			return (
				`transform ${$rootProps.transitionDuration}ms cubic-bezier(0.2, 1, 0.1, 1),` +
				`z-index 0s ${$rootProps.transitionDuration}ms`
			);
		if (status === 'remove') return `z-index 0s ${$rootProps.transitionDuration}ms`;
	}

	function getStyleZIndex(status: $$Props['status']) {
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
	$: styleZIndex = getStyleZIndex(status);
</script>

<div
	bind:this={ghostRef}
	class="ssl-ghost"
	style:--ssl-transition-duration="{$rootProps.transitionDuration}ms"
	style:cursor={$isPointerDragging ? 'grabbing' : 'grab'}
	style:width={styleWidth}
	style:height={styleHeight}
	style:left={styleLeft}
	style:top={styleTop}
	style:transform={styleTransform}
	style:transition={styleTransition}
	style:visibility={$isPointerDragging || $isPointerDropping ? 'visible' : 'hidden'}
	style:z-index={styleZIndex}
	data-is-pointer-dragging={$isPointerDragging}
	data-is-pointer-dropping={$isPointerDropping}
	data-is-between-bounds={$isBetweenBounds}
	data-can-remove-on-drop-out={$rootProps.canRemoveOnDropOut}
	aria-hidden="true"
	use:portal
></div>

<!--
@component
## Ghost
Serves as the dragged item placeholder during the drag-and-drop interactions triggered by a pointer device.

### Props
- `status`: state in which the ghost is.
- `listRef`: reference to the parent list.

### Usage
```svelte
	<SortableListGhost bind:ghostRef status={ghostStatus} {listRef} />
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
