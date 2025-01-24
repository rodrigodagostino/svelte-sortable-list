<script lang="ts">
	import {
		getDraggedItem,
		getIsGhostBetweenBounds,
		getIsPointerDragging,
		getIsPointerDropping,
		getIsRemoving,
		getItemsOrigin,
		getListProps,
		getPointer,
		getPointerOrigin,
		getTargetItem,
	} from '$lib/stores/index.js';
	import type { GhostProps } from '$lib/types/index.js';
	import { getId, getIndex } from '$lib/utils/index.js';

	export let ghostRef: HTMLDivElement;
	let ghostInnerRef: HTMLDivElement;

	export let status: GhostProps['status'];
	export let listRef: GhostProps['listRef'];

	const listProps = getListProps();

	const pointer = getPointer();
	const pointerOrigin = getPointerOrigin();
	const itemsOrigin = getItemsOrigin();
	const draggedItem = getDraggedItem();
	const targetItem = getTargetItem();

	const isPointerDragging = getIsPointerDragging();
	const isPointerDropping = getIsPointerDropping();
	const isGhostBetweenBounds = getIsGhostBetweenBounds();
	const isRemoving = getIsRemoving();

	$: if ($draggedItem) {
		const clone = $draggedItem?.children[0].cloneNode(true);

		// Since `cloneNode()` doesn’t clone `<select>` values, we have to do it manually.
		const selects = $draggedItem?.children[0].querySelectorAll<HTMLSelectElement>('select');
		if (selects)
			(clone as HTMLElement)
				.querySelectorAll<HTMLSelectElement>('select')
				.forEach((select, index) => (select.value = selects[index].value));

		ghostInnerRef?.replaceChildren(...clone.childNodes);
	} else {
		ghostInnerRef?.replaceChildren();
	}

	$: styleWidth = getStyleWidth($draggedItem);
	$: styleHeight = getStyleHeight($draggedItem);
	$: styleLeft = getStyleLeft(status);
	$: styleTop = getStyleTop(status);
	$: styleTransform = getStyleTransform(status, $pointer);
	$: styleTransition = getStyleTransition(status);
	$: styleZIndex = getStyleZIndex(status);

	function getStyleWidth(draggedItem: HTMLElement | null) {
		if (!draggedItem || !$itemsOrigin) return '0';

		const draggedItemRect = $itemsOrigin[getIndex(draggedItem)!];
		return `${draggedItemRect.width}px`;
	}

	function getStyleHeight(draggedItem: HTMLElement | null) {
		if (!draggedItem || !$itemsOrigin) return '0';

		const draggedItemRect = $itemsOrigin[getIndex(draggedItem)!];
		return `${draggedItemRect.height}px`;
	}

	function getStyleLeft(status: GhostProps['status']) {
		if (status === 'unset' || !$draggedItem || !$itemsOrigin) return '0';

		const draggedItemRect = $itemsOrigin[getIndex($draggedItem)!];
		return `${draggedItemRect.x}px`;
	}

	function getStyleTop(status: GhostProps['status']) {
		if (status === 'unset' || !$draggedItem || !$itemsOrigin) return '0';

		const draggedItemRect = $itemsOrigin[getIndex($draggedItem)!];
		return `${draggedItemRect.y}px`;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function getStyleTransform(status: GhostProps['status'], ...args: unknown[]) {
		if (
			status === 'unset' ||
			!listRef ||
			!$itemsOrigin ||
			!$pointer ||
			!$pointerOrigin ||
			!$draggedItem
		)
			return 'translate3d(0, 0, 0)';

		const ghostRect = ghostRef.getBoundingClientRect();
		const listRect = listRef.getBoundingClientRect();
		const draggedItemOrigin = $itemsOrigin[getIndex($draggedItem)!];

		if (status === 'init') {
			if (!$listProps.hasBoundaries) {
				const x =
					$listProps.direction === 'horizontal' ||
					($listProps.direction === 'vertical' && !$listProps.hasLockedAxis)
						? $pointer.x - $pointerOrigin.x
						: 0;
				const y =
					$listProps.direction === 'vertical' ||
					($listProps.direction === 'horizontal' && !$listProps.hasLockedAxis)
						? $pointer.y - $pointerOrigin.y
						: 0;
				return `translate3d(${x}px, ${y}px, 0)`;
			}

			const x =
				$listProps.direction === 'horizontal' ||
				($listProps.direction === 'vertical' && !$listProps.hasLockedAxis)
					? // If the ghost is dragged to the left of the list,
						// place it to the right of the left edge of the list.
						$pointer.x - ($pointerOrigin.x - draggedItemOrigin.x) < listRect.x + $listProps.gap! / 2
						? listRect.x - draggedItemOrigin.x + $listProps.gap! / 2
						: // If the ghost is dragged to the right of the list,
							// place it to the left of the right edge of the list.
							$pointer.x + ghostRect.width - ($pointerOrigin.x - draggedItemOrigin.x) >
							  listRect.right - $listProps.gap! / 2
							? listRect.right - draggedItemOrigin.x - ghostRect.width - $listProps.gap! / 2
							: $pointer.x - $pointerOrigin.x
					: 0;
			const y =
				$listProps.direction === 'vertical' ||
				($listProps.direction === 'horizontal' && !$listProps.hasLockedAxis)
					? // If the ghost is dragged above the top of the list,
						// place it right below the top edge of the list.
						$pointer.y - ($pointerOrigin.y - draggedItemOrigin.y) < listRect.y + $listProps.gap! / 2
						? listRect.y - draggedItemOrigin.y + $listProps.gap! / 2
						: // If the ghost is dragged below the bottom of the list,
							// place it right above the bottom edge of the list.
							$pointer.y + ghostRect.height - ($pointerOrigin.y - draggedItemOrigin.y) >
							  listRect.bottom - $listProps.gap! / 2
							? listRect.bottom - draggedItemOrigin.y - ghostRect.height - $listProps.gap! / 2
							: $pointer.y - $pointerOrigin.y
					: 0;
			return `translate3d(${x}px, ${y}px, 0)`;
		}

		if (status === 'set') {
			if (!$targetItem) return 'translate3d(0, 0, 0)';
			const targetItemOrigin = $itemsOrigin[getIndex($targetItem)!];
			const x =
				$listProps.direction === 'horizontal'
					? draggedItemOrigin.x < targetItemOrigin.x
						? targetItemOrigin.x +
							targetItemOrigin.width -
							(draggedItemOrigin.x + draggedItemOrigin.width)
						: targetItemOrigin.x - draggedItemOrigin.x
					: 0;
			const y =
				$listProps.direction === 'vertical'
					? draggedItemOrigin.y < targetItemOrigin.y
						? targetItemOrigin.y +
							targetItemOrigin.height -
							(draggedItemOrigin.y + draggedItemOrigin.height)
						: targetItemOrigin.y - draggedItemOrigin.y
					: 0;
			return `translate3d(${x}px, ${y}px, 0)`;
		}

		if (status === 'remove') return ghostRef.style.transform;
	}

	function getStyleTransition(status: GhostProps['status']) {
		if (status === 'unset' || status === 'init') return undefined;
		if (status === 'set')
			return (
				`transform ${$listProps.transitionDuration}ms cubic-bezier(0.2, 1, 0.1, 1),` +
				`z-index 0s ${$listProps.transitionDuration}ms`
			);
		if (status === 'remove') return `z-index 0s ${$listProps.transitionDuration}ms`;
	}

	function getStyleZIndex(status: GhostProps['status']) {
		if (status === 'unset') return undefined;
		if (status === 'init') return '10000';
		// zIndex is only set and then re-set to force the transitionend event to be fired
		// when the ghost is dragged and dropped without being moved.
		if (status === 'set' || status === 'remove') return '9999';
	}
</script>

<div
	bind:this={ghostRef}
	class="ssl-ghost"
	class:is-dragging={$isPointerDragging}
	class:is-dropping={$isPointerDropping}
	class:is-between-bounds={$isGhostBetweenBounds}
	class:is-out-of-bounds={!$isGhostBetweenBounds}
	style:--transition-duration="{$listProps.transitionDuration}ms"
	style:cursor={$isPointerDragging ? 'grabbing' : !$isRemoving ? 'grab' : 'initial'}
	style:width={styleWidth}
	style:height={styleHeight}
	style:left={styleLeft}
	style:top={styleTop}
	style:transform={styleTransform}
	style:transition={styleTransition}
	style:visibility={$isPointerDragging || $isPointerDropping ? 'visible' : 'hidden'}
	style:z-index={styleZIndex}
	data-id={$draggedItem && getId($draggedItem)}
	aria-hidden="true"
>
	<div bind:this={ghostInnerRef} class="ssl-ghost__inner" />
</div>

<style lang="scss">
	.ssl-ghost {
		position: fixed;
		list-style: none;
		user-select: none;
		backface-visibility: hidden;
		z-index: 9999;
	}
</style>
