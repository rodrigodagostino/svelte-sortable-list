<script lang="ts">
	import {
		getDraggedItem,
		getIsBetweenBounds,
		getIsPointerDragging,
		getIsPointerDropping,
		getIsRemoving,
		getItemsOrigin,
		getListProps,
		getPointer,
		getPointerOrigin,
		getTargetItem,
	} from '$lib/stores/index.js';
	import type { GhostProps } from '$lib/types.js';
	import { getId, getIndex } from '$lib/utils/index.js';

	export let ghostRef: HTMLDivElement;

	export let status: GhostProps['status'];

	const listProps = getListProps();

	const pointer = getPointer();
	const pointerOrigin = getPointerOrigin();
	const itemsOrigin = getItemsOrigin();
	const draggedItem = getDraggedItem();
	const targetItem = getTargetItem();

	const isPointerDragging = getIsPointerDragging();
	const isPointerDropping = getIsPointerDropping();
	const isRemoving = getIsRemoving();
	const isBetweenBounds = getIsBetweenBounds();

	$: {
		setPositionStyles(status);
	}
	$: styleTransform = getStyleTransform($pointer);

	function setPositionStyles(status: 'init' | 'set' | 'remove' | 'unset') {
		if (status === 'init' || status === 'set' || status === 'remove') {
			if (!$draggedItem || !$itemsOrigin) return;

			const ghostRect = ghostRef.getBoundingClientRect();
			const draggedItemRect = $itemsOrigin[getIndex($draggedItem)!];
			const targetItemRect = $targetItem && $itemsOrigin[getIndex($targetItem)!];

			ghostRef.style.width = `${draggedItemRect.width}px`;
			ghostRef.style.height = `${draggedItemRect.height}px`;
			ghostRef.style.zIndex = '10000';

			if (status === 'init') {
				ghostRef.style.left = `${draggedItemRect.x}px`;
				ghostRef.style.top = `${draggedItemRect.y}px`;
			}

			if (status === 'set' || status === 'remove') {
				ghostRef.style.left = `${ghostRect.x}px`;
				ghostRef.style.top = `${ghostRect.y}px`;
				ghostRef.style.transform = 'translate3d(0, 0, 0)';
				// setTimeout will allow the values above to be properly set before setting the ones below.
				setTimeout(() => {
					if (!draggedItem) return;

					ghostRef.style.transition =
						status === 'set'
							? `left ${$listProps.transitionDuration}ms cubic-bezier(0.2, 1, 0.1, 1),` +
								`top ${$listProps.transitionDuration}ms cubic-bezier(0.2, 1, 0.1, 1),` +
								`transform ${$listProps.transitionDuration}ms cubic-bezier(0.2, 1, 0.1, 1),` +
								`z-index 0s ${$listProps.transitionDuration}ms`
							: `z-index 0s ${$listProps.transitionDuration}ms`;
					// zIndex is only set and then re-set to force the transitionend event
					// (along with the handleGhostDrop() function) to be fired when the ghost
					// is dragged and dropped without being moved.
					ghostRef.style.zIndex = '9999';

					const draggedItemIndex = getIndex($draggedItem)!;
					const targetItemIndex = ($targetItem && getIndex($targetItem)) ?? null;

					if (status === 'set') {
						if (!$targetItem) {
							ghostRef.style.left = `${draggedItemRect.x}px`;
							ghostRef.style.top = `${draggedItemRect.y}px`;
						} else {
							if (targetItemIndex === null || !targetItemRect) return;

							ghostRef.style.left =
								$listProps.direction === 'vertical'
									? `${draggedItemRect.x}px`
									: draggedItemIndex < targetItemIndex
										? `${targetItemRect.x + targetItemRect.width - draggedItemRect.width}px`
										: `${targetItemRect.x}px`;
							ghostRef.style.top =
								$listProps.direction === 'vertical'
									? draggedItemIndex < targetItemIndex
										? `${targetItemRect.y + targetItemRect.height - draggedItemRect.height}px`
										: `${targetItemRect.y}px`
									: `${draggedItemRect.y}px`;
						}
					}
				}, 0);
			}
		} else {
			ghostRef?.style.removeProperty('transition');
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function getStyleTransform(...args: unknown[]) {
		if (!$isPointerDragging || !$draggedItem || !$itemsOrigin) return 'translate3d(0, 0, 0)';

		const listRect = ghostRef.previousElementSibling!.getBoundingClientRect()!;
		const ghostRect = ghostRef.getBoundingClientRect()!;
		const draggedItemData = $itemsOrigin[getIndex($draggedItem)!];

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
					$pointer.x - ($pointerOrigin.x - draggedItemData.x) < listRect.x + $listProps.gap / 2
					? listRect.x - draggedItemData.x + $listProps.gap / 2
					: // If the ghost is dragged to the right of the list,
						// place it to the left of the right edge of the list.
						$pointer.x + ghostRect.width - ($pointerOrigin.x - draggedItemData.x) >
						  listRect.right - $listProps.gap / 2
						? listRect.right - draggedItemData.x - ghostRect.width - $listProps.gap / 2
						: $pointer.x - $pointerOrigin.x
				: 0;
		const y =
			$listProps.direction === 'vertical' ||
			($listProps.direction === 'horizontal' && !$listProps.hasLockedAxis)
				? // If the ghost is dragged above the top of the list,
					// place it below the top edge of the list.
					$pointer.y - ($pointerOrigin.y - draggedItemData.y) < listRect.y + $listProps.gap / 2
					? listRect.y - draggedItemData.y + $listProps.gap / 2
					: // If the ghost is dragged below the bottom of the list,
						// place it above the bottom edge of the list.
						$pointer.y + ghostRect.height - ($pointerOrigin.y - draggedItemData.y) >
						  listRect.bottom - $listProps.gap / 2
						? listRect.bottom - draggedItemData.y - ghostRect.height - $listProps.gap / 2
						: $pointer.y - $pointerOrigin.y
				: 0;
		return `translate3d(${x}px, ${y}px, 0)`;
	}
</script>

<div
	bind:this={ghostRef}
	class="ssl-ghost"
	class:is-pointer-dragging={$isPointerDragging}
	class:is-pointer-dropping={$isPointerDropping}
	class:is-between-bounds={$isBetweenBounds}
	class:is-out-of-bounds={!$isBetweenBounds}
	style:--transition-duration="{$listProps.transitionDuration}ms"
	style:cursor={$isPointerDragging ? 'grabbing' : !$isRemoving ? 'grab' : 'initial'}
	style:transform={styleTransform}
	style:visibility={$isPointerDragging || $isPointerDropping ? 'visible' : 'hidden'}
	data-id={$draggedItem && getId($draggedItem)}
	aria-hidden="true"
>
	<div class="ssl-ghost__inner">
		{@html $draggedItem?.children[0].innerHTML.trim() || '<span>GHOST</span>'}
	</div>
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
