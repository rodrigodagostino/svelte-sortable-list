<script lang="ts">
	import type { ItemData } from '$lib/types.js';
	import { getId, getIndex } from '$lib/utils/index.js';

	export let ghostRef: HTMLDivElement;
	export let ghostStatus: 'init' | 'set' | 'remove' | 'unset';
	export let direction: 'horizontal' | 'vertical';
	export let transitionDuration: number;
	export let hasLockedAxis: boolean;
	export let hasBoundaries: boolean;
	export let pointer: { x: number; y: number };
	export let pointerOrigin: { x: number; y: number };
	export let itemsOrigin: ItemData[] | null;
	export let draggedItem: HTMLLIElement | null;
	export let targetItem: HTMLLIElement | null;
	export let isDragging: boolean;
	export let isDropping: boolean;
	export let isRemoving: boolean;
	export let isBetweenBounds: boolean;

	$: {
		setPositionStyles(ghostStatus);
	}
	$: styleTransform = getStyleTransform(pointer);

	function setPositionStyles(status: 'init' | 'set' | 'remove' | 'unset') {
		if (status === 'init' || status === 'set' || status === 'remove') {
			if (!draggedItem || !itemsOrigin) return;

			const ghostRect = ghostRef.getBoundingClientRect();
			const draggedItemRect = itemsOrigin[getIndex(draggedItem)!];
			const targetItemRect = targetItem && itemsOrigin[getIndex(targetItem)!];

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
							? `left ${transitionDuration}ms cubic-bezier(0.2, 1, 0.1, 1),` +
								`top ${transitionDuration}ms cubic-bezier(0.2, 1, 0.1, 1),` +
								`transform ${transitionDuration}ms cubic-bezier(0.2, 1, 0.1, 1),` +
								`z-index 0s ${transitionDuration}ms`
							: `z-index 0s ${transitionDuration}ms`;
					// zIndex is only set and then re-set to force the transitionend event
					// (along with the handleGhostDrop() function) to be fired when the ghost
					// is dragged and dropped without being moved.
					ghostRef.style.zIndex = '9999';

					const draggedItemIndex = getIndex(draggedItem)!;
					const targetItemIndex = (targetItem && getIndex(targetItem)) ?? null;

					if (status === 'set') {
						if (!targetItem) {
							ghostRef.style.left = `${draggedItemRect.x}px`;
							ghostRef.style.top = `${draggedItemRect.y}px`;
						} else {
							if (targetItemIndex === null || !targetItemRect) return;

							ghostRef.style.left =
								direction === 'vertical'
									? `${draggedItemRect.x}px`
									: draggedItemIndex < targetItemIndex
										? `${targetItemRect.x + targetItemRect.width - draggedItemRect.width}px`
										: `${targetItemRect.x}px`;
							ghostRef.style.top =
								direction === 'vertical'
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
		if (!isDragging || !draggedItem || !itemsOrigin) return 'translate3d(0, 0, 0)';

		const listRect = ghostRef.previousElementSibling!.getBoundingClientRect()!;
		const ghostRect = ghostRef.getBoundingClientRect()!;
		const draggedItemData = itemsOrigin[getIndex(draggedItem)!];

		if (!hasBoundaries) {
			const x =
				direction === 'horizontal' || (direction === 'vertical' && !hasLockedAxis)
					? pointer.x - pointerOrigin.x
					: 0;
			const y =
				direction === 'vertical' || (direction === 'horizontal' && !hasLockedAxis)
					? pointer.y - pointerOrigin.y
					: 0;
			return `translate3d(${x}px, ${y}px, 0)`;
		} else {
			const x =
				direction === 'horizontal' || (direction === 'vertical' && !hasLockedAxis)
					? pointer.x - (pointerOrigin.x - draggedItemData.x) < listRect.x
						? listRect.x - draggedItemData.x
						: pointer.x + ghostRect.width - (pointerOrigin.x - draggedItemData.x) > listRect.right
							? listRect.right - draggedItemData.x - ghostRect.width
							: pointer.x - pointerOrigin.x
					: 0;
			const y =
				direction === 'vertical' || (direction === 'horizontal' && !hasLockedAxis)
					? pointer.y - (pointerOrigin.y - draggedItemData.y) < listRect.y
						? listRect.y - draggedItemData.y
						: pointer.y + ghostRect.height - (pointerOrigin.y - draggedItemData.y) > listRect.bottom
							? listRect.bottom - draggedItemData.y - ghostRect.height
							: pointer.y - pointerOrigin.y
					: 0;
			return `translate3d(${x}px, ${y}px, 0)`;
		}
	}
</script>

<div
	bind:this={ghostRef}
	class="ghost"
	class:is-dragging={isDragging}
	class:is-dropping={isDropping}
	class:is-between-bounds={isBetweenBounds}
	class:is-out-of-bounds={!isBetweenBounds}
	style:--transition-duration="{transitionDuration}ms"
	style:cursor={isDragging ? 'grabbing' : !isRemoving ? 'grab' : 'initial'}
	style:transform={styleTransform}
	style:visibility={isDragging || isDropping ? 'visible' : 'hidden'}
	data-id={draggedItem && getId(draggedItem)}
	aria-hidden="true"
>
	<div class="ghost__inner">
		{@html draggedItem?.children[0].innerHTML.trim() || '<span>GHOST</span>'}
	</div>
</div>

<style lang="scss">
	.ghost {
		position: fixed;
		list-style: none;
		user-select: none;
		backface-visibility: hidden;
		z-index: 9999;

		&__inner {
			display: flex;
			align-items: center;
			gap: 0.75rem;
		}
	}
</style>
