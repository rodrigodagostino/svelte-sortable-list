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
	import { onDestroy, tick, untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import SortableListPlaceholder from '$lib/components/SortableListPlaceholder.svelte';
	import {
		getSortableListRootState,
		registry,
		setSortableListItemState,
	} from '$lib/states/index.js';
	import { scaleFly } from '$lib/transitions/index.js';
	import type { SortableListItemProps as ItemProps } from '$lib/types/index.js';
	import {
		calculateTranslate,
		calculateTranslateWithAlignment,
		dispatch,
		getIndex,
		getItemRect,
		INTERACTIVE_SELECTORS,
		isInSameRow,
		isOrResidesInInteractiveElement,
		keepWithinBounds,
		toFixedPosition,
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

	const itemState = setSortableListItemState();

	function defaultTransition(node: HTMLElement) {
		if (registry.crossingItemId === node.dataset.itemId) return {};
		const config = scaleFly(node, {
			duration: rootState.props.transition?.duration,
			axis: rootState.props.direction === 'vertical' ? 'y' : 'x',
		});
		// Svelte caches this config while a transition is in flight (an outro that starts
		// mid-intro reuses the intro’s config), so the crossing check must also run when
		// each direction starts, not only when the config is created.
		return {
			...config,
			get duration() {
				return registry.crossingItemId === node.dataset.itemId ? 0 : config.duration;
			},
		};
	}
	const _transitionIn = untrack(() => transitionIn) || defaultTransition;
	const _transitionOut = untrack(() => transitionOut) || defaultTransition;

	const rootState = getSortableListRootState();

	$effect.pre(() => {
		itemState.props = {
			ref,
			id,
			index,
		};
	});

	const classes = $derived(['ssl-item', restProps.class]);

	onDestroy(() => {
		if (rootState.focusedItem === ref) rootState.focusedItem = null;
	});

	const rect = $derived(rootState.itemRects ? rootState.itemRects[index] : null);
	const draggedId = $derived(rootState.draggedItem ? rootState.draggedItem.id : null);
	const draggedIndex = $derived(rootState.draggedItem ? getIndex(rootState.draggedItem) : null);
	// rootState.itemRects is used as a reliable reference to the item’s position in the list
	// without the risk of catching in-between values while an item is translating.
	const draggedRect = $derived.by(() => {
		if (!rootState.itemRects || typeof draggedIndex !== 'number') return null;
		const rect = rootState.itemRects[draggedIndex];
		const { scrollOffset } = rootState;
		return !scrollOffset.left && !scrollOffset.top
			? rect
			: new DOMRect(rect.x - scrollOffset.left, rect.y - scrollOffset.top, rect.width, rect.height);
	});
	const targetIndex = $derived(
		rootState.group && registry.targetList && registry.isSourceList(rootState)
			? null
			: rootState.targetItem
				? getIndex(rootState.targetItem)
				: null
	);
	const targetRect = $derived.by(() => {
		if (!rootState.itemRects || typeof targetIndex !== 'number') return null;
		const rect = rootState.itemRects[targetIndex];
		const { scrollOffset } = rootState;
		return !scrollOffset.left && !scrollOffset.top
			? rect
			: new DOMRect(rect.x - scrollOffset.left, rect.y - scrollOffset.top, rect.width, rect.height);
	});
	const focusedId = $derived(rootState.focusedItem ? rootState.focusedItem.id : null);

	const isDragged = $derived(draggedId === String(id));
	const isFocused = $derived(focusedId === String(id));
	const _isLocked = $derived(isLocked || rootState.props.isLocked);
	const _isDisabled = $derived(isDisabled || rootState.props.isDisabled);

	const isPointerDrag = $derived(rootState.dragState.startsWith('ptr'));
	const isPointerPredropping = $derived(rootState.dragState === 'ptr-predrop');
	const isPointerDropping = $derived(rootState.dragState === 'ptr-drop');
	const isKeyboardDrag = $derived(rootState.dragState.startsWith('kbd'));
	const isKeyboardStartingDragOrDragging = $derived(rootState.dragState.startsWith('kbd-drag'));
	const areInteractiveElementsTabbable = $derived(
		!isKeyboardStartingDragOrDragging && isFocused && !_isDisabled
	);

	$effect(() => {
		const tabIndex = areInteractiveElementsTabbable ? 0 : -1;
		ref
			?.querySelectorAll<HTMLElement>(INTERACTIVE_SELECTORS)
			.forEach((el) => (el.tabIndex = tabIndex));
	});

	function getStylePosition() {
		if (!isDragged) return undefined;
		return 'fixed';
	}

	function getStyleLeft() {
		if (!isDragged || !rect) return undefined;

		if (isPointerPredropping || isPointerDropping) {
			const peerTarget = registry.targetList?.targetItem;
			if (peerTarget)
				return `${toFixedPosition('x', getItemRect(peerTarget).x, rootState.fixedOrigin)}px`;
		}

		if (
			(isPointerPredropping || isPointerDropping) &&
			draggedRect &&
			targetRect &&
			typeof draggedIndex === 'number' &&
			typeof targetIndex === 'number'
		) {
			const left =
				rootState.props.direction === 'vertical'
					? draggedRect.x
					: draggedIndex < targetIndex
						? targetRect.right - draggedRect.width
						: targetRect.x;
			return `${toFixedPosition('x', left, rootState.fixedOrigin)}px`;
		}

		if (isKeyboardDrag && draggedRect)
			return `${toFixedPosition('x', draggedRect.x - rootState.props.gap! / 2, rootState.fixedOrigin)}px`;

		return `${toFixedPosition('x', rect.x, rootState.fixedOrigin)}px`;
	}

	function getStyleTop() {
		if (!isDragged || !rect || !ref) return undefined;

		if (isPointerPredropping || isPointerDropping) {
			const peerTarget = registry.targetList?.targetItem;
			if (peerTarget)
				return `${toFixedPosition('y', getItemRect(peerTarget).y, rootState.fixedOrigin)}px`;
		}

		if (
			(isPointerPredropping || isPointerDropping) &&
			draggedRect &&
			targetRect &&
			typeof draggedIndex === 'number' &&
			typeof targetIndex === 'number'
		) {
			const alignItems = rootState.ref && window.getComputedStyle(rootState.ref).alignItems;
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
			return `${toFixedPosition('y', top, rootState.fixedOrigin)}px`;
		}

		if (isKeyboardDrag && draggedRect)
			return `${toFixedPosition('y', draggedRect.y - rootState.props.gap! / 2, rootState.fixedOrigin)}px`;

		return `${toFixedPosition('y', rect.y, rootState.fixedOrigin)}px`;
	}

	function getStyleWidth() {
		if (!isDragged) return undefined;
		return `${rect?.width}px`;
	}

	function getStyleHeight() {
		if (!isDragged) return undefined;
		return `${rect?.height}px`;
	}

	function getStyleTransform() {
		if (registry.isTargetList(rootState)) return getForeignNeighborTransform();

		if (
			rootState.dragState === 'idle' ||
			rootState.dragState === 'ptr-cancel' ||
			rootState.dragState === 'kbd-cancel' ||
			!rootState.itemRects ||
			!rootState.draggedItem ||
			!rect ||
			draggedIndex === null ||
			!draggedRect
		)
			return undefined;

		if (!isDragged) return getNeighborTransform();

		if (isKeyboardDrag) return getKeyboardTransform();
		if (rootState.dragState === 'ptr-remove') return ref?.style.transform;
		if (rootState.dragState === 'ptr-drop') return 'translate3d(0, 0, 0)';
		if (rootState.dragState === 'ptr-predrop') return getPredropTransform();

		return getPointerTransform();
	}

	function getForeignNeighborTransform() {
		const { sourceList, targetList } = registry;
		if (
			!targetList ||
			!sourceList ||
			typeof targetList.targetItemIndex !== 'number' ||
			index < targetList.targetItemIndex ||
			!sourceList.state.itemRects
		)
			return undefined;

		const sourceDraggedRect = sourceList.state.itemRects[getIndex(sourceList.draggedItem)];
		const x =
			rootState.props.direction === 'vertical'
				? 0
				: (rootState.isRTL ? -1 : 1) * (sourceDraggedRect.width + rootState.props.gap!);
		const y =
			rootState.props.direction === 'vertical'
				? sourceDraggedRect.height + rootState.props.gap!
				: 0;

		return `translate3d(${x}px, ${y}px, 0)`;
	}

	function getNeighborTransform() {
		if (rootState.props.canRemoveOnDropOut && !rootState.isWithinBounds) return undefined;

		if (
			targetIndex === null ||
			// Check if the item is outside the range between
			// the dragged item’s origin and the target item.
			index < Math.min(draggedIndex!, targetIndex) ||
			index > Math.max(draggedIndex!, targetIndex)
		)
			return undefined;

		const step = index > draggedIndex! ? -1 : 1;
		const direction = index > draggedIndex! === !rootState.isRTL ? -1 : 1;
		const neighborRect = rootState.itemRects![index + step];
		const isSameRow = isInSameRow(rect!, neighborRect);

		const x =
			rootState.props.direction === 'vertical'
				? 0
				: isSameRow
					? direction * (draggedRect!.width + rootState.props.gap!)
					: neighborRect.right - rect!.right;
		const y =
			rootState.props.direction === 'vertical'
				? direction * (draggedRect!.height + rootState.props.gap!)
				: isSameRow
					? 0
					: calculateTranslateWithAlignment(rootState.ref!, neighborRect, rect!);

		return `translate3d(${x}px, ${y}px, 0)`;
	}

	function getKeyboardTransform() {
		if (registry.targetList) {
			const peerTargetRect = registry.targetList?.targetItem
				? getItemRect(registry.targetList.targetItem)
				: null;

			if (!peerTargetRect) return 'translate3d(0, 0, 0)';

			const x = peerTargetRect.x - draggedRect!.x;
			const y = peerTargetRect.y - draggedRect!.y;
			return `translate3d(${x}px, ${y}px, 0)`;
		}

		if (!targetRect || typeof targetIndex !== 'number') return 'translate3d(0, 0, 0)';

		const x =
			rootState.props.direction === 'vertical'
				? 0
				: calculateTranslate('x', targetRect, draggedRect!, draggedIndex!, targetIndex);
		const y =
			rootState.props.direction === 'vertical'
				? calculateTranslate('y', targetRect, draggedRect!, draggedIndex!, targetIndex)
				: isInSameRow(draggedRect!, targetRect)
					? 0
					: calculateTranslateWithAlignment(rootState.ref!, targetRect, draggedRect!);

		return `translate3d(${x}px, ${y}px, 0)`;
	}

	function getPredropTransform() {
		const peerTarget = registry.targetList?.targetItem;
		if (peerTarget) {
			// Take a live read of the dragged item’s rect to avoid stale values.
			const draggedRectLive = rootState.draggedItem!.getBoundingClientRect();
			const peerTargetRect = getItemRect(peerTarget);
			const x = draggedRectLive.x - peerTargetRect.x;
			const y = draggedRectLive.y - peerTargetRect.y;

			return `translate3d(${x}px, ${y}px, 0)`;
		}

		if (!targetRect || typeof targetIndex !== 'number') return 'translate3d(0, 0, 0)';

		// Take a live read of the dragged item’s rect to avoid stale values.
		const draggedRectLive = rootState.draggedItem!.getBoundingClientRect();

		const x =
			rootState.props.direction === 'vertical'
				? draggedRectLive.x - targetRect.x + (draggedRectLive.width - targetRect.width) / 2
				: calculateTranslate('x', draggedRectLive, targetRect, draggedIndex!, targetIndex);
		const y =
			rootState.props.direction === 'vertical'
				? calculateTranslate('y', draggedRectLive, targetRect, draggedIndex!, targetIndex)
				: calculateTranslateWithAlignment(rootState.ref!, draggedRectLive, targetRect);

		return `translate3d(${x}px, ${y}px, 0)`;
	}

	function getPointerTransform() {
		if (!rootState.pointer || !rootState.pointerOrigin) return 'translate3d(0, 0, 0)';

		const rootRect = rootState.props.hasBounds
			? (rootState.rect ?? rootState.ref!.getBoundingClientRect())
			: null;

		const x =
			rootState.props.direction === 'horizontal' ||
			(rootState.props.direction === 'vertical' && !rootState.props.hasLockedAxis)
				? rootState.props.hasBounds
					? keepWithinBounds(
							'x',
							rootState.pointer.x,
							rootState.pointerOrigin.x,
							rootRect!,
							draggedRect!,
							rootState.props.gap!
						)
					: rootState.pointer.x - rootState.pointerOrigin.x
				: 0;
		const y =
			rootState.props.direction === 'vertical' ||
			(rootState.props.direction === 'horizontal' && !rootState.props.hasLockedAxis)
				? rootState.props.hasBounds
					? keepWithinBounds(
							'y',
							rootState.pointer.y,
							rootState.pointerOrigin.y,
							rootRect!,
							draggedRect!,
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
		void rootState.fixedOrigin;
		void rootState.scrollOffset;
		return untrack(() => getStyleLeft());
	});

	const styleTop = $derived.by(() => {
		void rootState.dragState;
		void rootState.fixedOrigin;
		void rootState.scrollOffset;
		return untrack(() => getStyleTop());
	});

	const styleWidth = $derived.by(() => {
		void rootState.draggedItem;
		void rootState.isWithinBounds;
		return untrack(() => getStyleWidth());
	});

	const styleHeight = $derived.by(() => {
		void rootState.draggedItem;
		void rootState.isWithinBounds;
		return untrack(() => getStyleHeight());
	});

	const styleTransform = $derived.by(() => {
		void rootState.dragState;
		if (isKeyboardDrag) void rootState.scrollOffset;
		if (isDragged) void rootState.pointer;
		void rootState.targetItem;
		void rootState.isWithinBounds;
		if (rootState.group) {
			void registry.sourceList;
			void registry.targetList;
		}
		return untrack(() => getStyleTransform());
	});

	async function handleFocusIn(e: FocusEvent) {
		if (isPointerDrag) {
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
		if (!rootState.ref?.contains(relatedTarget) || rootState.ref === relatedTarget) {
			if (!rootState.focusedItem) return;
			dispatch(ref!, 'itemfocusout', { item: rootState.focusedItem });
			await tick();
			const { activeElement } = document;
			if (activeElement !== rootState.ref && rootState.ref?.contains(activeElement)) return;
			rootState.focusedItem = null;
		}
	}

	// Prevent context menu from opening on long-press in Chrome for Android.
	// The listener is non-passive, which forces the browser to wait for it before scrolling,
	// so it’s only attached to the parts of the item that can start a drag: the handle when
	// there is one, and nothing at all while the item can’t be dragged.
	const ontouchstart: Attachment<HTMLLIElement> = (element) => {
		if (_isLocked || _isDisabled) return;

		const handle = element.querySelector('.ssl-item-handle');
		const controller = new AbortController();

		(handle ?? element).addEventListener(
			'touchstart',
			(e) => {
				const target = e.target as HTMLElement | null;
				if (!target || isOrResidesInInteractiveElement(target, element)) return;

				e.preventDefault();
			},
			{ passive: false, signal: controller.signal }
		);

		return () => controller.abort();
	};
</script>

{#if isDragged}
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
	data-item-id={id}
	data-item-index={index}
	data-drag-state={isDragged ? rootState.dragState : 'idle'}
	data-is-within-bounds={!rootState.isWithinBounds && isDragged ? false : true}
	data-is-locked={_isLocked}
	data-is-disabled={_isDisabled}
	tabindex={isFocused ? 0 : -1}
	role="option"
	aria-disabled={_isDisabled}
	aria-label={restProps['aria-label'] || undefined}
	aria-labelledby={restProps['aria-labelledby'] || undefined}
	aria-selected={isFocused}
	onfocusin={handleFocusIn}
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
		z-index: 1;

		&:not([data-drag-state='idle']) {
			will-change: transform;
		}

		&:not([data-is-locked='true']):not([data-is-disabled='true']):not(:has(.ssl-item-handle)),
		&:not([data-is-locked='true']):not([data-is-disabled='true']) :global(.ssl-item-handle) {
			touch-action: none;
		}

		&:not(:has(.ssl-item-handle)),
		&:not([data-is-locked='true']):not([data-is-disabled='true']) :global(.ssl-item-handle) {
			cursor: grab;
		}

		&[data-drag-state*='ptr-drag'],
		&[data-drag-state*='ptr-drag']:not([data-is-locked='true']):not([data-is-disabled='true'])
			:global(.ssl-item-handle) {
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
		&[data-drag-state='ptr-cancel'],
		&[data-drag-state*='kbd'],
		:global(.ssl-root:has(> .ssl-placeholder:not([data-drag-state='idle'])))
			> &[data-drag-state='idle'] {
			transition: transform var(--ssl-transition-duration);
		}

		&[data-drag-state='ptr-drop'],
		&[data-drag-state='ptr-cancel'] {
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
