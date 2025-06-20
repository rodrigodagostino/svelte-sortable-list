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

	$: draggedItemIndex = $draggedItem ? getIndex($draggedItem) : null;
	// $itemsData is used as a reliable reference to the item’s position in the list
	// without the risk of catching in-between values while an item is translating.
	$: draggedItemRect =
		$itemsData && typeof draggedItemIndex === 'number' ? $itemsData[draggedItemIndex] : null;
	$: targetItemIndex = $targetItem ? getIndex($targetItem) : null;
	$: targetItemRect =
		$itemsData && typeof targetItemIndex === 'number' ? $itemsData[targetItemIndex] : null;

	$: styleWidth = getStyleWidth($draggedItem);
	$: styleHeight = getStyleHeight($draggedItem);
	$: styleLeft = getStyleLeft(status);
	$: styleTop = getStyleTop(status);
	$: styleTransform = getStyleTransform(status, $pointer);
	$: styleTransition = getStyleTransition(status);
	$: styleZIndex = getStyleZIndex(status);

	function getStyleWidth(draggedItem: HTMLLIElement | null) {
		if (!draggedItem || !$itemsData) return '0';
		return `${draggedItemRect?.width || 0}px`;
	}

	function getStyleHeight(draggedItem: HTMLLIElement | null) {
		if (!draggedItem || !$itemsData) return '0';
		return `${draggedItemRect?.height || 0}px`;
	}

	function getStyleLeft(status: $$Props['status']) {
		if (
			status === 'unset' ||
			!$draggedItem ||
			typeof draggedItemIndex !== 'number' ||
			!draggedItemRect ||
			!$itemsData
		)
			return '0';

		if (status === 'remove') return ghostRef.style.left;

		if (!$targetItem || typeof targetItemIndex !== 'number' || !targetItemRect)
			return `${draggedItemRect.x}px`;

		const left =
			$rootProps.direction === 'vertical'
				? draggedItemRect.x
				: draggedItemIndex < targetItemIndex
					? targetItemRect.x + targetItemRect.width - draggedItemRect.width
					: targetItemRect.x;
		return `${left}px`;
	}

	function getStyleTop(status: $$Props['status']) {
		if (
			status === 'unset' ||
			!$draggedItem ||
			typeof draggedItemIndex !== 'number' ||
			!draggedItemRect ||
			!$itemsData
		)
			return '0';

		if (status === 'remove') return ghostRef.style.top;

		if (!$targetItem || typeof targetItemIndex !== 'number' || !targetItemRect)
			return `${draggedItemRect.y}px`;

		const top =
			$rootProps.direction === 'vertical'
				? draggedItemIndex < targetItemIndex
					? targetItemRect.y + targetItemRect.height - draggedItemRect.height
					: targetItemRect.y
				: isInSameRow(draggedItemRect, targetItemRect)
					? draggedItemRect.y
					: targetItemRect.y;
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

		if (status === 'init' && draggedItemRect) {
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

			const x =
				$rootProps.direction === 'horizontal' ||
				($rootProps.direction === 'vertical' && !$rootProps.hasLockedAxis)
					? // If the ghost is dragged to the left of the list,
						// place it to the right of the left edge of the list.
						$pointer.x - ($pointerOrigin.x - draggedItemRect.x) < rootRect.x + $rootProps.gap! / 2
						? rootRect.x - draggedItemRect.x + $rootProps.gap! / 2
						: // If the ghost is dragged to the right of the list,
							// place it to the left of the right edge of the list.
							$pointer.x + ghostRect.width - ($pointerOrigin.x - draggedItemRect.x) >
							  rootRect.right - $rootProps.gap! / 2
							? rootRect.right - draggedItemRect.x - ghostRect.width - $rootProps.gap! / 2
							: $pointer.x - $pointerOrigin.x
					: 0;
			const y =
				$rootProps.direction === 'vertical' ||
				($rootProps.direction === 'horizontal' && !$rootProps.hasLockedAxis)
					? // If the ghost is dragged above the top of the list,
						// place it right below the top edge of the list.
						$pointer.y - ($pointerOrigin.y - draggedItemRect.y) < rootRect.y + $rootProps.gap! / 2
						? rootRect.y - draggedItemRect.y + $rootProps.gap! / 2
						: // If the ghost is dragged below the bottom of the list,
							// place it right above the bottom edge of the list.
							$pointer.y + ghostRect.height - ($pointerOrigin.y - draggedItemRect.y) >
							  rootRect.bottom - $rootProps.gap! / 2
							? rootRect.bottom - draggedItemRect.y - ghostRect.height - $rootProps.gap! / 2
							: $pointer.y - $pointerOrigin.y
					: 0;
			return `translate3d(${x}px, ${y}px, 0)`;
		}

		if (status === 'preset' && typeof draggedItemIndex === 'number' && draggedItemRect) {
			if (!$targetItem || typeof targetItemIndex !== 'number' || !targetItemRect)
				return 'translate3d(0, 0, 0)';
			const x =
				$rootProps.direction === 'horizontal'
					? draggedItemIndex < targetItemIndex
						? ghostRect.x +
							ghostRect.width / 2 -
							(targetItemRect.x + targetItemRect.width - draggedItemRect.width / 2)
						: ghostRect.x + ghostRect.width / 2 - (targetItemRect.x + draggedItemRect.width / 2)
					: ghostRect.x + ghostRect.width / 2 - (targetItemRect.x + targetItemRect.width / 2);
			const y =
				$rootProps.direction === 'vertical'
					? draggedItemIndex < targetItemIndex
						? ghostRect.y +
							ghostRect.height / 2 -
							(targetItemRect.y + targetItemRect.height - draggedItemRect.height / 2)
						: ghostRect.y + ghostRect.height / 2 - (targetItemRect.y + draggedItemRect.height / 2)
					: ghostRect.y + ghostRect.height / 2 - (targetItemRect.y + targetItemRect.height / 2);

			return `translate3d(${x}px, ${y}px, 0)`;
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
