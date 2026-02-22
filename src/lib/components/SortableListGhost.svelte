<!--
@component
## <SortableListGhost>
Serves as the dragged item placeholder during the drag-and-drop interactions triggered by a pointer device.

### Props
- `ref`: reference to the ghost element (HTMLDivElement). `[$bindable]`

### Usage
```svelte
	<SortableListGhost bind:ref={ghostRef} />
```
-->

<script lang="ts">
	import { untrack } from 'svelte';
	import SortableListItem from './SortableListItem.svelte';
	import { portal } from '$lib/actions/index.js';
	import { getSortableListRootState } from '$lib/states/index.js';
	import type { SortableListGhostProps as GhostProps } from '$lib/types/index.js';
	import {
		calculateTranslate,
		calculateTranslateWithAlignment,
		getIndex,
		isInSameRow,
		preserveFormFieldValues,
	} from '$lib/utils/index.js';

	let { ref = $bindable(null) }: GhostProps = $props();

	const rootState = getSortableListRootState();

	const draggedId = $derived(rootState.draggedItem ? rootState.draggedItem.id : null);
	const draggedIndex = $derived(rootState.draggedItem ? getIndex(rootState.draggedItem) : null);
	// rootState.itemRects is used as a reliable reference to the item’s position in the list
	// without the risk of catching in-between values while an item is translating.
	const draggedRect = $derived(
		rootState.itemRects && typeof draggedIndex === 'number'
			? rootState.itemRects[draggedIndex]
			: null
	);
	const targetIndex = $derived(rootState.targetItem ? getIndex(rootState.targetItem) : null);
	const targetRect = $derived(
		rootState.itemRects && typeof targetIndex === 'number' ? rootState.itemRects[targetIndex] : null
	);

	function cloneDraggedItemContent() {
		if (!ref || !rootState.draggedItem) return;

		const clone = rootState.draggedItem.cloneNode(true) as HTMLLIElement;
		preserveFormFieldValues(rootState.draggedItem, clone);
		// `childNodes` is used to always preserve the dragged item’s content,
		// even when only a text node is present inside.
		ref.children[0].replaceChildren(...clone.childNodes);
	}
	$effect.pre(() => {
		if (rootState.ghostState === 'ptr-drag-start') untrack(() => cloneDraggedItemContent());
	});

	function getStyleLeft() {
		if (
			rootState.ghostState === 'idle' ||
			typeof draggedIndex !== 'number' ||
			!ref ||
			!draggedRect ||
			!rootState.itemRects
		)
			return '0';

		if (rootState.ghostState === 'ptr-remove') return ref.style.left;

		if (!rootState.targetItem || typeof targetIndex !== 'number' || !targetRect)
			return `${draggedRect.x}px`;

		const left =
			rootState.props.direction === 'vertical'
				? draggedRect.x
				: draggedIndex < targetIndex
					? targetRect.right - draggedRect.width
					: targetRect.x;
		return `${left}px`;
	}

	function getStyleTop() {
		if (
			rootState.ghostState === 'idle' ||
			typeof draggedIndex !== 'number' ||
			!ref ||
			!draggedRect ||
			!rootState.itemRects
		)
			return '0';

		if (rootState.ghostState === 'ptr-remove') return ref.style.top;

		if (!rootState.targetItem || typeof targetIndex !== 'number' || !targetRect)
			return `${draggedRect.y}px`;

		const alignItems =
			rootState.props.ref && window.getComputedStyle(rootState.props.ref).alignItems;
		const top =
			rootState.props.direction === 'vertical'
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

	function getStyleTransform() {
		if (
			rootState.ghostState === 'idle' ||
			rootState.ghostState === 'ptr-drop' ||
			!ref ||
			!rootState ||
			!rootState.pointer ||
			!rootState.pointerOrigin
		)
			return 'translate3d(0, 0, 0)';

		const ghostRect = ref.getBoundingClientRect();
		const rootRect = rootState.props.ref?.getBoundingClientRect();

		if (!rootRect) return 'translate3d(0, 0, 0)';

		if (
			(rootState.ghostState === 'ptr-drag-start' || rootState.ghostState === 'ptr-drag') &&
			draggedRect
		) {
			if (!rootState.props.hasBoundaries) {
				const x =
					rootState.props.direction === 'horizontal' ||
					(rootState.props.direction === 'vertical' && !rootState.props.hasLockedAxis)
						? `${rootState.pointer.x - rootState.pointerOrigin.x}px`
						: 0;
				const y =
					rootState.props.direction === 'vertical' ||
					(rootState.props.direction === 'horizontal' && !rootState.props.hasLockedAxis)
						? `${rootState.pointer.y - rootState.pointerOrigin.y}px`
						: 0;
				return `translate3d(${x}, ${y}, 0)`;
			}

			const x =
				rootState.props.direction === 'horizontal' ||
				(rootState.props.direction === 'vertical' && !rootState.props.hasLockedAxis)
					? // If the ghost is dragged to the left of the list,
						// place it to the right of the left edge of the list.
						rootState.pointer.x - (rootState.pointerOrigin.x - draggedRect.x) <
						rootRect.x + rootState.props.gap! / 2
						? `${rootRect.x - draggedRect.x + rootState.props.gap! / 2}px`
						: // If the ghost is dragged to the right of the list,
							// place it to the left of the right edge of the list.
							rootState.pointer.x + ghostRect.width - (rootState.pointerOrigin.x - draggedRect.x) >
							  rootRect.right - rootState.props.gap! / 2
							? `${rootRect.right - draggedRect.x - ghostRect.width - rootState.props.gap! / 2}px`
							: `${rootState.pointer.x - rootState.pointerOrigin.x}px`
					: 0;
			const y =
				rootState.props.direction === 'vertical' ||
				(rootState.props.direction === 'horizontal' && !rootState.props.hasLockedAxis)
					? // If the ghost is dragged above the top of the list,
						// place it right below the top edge of the list.
						rootState.pointer.y - (rootState.pointerOrigin.y - draggedRect.y) <
						rootRect.y + rootState.props.gap! / 2
						? `${rootRect.y - draggedRect.y + rootState.props.gap! / 2}px`
						: // If the ghost is dragged below the bottom of the list,
							// place it right above the bottom edge of the list.
							rootState.pointer.y + ghostRect.height - (rootState.pointerOrigin.y - draggedRect.y) >
							  rootRect.bottom - rootState.props.gap! / 2
							? `${rootRect.bottom - draggedRect.y - ghostRect.height - rootState.props.gap! / 2}px`
							: `${rootState.pointer.y - rootState.pointerOrigin.y}px`
					: 0;
			return `translate3d(${x}, ${y}, 0)`;
		}

		if (rootState.ghostState === 'ptr-predrop' && typeof draggedIndex === 'number' && draggedRect) {
			if (
				!rootState.props.ref ||
				!rootState.targetItem ||
				typeof targetIndex !== 'number' ||
				!targetRect
			)
				return 'translate3d(0, 0, 0)';

			const x =
				rootState.props.direction === 'vertical'
					? `${ghostRect.x - targetRect.x + (ghostRect.width - targetRect.width) / 2}px`
					: calculateTranslate('x', ghostRect, targetRect, draggedIndex, targetIndex);
			const y =
				rootState.props.direction === 'vertical'
					? calculateTranslate('y', ghostRect, targetRect, draggedIndex, targetIndex)
					: calculateTranslateWithAlignment(rootState.props.ref, ghostRect, targetRect);

			return `translate3d(${x}, ${y}, 0)`;
		}

		if (rootState.ghostState === 'ptr-remove') return ref.style.transform;
	}

	const styleLeft = $derived.by(() => {
		void rootState.ghostState;
		return untrack(() => getStyleLeft());
	});
	const styleTop = $derived.by(() => {
		void rootState.ghostState;
		return untrack(() => getStyleTop());
	});
	const styleTransform = $derived.by(() => {
		void rootState.ghostState;
		void rootState.pointer;
		return untrack(() => getStyleTransform());
	});

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
	style:--ssl-gap="{rootState.props.gap}px"
	style:--ssl-wrap={rootState.props.hasWrapping ? 'wrap' : 'nowrap'}
	style:--ssl-transition-duration="{rootState.props.transition?.duration}ms"
	style:--ssl-transition-easing={rootState.props.transition?.easing}
	data-ghost-state={rootState.ghostState}
	data-can-clear-on-drag-out={rootState.props.canClearOnDragOut}
	data-can-remove-on-drop-out={rootState.props.canRemoveOnDropOut}
	aria-hidden="true"
	onpointerdown={handlePointerDown}
	use:portal
>
	<!-- The following if clause will prevent <SortableListItem> -->
	<!-- from transitioning out on page navigation. -->
	{#if rootState.props.ref}
		<SortableListItem
			id={draggedId || 'ssl-ghost-item'}
			index={draggedIndex ?? -1}
			class={rootState.draggedItem?.className.replace(/\s*s-[a-zA-Z0-9]{12}\s*/g, '')}
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

		&[data-ghost-state*='ptr-drag'],
		&[data-ghost-state='ptr-predrop'] {
			z-index: 10000;
		}

		/* The z-index is different from the one in [data-ghost-state*='ptr-drag'] and [data-ghost-state='ptr-predrop'] just to force
			 the «transitionend» event to be fired when the ghost is dragged and dropped without being moved. */
		&[data-ghost-state='ptr-drop'],
		&[data-ghost-state='ptr-remove'] {
			z-index: 9999;
		}
	}
</style>
