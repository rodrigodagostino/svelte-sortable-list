<!--
@component
## <SortableList.Item>
Serves as an individual item within `<SortableList.Root>`. Holds the data and content for each list item, as well as the `<SortableList.ItemHandle>` and `<SortableList.ItemRemove>` components when needed.

### Props
- `ref`: reference to the item element (HTMLLIElement). `[$bindable]`
- `id`: unique identifier for each item.
- `index`: position of the item in the list.
- `isLocked`: if `true`, will prevent the item from being dragged.
- `isDisabled`: if `true`, will prevent the item from being dragged and change its appearance to dimmed.
- `transitionIn`: animation played when the item is added to the list.
- `transitionOut`: animation played when the item is removed from the list.

### Usage
```svelte
	<SortableList.Item id={item.id} {index}>
		<div class="ssl-item-content">
			{item.text}
		</div>
	</SortableList.Item>
```
-->

<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { on } from 'svelte/events';
	import SortableListPlaceholder from '$lib/components/SortableListPlaceholder.svelte';
	import { getSortableListRootState, registry } from '$lib/states/index.js';
	import { scaleFly } from '$lib/transitions/index.js';
	import type { SortableListItemProps as ItemProps } from '$lib/types/index.js';
	import {
		calculateTranslate,
		calculateTranslateWithAlignment,
		dispatch,
		getIndex,
		INTERACTIVE_ELEMENTS,
		INTERACTIVE_ROLE_ATTRIBUTES,
		isInSameRow,
		isOrResidesInInteractiveElement,
		keepWithinBounds,
	} from '$lib/utils/index.js';

	let {
		ref = $bindable(null),
		id,
		index,
		isLocked = false,
		isDisabled = false,
		transitionIn = undefined,
		transitionOut = undefined,
		children,
		...restProps
	}: ItemProps & { class?: string } = $props();

	function defaultTransition(node: HTMLElement) {
		if (registry.crossingItemId === node.id) return {};
		return scaleFly(node, {
			duration: rootState.props.transition?.duration,
			axis: rootState.props.direction === 'vertical' ? 'y' : 'x',
		});
	}
	const _transitionIn = untrack(() => transitionIn) || defaultTransition;
	const _transitionOut = untrack(() => transitionOut) || defaultTransition;

	const rootState = getSortableListRootState();

	const classes = $derived(['ssl-item', restProps.class]);

	const selectors = [...INTERACTIVE_ELEMENTS, ...INTERACTIVE_ROLE_ATTRIBUTES].join(', ');
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async function setInteractiveElementsTabIndex(...args: unknown[]) {
		await tick();
		ref
			?.querySelectorAll<HTMLElement>(selectors)
			.forEach(
				(el) =>
					(el.tabIndex =
						rootState.dragState !== 'kbd-drag-start' &&
						rootState.dragState !== 'kbd-drag' &&
						focusedId === String(id) &&
						!rootState.props.isDisabled &&
						!isDisabled
							? 0
							: -1)
			);
	}
	$effect(() => {
		setInteractiveElementsTabIndex(rootState.dragState === 'kbd-drag-start', focusedId);
	});

	onMount(() => {
		setInteractiveElementsTabIndex();
	});

	const rectSnapshot = $derived(
		rootState.itemRectsSnapshot ? rootState.itemRectsSnapshot[index] : null
	);
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
	const targetIndex = $derived(
		registry.targetRoot && registry.isSourceRootState(rootState)
			? null
			: rootState.targetItem
				? getIndex(rootState.targetItem)
				: null
	);
	const targetRectSnapshot = $derived.by(() => {
		if (!rootState.itemRectsSnapshot || typeof targetIndex !== 'number') return null;
		const rect = rootState.itemRectsSnapshot[targetIndex];
		const { scrollOffset } = rootState;
		return !scrollOffset.left && !scrollOffset.top
			? rect
			: new DOMRect(rect.x - scrollOffset.left, rect.y - scrollOffset.top, rect.width, rect.height);
	});
	const focusedId = $derived(rootState.focusedItem ? rootState.focusedItem.id : null);

	function getStylePosition() {
		if (draggedId !== String(id) || !rootState.dragState.startsWith('ptr')) return undefined;
		return 'fixed';
	}

	function getStyleLeft() {
		if (draggedId !== String(id) || !rootState.dragState.startsWith('ptr') || !rectSnapshot)
			return undefined;

		if (rootState.dragState === 'ptr-predrop' || rootState.dragState === 'ptr-drop') {
			const peerTargetRect = registry.targetRoot?.targetItemRect;
			if (peerTargetRect) return `${peerTargetRect.x}px`;
		}

		if (
			(rootState.dragState === 'ptr-predrop' || rootState.dragState === 'ptr-drop') &&
			draggedRectSnapshot &&
			targetRectSnapshot &&
			typeof draggedIndex === 'number' &&
			typeof targetIndex === 'number'
		) {
			const left =
				rootState.props.direction === 'vertical'
					? draggedRectSnapshot.x
					: draggedIndex < targetIndex
						? targetRectSnapshot.right - draggedRectSnapshot.width
						: targetRectSnapshot.x;
			return `${left}px`;
		}

		return `${rectSnapshot.x}px`;
	}

	function getStyleTop() {
		if (draggedId !== String(id) || !rootState.dragState.startsWith('ptr') || !rectSnapshot || !ref)
			return undefined;

		if (rootState.dragState === 'ptr-predrop' || rootState.dragState === 'ptr-drop') {
			const peerTargetRect = registry.targetRoot?.targetItemRect;
			if (peerTargetRect) return `${peerTargetRect.y}px`;
		}

		if (
			(rootState.dragState === 'ptr-predrop' || rootState.dragState === 'ptr-drop') &&
			draggedRectSnapshot &&
			targetRectSnapshot &&
			typeof draggedIndex === 'number' &&
			typeof targetIndex === 'number'
		) {
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

		return `${rectSnapshot.y}px`;
	}

	function getStyleWidth() {
		if (draggedId !== String(id)) return undefined;
		return `${rectSnapshot?.width}px`;
	}

	function getStyleHeight() {
		if (draggedId !== String(id)) return undefined;
		return `${rectSnapshot?.height}px`;
	}

	function getStyleTransform() {
		if (registry.isTargetRootState(rootState)) return getForeignNeighborTransform();

		if (
			rootState.dragState === 'idle' ||
			rootState.dragState === 'ptr-cancel' ||
			rootState.dragState === 'kbd-cancel' ||
			!rootState.itemRectsSnapshot ||
			!rootState.draggedItem ||
			!rectSnapshot ||
			draggedIndex === null ||
			!draggedRectSnapshot
		)
			return 'translate3d(0, 0, 0)';

		if (draggedId !== String(id)) return getNeighborTransform();

		if (rootState.dragState.startsWith('kbd')) return getKeyboardTransform();
		if (rootState.dragState === 'ptr-remove') return ref?.style.transform;
		if (rootState.dragState === 'ptr-drop') return 'translate3d(0, 0, 0)';
		if (rootState.dragState === 'ptr-predrop') return getPredropTransform();

		return getPointerTransform();
	}

	function getForeignNeighborTransform() {
		const { sourceRoot, targetRoot } = registry;
		if (
			!targetRoot ||
			!sourceRoot ||
			typeof targetRoot.targetItemIndex !== 'number' ||
			index < targetRoot.targetItemIndex
		)
			return 'translate3d(0, 0, 0)';

		const x =
			rootState.props.direction === 'vertical'
				? 0
				: (rootState.isRTL ? -1 : 1) * (sourceRoot.draggedItemRect.width + rootState.props.gap!);
		const y =
			rootState.props.direction === 'vertical'
				? sourceRoot.draggedItemRect.height + rootState.props.gap!
				: 0;

		return `translate3d(${x}px, ${y}px, 0)`;
	}

	function getNeighborTransform() {
		if (rootState.props.canRemoveOnDropOut && !rootState.isBetweenBounds)
			return 'translate3d(0, 0, 0)';

		if (
			targetIndex === null ||
			// Check if the item is outside the range between
			// the dragged item’s origin and the target item.
			index < Math.min(draggedIndex!, targetIndex) ||
			index > Math.max(draggedIndex!, targetIndex)
		)
			return 'translate3d(0, 0, 0)';

		const step = index > draggedIndex! ? -1 : 1;
		const direction = index > draggedIndex! === !rootState.isRTL ? -1 : 1;
		const neighborRectSnapshot = rootState.itemRectsSnapshot![index + step];
		const isSameRow = isInSameRow(rectSnapshot!, neighborRectSnapshot);

		const x =
			rootState.props.direction === 'vertical'
				? 0
				: isSameRow
					? direction * (draggedRectSnapshot!.width + rootState.props.gap!)
					: neighborRectSnapshot.right - rectSnapshot!.right;
		const y =
			rootState.props.direction === 'vertical'
				? direction * (draggedRectSnapshot!.height + rootState.props.gap!)
				: isSameRow
					? 0
					: calculateTranslateWithAlignment(
							rootState.props.ref!,
							neighborRectSnapshot,
							rectSnapshot!
						);

		return `translate3d(${x}px, ${y}px, 0)`;
	}

	function getKeyboardTransform() {
		if (!targetRectSnapshot || typeof targetIndex !== 'number') return 'translate3d(0, 0, 0)';

		const x =
			rootState.props.direction === 'vertical'
				? 0
				: calculateTranslate(
						'x',
						targetRectSnapshot,
						draggedRectSnapshot!,
						draggedIndex!,
						targetIndex
					);
		const y =
			rootState.props.direction === 'vertical'
				? calculateTranslate(
						'y',
						targetRectSnapshot,
						draggedRectSnapshot!,
						draggedIndex!,
						targetIndex
					)
				: isInSameRow(draggedRectSnapshot!, targetRectSnapshot)
					? 0
					: calculateTranslateWithAlignment(
							rootState.props.ref!,
							targetRectSnapshot,
							draggedRectSnapshot!
						);

		return `translate3d(${x}px, ${y}px, 0)`;
	}

	function getPredropTransform() {
		const peerTargetRect = registry.targetRoot?.targetItemRect;
		if (peerTargetRect) {
			// Take a live read of the dragged item’s rect to avoid stale values.
			const draggedRect = rootState.draggedItem!.getBoundingClientRect();
			const x = draggedRect.x - peerTargetRect.x;
			const y = draggedRect.y - peerTargetRect.y;

			return `translate3d(${x}px, ${y}px, 0)`;
		}

		if (!targetRectSnapshot || typeof targetIndex !== 'number') return 'translate3d(0, 0, 0)';

		// Take a live read of the dragged item’s rect to avoid stale values.
		const draggedRect = rootState.draggedItem!.getBoundingClientRect();

		const x =
			rootState.props.direction === 'vertical'
				? draggedRect.x - targetRectSnapshot.x + (draggedRect.width - targetRectSnapshot.width) / 2
				: calculateTranslate('x', draggedRect, targetRectSnapshot, draggedIndex!, targetIndex);
		const y =
			rootState.props.direction === 'vertical'
				? calculateTranslate('y', draggedRect, targetRectSnapshot, draggedIndex!, targetIndex)
				: calculateTranslateWithAlignment(rootState.props.ref!, draggedRect, targetRectSnapshot);

		return `translate3d(${x}px, ${y}px, 0)`;
	}

	function getPointerTransform() {
		if (!rootState.pointer || !rootState.pointerOrigin) return 'translate3d(0, 0, 0)';

		const rootRect = rootState.props.ref!.getBoundingClientRect();

		const x =
			rootState.props.direction === 'horizontal' ||
			(rootState.props.direction === 'vertical' && !rootState.props.hasLockedAxis)
				? rootState.props.hasBoundaries
					? keepWithinBounds(
							'x',
							rootState.pointer.x,
							rootState.pointerOrigin.x,
							rootRect,
							draggedRectSnapshot!,
							rootState.props.gap!
						)
					: rootState.pointer.x - rootState.pointerOrigin.x
				: 0;
		const y =
			rootState.props.direction === 'vertical' ||
			(rootState.props.direction === 'horizontal' && !rootState.props.hasLockedAxis)
				? rootState.props.hasBoundaries
					? keepWithinBounds(
							'y',
							rootState.pointer.y,
							rootState.pointerOrigin.y,
							rootRect,
							draggedRectSnapshot!,
							rootState.props.gap!
						)
					: rootState.pointer.y - rootState.pointerOrigin.y
				: 0;

		return `translate3d(${x}px, ${y}px, 0)`;
	}

	const stylePosition = $derived.by(() => {
		void rootState.dragState;
		return untrack(() => getStylePosition());
	});
	const styleLeft = $derived.by(() => {
		void rootState.dragState;
		return untrack(() => getStyleLeft());
	});
	const styleTop = $derived.by(() => {
		void rootState.dragState;
		return untrack(() => getStyleTop());
	});
	const styleWidth = $derived.by(() => {
		void rootState.draggedItem;
		void rootState.isBetweenBounds;
		return untrack(() => getStyleWidth());
	});
	const styleHeight = $derived.by(() => {
		void rootState.draggedItem;
		void rootState.isBetweenBounds;
		return untrack(() => getStyleHeight());
	});
	const styleTransform = $derived.by(() => {
		void rootState.dragState;
		void rootState.pointer;
		void rootState.targetItem;
		void rootState.isBetweenBounds;
		void registry.sourceRoot;
		void registry.targetRoot;
		return untrack(() => getStyleTransform());
	});

	async function handleFocus(e: FocusEvent) {
		if (rootState.dragState.startsWith('ptr')) {
			e.preventDefault();
			return;
		}

		await tick();
		rootState.focusedItem = ref;
	}

	// `focusout` is preferred over `blur` since it detects the loss of focus
	// on the current element and it’s descendants too.
	async function handleFocusOut(e: FocusEvent) {
		const relatedTarget = e.relatedTarget as HTMLElement | null;
		if (!relatedTarget || (relatedTarget && !relatedTarget.closest('.ssl-item'))) {
			if (!rootState.focusedItem) return;
			dispatch(ref!, 'itemfocusout', { item: rootState.focusedItem });
			await tick();
			rootState.focusedItem = null;
		}
	}

	// Prevent context menu from opening on long-press in Chrome for Android.
	const ontouchstart: Attachment = (element) => {
		return on(
			element,
			'touchstart',
			(e) => {
				if (e.target && ref && !isOrResidesInInteractiveElement(e.target as HTMLElement, ref))
					e.preventDefault();
			},
			{ passive: false }
		);
	};
</script>

{#if draggedId === String(id) && rootState.dragState.startsWith('ptr')}
	<SortableListPlaceholder {id} {index} />
{/if}
<li
	bind:this={ref}
	{id}
	class={classes}
	style:position={stylePosition}
	style:left={styleLeft}
	style:top={styleTop}
	style:width={styleWidth}
	style:height={styleHeight}
	style:transform={styleTransform}
	style:--ssl-transition-duration="{rootState.props?.transition?.duration}ms"
	style:--ssl-transition-easing={rootState.props?.transition?.easing}
	data-item-id={id}
	data-item-index={index}
	data-drag-state={draggedId === String(id) ? rootState.dragState : 'idle'}
	data-is-between-bounds={!rootState.isBetweenBounds && draggedId === String(id) ? false : true}
	data-is-locked={rootState.props.isLocked || isLocked}
	data-is-disabled={rootState.props.isDisabled || isDisabled}
	tabindex={focusedId === String(id) ? 0 : -1}
	role="option"
	aria-disabled={rootState.props.isDisabled || isDisabled}
	aria-label={restProps['aria-label'] || undefined}
	aria-labelledby={restProps['aria-labelledby'] || undefined}
	aria-selected={focusedId === String(id)}
	onfocus={handleFocus}
	onfocusout={handleFocusOut}
	{@attach ontouchstart}
	in:_transitionIn
	out:_transitionOut
>
	{@render children?.()}
</li>

<style>
	.ssl-item {
		margin: calc(var(--ssl-gap) / 2);
		position: relative;
		list-style: none;
		user-select: none;
		backface-visibility: hidden;
		z-index: 1;

		&:not(:has(.ssl-item-handle)),
		& :global(.ssl-item-handle) {
			touch-action: none;
			cursor: grab;
		}

		&[data-drag-state*='ptr-drag'],
		&[data-drag-state*='ptr-drag'] :global(.ssl-item-handle) {
			cursor: grabbing;
		}

		&[data-is-locked='true'] {
			cursor: initial;
		}

		&[aria-disabled='true'] {
			cursor: not-allowed;

			& > :global(*) {
				pointer-events: none;
			}
		}

		&[data-drag-state='ptr-drop'],
		&[data-drag-state*='kbd'],
		&:has(~ :global(.ssl-item[data-drag-state='ptr-drag'])),
		&[data-drag-state='ptr-drag'] ~ :global(.ssl-item),
		&:has(~ :global(.ssl-placeholder[data-drag-state='ptr-drag'])),
		& ~ :global(.ssl-placeholder[data-drag-state='ptr-drag']) {
			transition: transform var(--ssl-transition-duration);
		}

		&[data-drag-state='ptr-drop'] {
			transition-timing-function: var(--ssl-transition-easing);
		}

		&[data-drag-state*='ptr'] {
			margin: 0;
			z-index: 9999;
		}

		&[data-drag-state*='kbd'] {
			z-index: 2;
		}
	}
</style>
