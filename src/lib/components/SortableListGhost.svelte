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
		keepWithinBounds,
		preserveFormFieldValues,
	} from '$lib/utils/index.js';

	let { ref = $bindable(null) }: GhostProps = $props();

	const rootState = getSortableListRootState();

	const draggedId = $derived(rootState.draggedItem ? rootState.draggedItem.id : null);
	const draggedIndex = $derived(rootState.draggedItem ? getIndex(rootState.draggedItem) : null);
	// rootState.itemRectsSnapshot is used as a reliable reference to the item’s position in the list
	// without the risk of catching in-between values while an item is translating.
	const draggedRectSnapshot = $derived.by(() => {
		if (!rootState.itemRectsSnapshot || typeof draggedIndex !== 'number') return null;
		const rect = rootState.itemRectsSnapshot[draggedIndex];
		const { scrollOffset } = rootState;
		return !scrollOffset.left && !scrollOffset.top
			? rect
			: new DOMRect(rect.x - scrollOffset.left, rect.y - scrollOffset.top, rect.width, rect.height);
	});
	const targetIndex = $derived(rootState.targetItem ? getIndex(rootState.targetItem) : null);
	const targetRectSnapshot = $derived.by(() => {
		if (!rootState.itemRectsSnapshot || typeof targetIndex !== 'number') return null;
		const rect = rootState.itemRectsSnapshot[targetIndex];
		const { scrollOffset } = rootState;
		return !scrollOffset.left && !scrollOffset.top
			? rect
			: new DOMRect(rect.x - scrollOffset.left, rect.y - scrollOffset.top, rect.width, rect.height);
	});

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
			!draggedRectSnapshot ||
			!rootState.itemRectsSnapshot
		)
			return '0';

		if (rootState.ghostState === 'ptr-remove') return ref.style.left;

		if (!rootState.targetItem || typeof targetIndex !== 'number' || !targetRectSnapshot)
			return `${draggedRectSnapshot.x}px`;

		const left =
			rootState.props.direction === 'vertical'
				? draggedRectSnapshot.x
				: draggedIndex < targetIndex
					? targetRectSnapshot.right - draggedRectSnapshot.width
					: targetRectSnapshot.x;
		return `${left}px`;
	}

	function getStyleTop() {
		if (
			rootState.ghostState === 'idle' ||
			typeof draggedIndex !== 'number' ||
			!ref ||
			!draggedRectSnapshot ||
			!rootState.itemRectsSnapshot
		)
			return '0';

		if (rootState.ghostState === 'ptr-remove') return ref.style.top;

		if (!rootState.targetItem || typeof targetIndex !== 'number' || !targetRectSnapshot)
			return `${draggedRectSnapshot.y}px`;

		const alignItems =
			rootState.props.ref && window.getComputedStyle(rootState.props.ref).alignItems;
		const top =
			rootState.props.direction === 'vertical'
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

	function getStyleTransform() {
		if (
			rootState.ghostState === 'idle' ||
			rootState.ghostState === 'ptr-drop' ||
			!ref ||
			!rootState.props.ref ||
			!rootState.pointer ||
			!rootState.pointerOrigin
		)
			return 'translate3d(0, 0, 0)';

		if (
			(rootState.ghostState === 'ptr-drag-start' || rootState.ghostState === 'ptr-drag') &&
			draggedRectSnapshot
		) {
			if (!rootState.props.hasBoundaries) {
				const x =
					rootState.props.direction === 'horizontal' ||
					(rootState.props.direction === 'vertical' && !rootState.props.hasLockedAxis)
						? rootState.pointer.x - rootState.pointerOrigin.x
						: 0;
				const y =
					rootState.props.direction === 'vertical' ||
					(rootState.props.direction === 'horizontal' && !rootState.props.hasLockedAxis)
						? rootState.pointer.y - rootState.pointerOrigin.y
						: 0;
				return `translate3d(${x}px, ${y}px, 0)`;
			}

			const rootRect = rootState.props.ref.getBoundingClientRect();
			const x =
				rootState.props.direction === 'horizontal' ||
				(rootState.props.direction === 'vertical' && !rootState.props.hasLockedAxis)
					? keepWithinBounds(
							'x',
							rootState.pointer.x,
							rootState.pointerOrigin.x,
							rootRect,
							draggedRectSnapshot,
							rootState.props.gap!
						)
					: 0;
			const y =
				rootState.props.direction === 'vertical' ||
				(rootState.props.direction === 'horizontal' && !rootState.props.hasLockedAxis)
					? keepWithinBounds(
							'y',
							rootState.pointer.y,
							rootState.pointerOrigin.y,
							rootRect,
							draggedRectSnapshot,
							rootState.props.gap!
						)
					: 0;
			return `translate3d(${x}px, ${y}px, 0)`;
		}

		if (
			rootState.ghostState === 'ptr-predrop' &&
			typeof draggedIndex === 'number' &&
			draggedRectSnapshot
		) {
			if (
				!rootState.props.ref ||
				!rootState.targetItem ||
				typeof targetIndex !== 'number' ||
				!targetRectSnapshot
			)
				return 'translate3d(0, 0, 0)';

			const ghostRect = ref.getBoundingClientRect();
			const x =
				rootState.props.direction === 'vertical'
					? ghostRect.x - targetRectSnapshot.x + (ghostRect.width - targetRectSnapshot.width) / 2
					: calculateTranslate('x', ghostRect, targetRectSnapshot, draggedIndex, targetIndex);
			const y =
				rootState.props.direction === 'vertical'
					? calculateTranslate('y', ghostRect, targetRectSnapshot, draggedIndex, targetIndex)
					: calculateTranslateWithAlignment(rootState.props.ref, ghostRect, targetRectSnapshot);

			return `translate3d(${x}px, ${y}px, 0)`;
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
			transition: transform var(--ssl-transition-duration) var(--ssl-transition-easing);
		}

		&:not([data-ghost-state='idle']) {
			visibility: visible;
		}
	}
</style>
