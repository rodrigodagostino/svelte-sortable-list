<!--
@component
## <SortableList.Root>
Serves as the primary container. Provides the main structure, the drag-and-drop interactions and emits the available events.

### Props
- `ref`: reference to the list element (HTMLUListElement). `[$bindable]`
- `id`: unique identifier for the list.
- `index`: position of the list in the group.
- `gap`: separation between items (in pixels).
- `direction`: orientation in which items will be arranged.
- `delay`: time before the drag operation starts (in milliseconds). Can help prevent accidental dragging.
- `transition`:
		- `duration`: time the transitions for the items (dropping, translation, addition, removal) take to complete (in milliseconds). Assign it a value of `0` to remove animations.
		- `easing`: mathematical function that describes the rate at which the transitioning value changes. It receives any of the values accepted by the CSS `transition-timing-function` property. Currently it only affects the dragged item drop transition.
- `hasWrapping`: if `true`, items can wrap onto multiple lines.
- `hasLockedAxis`: if `true`, prevents the dragged item from moving away from the main axis.
- `hasBounds`: if `true`, items will only be draggable inside the list limits.
- `canClearOnDragOut`: if `true`, the target item will be cleared when a the dragged item (by a pointing device) does not collide with any of the items in the list.
- `canRemoveOnDropOut`: if `true`, items will be removed when dragged and dropped outside of the list bounds.
- `isLocked`: if `true`, allows items to be focused, but prevents them from being dragged. Interactive elements inside will operate normally. When the list belongs to a `group`, it also stops receiving items from its peer lists.
- `isDisabled`: if `true`, allows items to be focused, but prevents them from being dragged and change its appearance to dimmed. Interactive elements inside will be disabled. When the list belongs to a `group`, it also stops receiving items from its peer lists.
- `modules`: opt-in features. Read once at mount.
- `announcements`: announcements to be read out by the screen reader during drag and drop operations.

### Events
- `onmounted`: the component is mounted.
- `ondragstart`: an item starts to be dragged by a pointer device or a keyboard.
- `ondrag`: a dragged item is moved around by a pointer device or a keyboard (fires once per animation frame while the pointer moves, and once per key press).
- `ondrop`: a dragged item is released by a pointer device or a keyboard.
- `ondragend`: a dragged item reaches its destination after being released.
- `ondestroyed`: the component is destroyed.

### Usage
```svelte
	<SortableList.Root ondrop={handleDrop} ondragend={handleDragEnd}>
		{#each items as item, index (item.id)}
			<SortableList.Item {...item} {index}>
				<div class="ssl-item-content">
					<span class="ssl-item-content__text">{item.text}</span>
				</div>
			</SortableList.Item>
		{/each}
	</SortableList.Root>
```
-->

<script lang="ts">
	import { onDestroy, onMount, tick, untrack } from 'svelte';
	import SortableListPlaceholder from '$lib/components/SortableListPlaceholder.svelte';
	import { setSortableListRootState, unsetSortableListRootState } from '$lib/states/index.js';
	import type {
		AutoScrollModule,
		CrossListModule,
		SortableListRootProps as RootProps,
	} from '$lib/types/index.js';
	import {
		addScrollListener,
		afterPaint,
		announce,
		areColliding,
		canScroll,
		endPointerSession,
		getClosestScrollableAncestor,
		getCollidingItemRect,
		getDefaultAriaDescription,
		getDropAnimations,
		getFixedOrigin,
		getHandle,
		getIndex,
		getItemRects,
		getItemRectWithOffset,
		getItems,
		getItemSibling,
		getPeerTargetFields,
		getTargetItemFields,
		getTextDirection,
		getVisibleRange,
		isActivePointer,
		isFullyVisible,
		isOrResidesInInteractiveElement,
		isRootElement,
		removeFixedOriginProbe,
		removeScrollListener,
		restoreFocus,
		scrollIntoView,
		startPointerSession,
		updateFixedOrigin,
		updateScrollOffset,
	} from '$lib/utils/index.js';

	let {
		ref = $bindable(null),
		id = undefined,
		index = undefined,
		gap = 12,
		direction = 'vertical',
		delay = 0,
		transition = undefined,
		hasWrapping = false,
		hasLockedAxis = false,
		hasBounds = false,
		canClearOnDragOut = false,
		canRemoveOnDropOut = false,
		isLocked = false,
		isDisabled = false,
		modules = undefined,
		announcements = undefined,
		onmounted,
		ondragstart,
		ondrag,
		ondrop,
		ondragend,
		ondestroyed,
		children,
		...restProps
	}: RootProps & { class?: string } = $props();

	const rootState = setSortableListRootState();

	const _transition = $derived({
		duration: 320,
		easing: 'cubic-bezier(0.2, 1, 0.1, 1)',
		...transition,
	});
	const _modules = untrack(() => modules) ?? [];
	const autoScroll = _modules.find((m): m is AutoScrollModule => m.kind === 'autoScroll');
	const crossList = _modules.find((m): m is CrossListModule => m.kind === 'crossList');
	rootState.crossList = crossList;
	const group = crossList?.group;
	const _announcements = $derived(announcements || announce);

	$effect.pre(() => {
		rootState.ref = ref;
		rootState.props = {
			id,
			index,
			gap,
			direction,
			delay,
			transition: _transition,
			hasWrapping,
			hasLockedAxis,
			hasBounds,
			canClearOnDragOut,
			canRemoveOnDropOut,
			isLocked,
			isDisabled,
			announcements: _announcements,
			onmounted,
			ondragstart,
			ondrag,
			ondrop,
			ondragend,
			ondestroyed,
		};
	});

	$effect.pre(() => {
		rootState.isSource = crossList?.sourceList?.state === rootState;
		rootState.isTarget = crossList?.targetList?.state === rootState;
	});

	const classes = $derived(['ssl-root', restProps.class]);
	let pointerSession: AbortController | null = null;
	let pointerId: PointerEvent['pointerId'] | null = null;
	let liveText = $state('');

	const isIdle = $derived(rootState.dragState === 'idle');
	const isPointerDrag = $derived(rootState.dragState.startsWith('ptr'));
	const isPointerStartingDrag = $derived(rootState.dragState === 'ptr-drag-start');
	const isPointerDragging = $derived(rootState.dragState === 'ptr-drag');
	const isPointerStartingDragOrDragging = $derived(rootState.dragState.startsWith('ptr-drag'));
	const isPointerPredropping = $derived(rootState.dragState === 'ptr-predrop');
	const isKeyboardDrag = $derived(rootState.dragState.startsWith('kbd'));
	const isKeyboardDragging = $derived(rootState.dragState === 'kbd-drag');
	const isKeyboardStartingDragOrDragging = $derived(rootState.dragState.startsWith('kbd-drag'));
	let isDropping = false;
	const isNested = $derived(!!rootState.parentRoot);
	const hasNestedLists = $derived(rootState.childRoots.length > 0);
	const tabIndex = $derived(
		!isNested ||
			rootState.focusedItem ||
			rootState.parentRoot?.focusedItem === ref?.closest('.ssl-item')
			? 0
			: -1
	);

	let delayTimeoutId: ReturnType<typeof setTimeout> | null = null;
	let transitionTimeoutId: ReturnType<typeof setTimeout> | null = null;

	onMount(() => {
		rootState.ref = ref;
		unregister = crossList?.register(rootState) ?? null;
		onmounted?.(null);
		rootState.isRTL = getTextDirection(ref!) === 'rtl';
		// Peer lists hand a key over to this list when interrupting a drop moved the focused item here.
		rootState.handleKeyDown = handleKeyDown;
	});

	let isDestroyed = false;
	let unregister: (() => void) | null = null;
	onDestroy(() => {
		isDestroyed = true;
		if (delayTimeoutId) clearTimeout(delayTimeoutId);
		if (transitionTimeoutId) clearTimeout(transitionTimeoutId);
		if (pointerMoveRafId) cancelAnimationFrame(pointerMoveRafId);
		if (scrollRafId) cancelAnimationFrame(scrollRafId);
		autoScroll?.stop();
		scrollEventTarget = removeScrollListener(scrollEventTarget, handleScroll);
		pointerSession = endPointerSession(pointerSession);
		unregister?.();
		unsetSortableListRootState(rootState);
		ondestroyed?.(null);
	});

	let scrollableAncestor = $derived(ref ? getClosestScrollableAncestor(ref) : undefined);
	let scrollOrigin = { left: 0, top: 0 };
	let isScrollingDocument = $derived(
		scrollableAncestor ? isRootElement(scrollableAncestor, direction) : false
	);

	function refreshScrollOffset() {
		const scrollOffset = updateScrollOffset(
			scrollableAncestor,
			scrollOrigin,
			rootState.scrollOffset
		);
		if (scrollOffset === rootState.scrollOffset) return;

		rootState.scrollOffset = scrollOffset;
		rootState.fixedOrigin = updateFixedOrigin(ref!, rootState.fixedOrigin);
	}

	function updateTargetItem() {
		if (!rootState.itemRects || !ref || !rootState.draggedItem) return;

		const draggedRect = rootState.draggedItem.getBoundingClientRect();
		rootState.rect = ref.getBoundingClientRect();
		rootState.isWithinBounds = areColliding(draggedRect, rootState.rect);
		refreshScrollOffset();
		rootState.visibleRange = getVisibleRange(
			rootState.itemRects,
			draggedRect,
			gap,
			rootState.scrollOffset
		);

		// Offset the dragged rect by the current scroll.
		const draggedRectWithOffset = getItemRectWithOffset(draggedRect, rootState.scrollOffset);
		const collidingItemRect = getCollidingItemRect(draggedRectWithOffset, rootState.itemRects);
		if (collidingItemRect) {
			rootState.targetItem = collidingItemRect.ref;
			if (crossList) crossList.targetList = null;
			return;
		} else if (canClearOnDragOut && !rootState.isWithinBounds)
			rootState.targetItem = rootState.draggedItem;

		crossList?.updateTarget(rootState, draggedRect);
	}

	let scrollRafId: number | null = null;
	let scrollEventTarget: Document | HTMLElement | null = null;
	function handleScroll() {
		// Only retarget while the pointer is actually dragging.
		if (!isPointerStartingDragOrDragging) {
			refreshScrollOffset();
			return;
		}

		// The pointer frame retargets as well, so only one of the two may run per frame.
		if (pointerMoveRafId || scrollRafId) return;

		scrollRafId = requestAnimationFrame(() => {
			// If a pointer frame was requested after this one, let it do the retargeting.
			if (!pointerMoveRafId) updateTargetItem();
			scrollRafId = null;
		});
	}

	async function handlePointerDown(e: PointerEvent) {
		const focusedRootState = rootState.focusedItem
			? rootState
			: crossList?.getPeerLists(rootState).find((l) => l.state.focusedItem)?.state;
		focusedRootState?.focusedItem?.blur();

		const target = e.target as HTMLElement;
		const currItem = target.closest<HTMLLIElement>('.ssl-item');
		if (!currItem) return;

		// Events fired inside a nested list bubble up to this one. Hand the gesture over to the list
		// that owns the item, but let a click landing in there still settle an ongoing drop.
		if (target.closest('.ssl-root') !== ref) {
			await interruptDropTransition(e);
			return;
		}

		const isOrResidesInInteractiveElem = isOrResidesInInteractiveElement(target, currItem);
		// Stop non-main buttons from interacting with the list.
		if (e.button !== 0) {
			// Let non-main buttons act normally on interactive elements.
			if (!isOrResidesInInteractiveElem) e.preventDefault();
			return;
		}
		if (
			(isLocked && !isOrResidesInInteractiveElem) ||
			(currItem.dataset.isLocked === 'true' && !isOrResidesInInteractiveElem) ||
			isDisabled ||
			currItem.getAttribute('aria-disabled') === 'true'
		) {
			e.preventDefault();
			return;
		}

		// Prevent default if the clicked/tapped element is a label with a for attribute.
		// NOTE 1: for some reason that is still unknown to me, clicking/tapping a <label> element sets
		// the focus on the current <SortableList.Item>.
		// NOTE 2: We need to run this check before isOrResidesInInteractiveElement() because, if the
		// target is a <label> element, it will stop the execution of this event handler and the
		// preventDefault() right after will never run, but we can’t preventDefault() for every element
		// because we need to allow interactive elements to run normally.
		if (target.tagName.toLowerCase() === 'label' && target.hasAttribute('for')) e.preventDefault();

		// Prevent dragging if the current list item contains an item handle, but we’re not dragging from it.
		const hasHandle = !!getHandle(currItem);
		const isOrResidesInHandle = target.closest('.ssl-handle');
		if (hasHandle && !isOrResidesInHandle && !isOrResidesInInteractiveElem) {
			e.preventDefault();
			return;
		}

		// Prevent dragging if the current list item contains an interactive element
		// and we’re also not dragging from a handle inside that interactive element.
		if (isOrResidesInInteractiveElem && !isOrResidesInHandle) return;
		// Blur the interactive element holding the focus inside the focused item,
		// so it doesn’t receive keystrokes during the pointer drag.
		const { activeElement } = document;
		if (focusedRootState?.focusedItem?.contains(activeElement))
			(activeElement as HTMLElement).blur();
		// Prevent focus from being set on the current <SortableList.Item>.
		e.preventDefault();

		if (focusedRootState?.dragState.startsWith('kbd-drag')) await tick();
		await interruptDropTransition(e);
		if (
			!isIdle ||
			delayTimeoutId !== null ||
			crossList?.isOtherDragActive(rootState) ||
			rootState.isNestedDragActive()
		)
			return;

		currItem.setPointerCapture(e.pointerId);
		pointerId = e.pointerId;

		rootState.pointer = { x: e.clientX, y: e.clientY };
		rootState.pointerOrigin = { x: e.clientX, y: e.clientY };
		scrollOrigin = {
			left: scrollableAncestor?.scrollLeft ?? 0,
			top: scrollableAncestor?.scrollTop ?? 0,
		};
		rootState.scrollOffset = { left: 0, top: 0 };

		if (delay <= 0) await handlePointerDragStart(currItem);
		else {
			pointerSession = startPointerSession(pointerSession);
			const { signal } = pointerSession;
			document.addEventListener('pointermove', handlePointerMoveWithDelay, { signal });
			document.addEventListener('pointerup', cancelDelayedDrag, { signal });
			// Cancel pending delayed drags that end without a `pointerup` (touch interrupted by the browser
			// or the OS, capture lost on iOS when tapping without movement). Not canceling on those would
			// start a drag for a pointer that is already gone and leave the item stuck in `ptr-drag-start`.
			document.addEventListener('pointercancel', cancelDelayedDrag, { signal });
			document.addEventListener('lostpointercapture', cancelDelayedDrag, { signal });
			delayTimeoutId = setTimeout(() => {
				delayTimeoutId = null;
				handlePointerDragStart(currItem);
			}, delay);
		}
	}

	async function handlePointerDragStart(currItem: HTMLLIElement) {
		pointerSession = startPointerSession(pointerSession);
		const { signal } = pointerSession;

		rootState.draggedItem = currItem;
		rootState.itemRects = getItemRects(ref!);
		rootState.fixedOrigin = getFixedOrigin(ref!);
		scrollEventTarget = addScrollListener(scrollableAncestor, handleScroll);

		await tick();
		rootState.dragState = 'ptr-drag-start';
		crossList?.start(rootState, currItem);

		ondragstart?.({
			deviceType: 'pointer',
			sourceList: ref!,
			sourceListId: id,
			sourceListIndex: index,
			draggedItem: currItem,
			draggedItemId: currItem.id,
			draggedItemIndex: getIndex(currItem),
			isWithinBounds: rootState.isWithinBounds,
			canRemoveOnDropOut: canRemoveOnDropOut || false,
		});

		document.addEventListener('pointermove', handlePointerMove, { signal });
		document.addEventListener('pointerup', handlePointerUp, { signal });
		document.addEventListener('pointercancel', handlePointerCancel, { signal });
		// Provide a fallback for the `pointerup` event not firing on Webkit for iOS (tapping an item to
		// start dragging and releasing without movement). It can also fire before `pointerup` in Chromium
		// on macOS, causing valid drops to be canceled. Treating it as a drop instead means a genuine
		// capture loss will drop rather than cancel, but that is preferable to silently broken drops.
		document.addEventListener('lostpointercapture', handlePointerUp, { signal });
	}

	let pointerMoveRafId: number | null = null;
	let lastClientX = 0;
	let lastClientY = 0;
	function handlePointerMove(e: PointerEvent) {
		if (!isActivePointer(e, pointerId)) return;

		if (!isPointerStartingDrag && !isPointerDragging) return;

		lastClientX = e.clientX;
		lastClientY = e.clientY;
		if (pointerMoveRafId) return;

		pointerMoveRafId = requestAnimationFrame(() => {
			if (isPointerStartingDrag) rootState.dragState = 'ptr-drag';

			if (!rootState.draggedItem) return;

			rootState.pointer = { x: lastClientX, y: lastClientY };
			updateTargetItem();

			ondrag?.({
				deviceType: 'pointer',
				sourceList: ref!,
				sourceListId: id,
				sourceListIndex: index,
				draggedItem: rootState.draggedItem,
				draggedItemId: rootState.draggedItem.id,
				draggedItemIndex: getIndex(rootState.draggedItem),
				targetItem: rootState.targetItem,
				targetItemId: rootState.targetItem ? rootState.targetItem.id : null,
				targetItemIndex: rootState.targetItem ? getIndex(rootState.targetItem) : null,
				isWithinBounds: rootState.isWithinBounds,
				canRemoveOnDropOut: canRemoveOnDropOut || false,
				...getPeerTargetFields(crossList, rootState),
			});

			if (autoScroll && scrollableAncestor && canScroll(scrollableAncestor))
				autoScroll.update(scrollableAncestor, lastClientX, lastClientY, isScrollingDocument);

			pointerMoveRafId = null;
		});
	}

	function cancelDelayedDrag(e: PointerEvent) {
		if (delayTimeoutId === null || !isActivePointer(e, pointerId)) return;

		clearTimeout(delayTimeoutId);
		delayTimeoutId = null;
		pointerSession = endPointerSession(pointerSession);
	}

	function handlePointerMoveWithDelay(e: PointerEvent) {
		if (delayTimeoutId === null || !isActivePointer(e, pointerId) || !rootState.pointerOrigin)
			return;

		const { clientX, clientY } = e;

		const THRESHOLD = 10;
		const deltaX = Math.abs(clientX - rootState.pointerOrigin.x);
		const deltaY = Math.abs(clientY - rootState.pointerOrigin.y);

		if (deltaX > THRESHOLD || deltaY > THRESHOLD) cancelDelayedDrag(e);
	}

	function handlePointerUp(e: PointerEvent) {
		if (!isActivePointer(e, pointerId)) return;

		pointerSession = endPointerSession(pointerSession);
		scrollEventTarget = removeScrollListener(scrollEventTarget, handleScroll);
		if (rootState.draggedItem) handlePointerAndKeyboardDrop(rootState.draggedItem, 'ptr-drop');
	}

	function handlePointerCancel(e: PointerEvent) {
		if (!isActivePointer(e, pointerId)) return;

		cancelPointerDrag();
	}

	function cancelPointerDrag() {
		pointerSession = endPointerSession(pointerSession);
		scrollEventTarget = removeScrollListener(scrollEventTarget, handleScroll);
		if (rootState.draggedItem) handlePointerAndKeyboardDrop(rootState.draggedItem, 'ptr-cancel');
	}

	async function handleKeyDown(e: KeyboardEvent, target = e.target as HTMLElement) {
		// Events fired inside a nested list bubble up to this one.
		// Let the list that owns the item handle them.
		if (target.closest('.ssl-root') !== ref) return;

		const { key } = e;
		let step: -1 | 1 = -1;
		let shouldScrollIntoView = false;

		if (target === ref || target === rootState.focusedItem) {
			const isHandledKey =
				key === ' ' ||
				key.startsWith('Arrow') ||
				key === 'Home' ||
				key === 'End' ||
				key === 'Escape';
			if (isHandledKey) {
				await interruptDropTransition(e);

				// Interrupting a peer drop moves the focused item into another list. Hand the key over to that
				// list so it acts on the item’s new position instead of on the place it left behind.
				const { activeElement } = document;
				const focusedPeerList =
					crossList && !ref!.contains(activeElement)
						? crossList.getPeerLists(rootState).find((peer) => peer.ref.contains(activeElement))
						: null;
				if (focusedPeerList) {
					focusedPeerList.state.handleKeyDown?.(e, activeElement as HTMLElement);
					return;
				}
			}

			if (key === ' ') {
				// Prevent default only if the target is a sortable item.
				// This allows interactive elements (like buttons) to operate normally.
				if (!target.classList.contains('ssl-item')) return;
				e.preventDefault();

				if (
					isLocked ||
					target.dataset.isLocked === 'true' ||
					target.getAttribute('aria-disabled') === 'true' ||
					!rootState.focusedItem ||
					e.repeat
				)
					return;

				if (isIdle) {
					if (crossList?.isOtherDragActive(rootState)) return;
					if (rootState.isNestedDragActive()) return;

					rootState.draggedItem = rootState.focusedItem;
					const draggedIndex = getIndex(rootState.focusedItem);
					rootState.itemRects = getItemRects(ref!);
					rootState.fixedOrigin = getFixedOrigin(ref!);
					scrollOrigin = {
						left: scrollableAncestor?.scrollLeft ?? 0,
						top: scrollableAncestor?.scrollTop ?? 0,
					};
					rootState.scrollOffset = { left: 0, top: 0 };
					scrollEventTarget = addScrollListener(scrollableAncestor, handleScroll);

					await tick();
					rootState.dragState = 'kbd-drag-start';
					crossList?.start(rootState, rootState.focusedItem);

					ondragstart?.({
						deviceType: 'keyboard',
						sourceList: ref!,
						sourceListId: id,
						sourceListIndex: index,
						draggedItem: rootState.focusedItem,
						draggedItemId: rootState.focusedItem.id,
						draggedItemIndex: draggedIndex,
						isWithinBounds: rootState.isWithinBounds,
						canRemoveOnDropOut: canRemoveOnDropOut || false,
					});

					liveText = _announcements.lifted({
						sourceList: ref!,
						sourceListIndex: index,
						draggedItem: rootState.draggedItem,
						draggedItemIndex: draggedIndex,
						draggedItemType: rootState.draggedItem?.querySelector('.ssl-root') ? 'list' : 'item',
					});
				} else {
					if (!rootState.draggedItem) return;

					const draggedIndex = getIndex(rootState.draggedItem);
					const targetIndex = rootState.targetItem ? getIndex(rootState.targetItem) : null;
					liveText = _announcements.dropped({
						sourceList: ref!,
						sourceListIndex: index,
						draggedItem: rootState.draggedItem,
						draggedItemIndex: draggedIndex,
						draggedItemType: rootState.draggedItem?.querySelector('.ssl-root') ? 'list' : 'item',
						targetList: crossList?.targetList?.ref ?? null,
						targetListIndex: crossList?.targetList?.index ?? null,
						targetItem: crossList?.targetList?.targetItem ?? rootState.targetItem,
						targetItemIndex: crossList?.targetList?.targetItemIndex ?? targetIndex,
					});

					handlePointerAndKeyboardDrop(rootState.focusedItem, 'kbd-drop');
				}
			}

			if (key === 'ArrowUp' || key === 'ArrowLeft' || key === 'ArrowDown' || key === 'ArrowRight') {
				e.preventDefault();

				step =
					key === 'ArrowUp' ||
					(key === 'ArrowLeft' && !rootState.isRTL) ||
					(key === 'ArrowRight' && rootState.isRTL)
						? -1
						: 1;
				shouldScrollIntoView = true;
				const focusedIndex = rootState.focusedItem ? getIndex(rootState.focusedItem) : null;
				const targetList = crossList?.targetList;

				if (!isKeyboardStartingDragOrDragging) {
					if (
						((key === 'ArrowLeft' || key === 'ArrowRight') && direction === 'vertical') ||
						((key === 'ArrowUp' || key === 'ArrowDown') && direction === 'horizontal')
					) {
						crossList?.focusPeer(rootState, step);
					} else {
						if (!rootState.focusedItem || focusedIndex === null) {
							const firstItem = getItems(ref!)[0];
							firstItem?.focus({ preventScroll: true });
						} else {
							// Prevent focusing the previous item if the current one is the first,
							// and focusing the next item if the current one is the last.
							const items = getItems(ref!);
							if (
								(step === -1 && focusedIndex === 0) ||
								(step === 1 && focusedIndex === items.length - 1)
							)
								return;

							getItemSibling(rootState.focusedItem, step)?.focus({ preventScroll: true });
						}
					}
				} else {
					if (!rootState.draggedItem || !rootState.itemRects) return;

					const draggedIndex = getIndex(rootState.draggedItem);
					let targetIndex = rootState.targetItem ? getIndex(rootState.targetItem) : null;

					if (
						((key === 'ArrowUp' || key === 'ArrowDown') && direction === 'vertical') ||
						((key === 'ArrowLeft' || key === 'ArrowRight') && direction === 'horizontal')
					) {
						if (targetList?.targetItem) {
							const targetListChildren = getItems(targetList.ref, false);
							// Prevent moving the selected item if it’s at the top or bottom of the list.
							if (
								(step === -1 && targetList.targetItemIndex === 0) ||
								(step === 1 && targetList.targetItemIndex === targetListChildren?.length - 1)
							)
								return;

							const targetItemSibling = getItemSibling(targetList.targetItem, step, false);
							crossList!.targetList = { ...targetList, ...getTargetItemFields(targetItemSibling) };
						} else {
							// Prevent moving the selected item if it’s the first or last item,
							// or is at the top or bottom of the list.
							if (
								(step === -1 && draggedIndex === 0 && !rootState.targetItem) ||
								(step === -1 && targetIndex === 0) ||
								(step === 1 &&
									draggedIndex === rootState.itemRects.length - 1 &&
									!rootState.targetItem) ||
								(step === 1 && targetIndex === rootState.itemRects.length - 1)
							)
								return;

							rootState.targetItem = getItemSibling(
								rootState.targetItem || rootState.draggedItem,
								step
							);
						}
					} else if (!crossList?.moveTarget(rootState, step)) return;

					targetIndex = getIndex(rootState.targetItem!);
					rootState.dragState = 'kbd-drag';

					await tick();
					if (!rootState.targetItem) return;

					ondrag?.({
						deviceType: 'keyboard',
						sourceList: ref!,
						sourceListId: id,
						sourceListIndex: index,
						draggedItem: rootState.draggedItem,
						draggedItemId: rootState.draggedItem.id,
						draggedItemIndex: draggedIndex,
						targetItem: rootState.targetItem,
						targetItemId: rootState.targetItem.id,
						targetItemIndex: targetIndex,
						isWithinBounds: rootState.isWithinBounds,
						canRemoveOnDropOut: canRemoveOnDropOut || false,
						...getPeerTargetFields(crossList, rootState),
					});

					liveText = _announcements.dragged({
						sourceList: ref!,
						sourceListIndex: index,
						draggedItem: rootState.draggedItem,
						draggedItemIndex: draggedIndex,
						draggedItemType: rootState.draggedItem?.querySelector('.ssl-root') ? 'list' : 'item',
						targetList: crossList?.targetList?.ref,
						targetListIndex: crossList?.targetList?.index,
						targetItem: crossList?.targetList?.targetItem ?? rootState.targetItem,
						targetItemIndex: crossList?.targetList?.targetItemIndex ?? targetIndex,
					});
				}
			}

			if (key === 'Home' || key === 'End') {
				e.preventDefault();

				step = key === 'Home' ? -1 : 1;
				shouldScrollIntoView = true;
				const items = getItems(ref!);
				const focusedIndex = (rootState.focusedItem && getIndex(rootState.focusedItem)) ?? null;

				if (!isKeyboardStartingDragOrDragging) {
					// Prevent focusing the previous item if the current one is the first,
					// and focusing the next item if the current one is the last.
					if (
						(key === 'Home' && focusedIndex === 0) ||
						(key === 'End' && focusedIndex === items.length - 1)
					)
						return;

					if (key === 'Home') items[0]?.focus({ preventScroll: true });
					else items[items.length - 1]?.focus({ preventScroll: true });
				} else {
					if (!rootState.draggedItem || !rootState.itemRects) return;

					const targetList = crossList?.targetList;
					const draggedIndex = getIndex(rootState.draggedItem);
					let targetIndex = rootState.targetItem ? getIndex(rootState.targetItem) : null;

					if (targetList?.targetItem) {
						const targetListChildren = getItems(targetList.ref, false);
						// Prevent moving the selected item if it’s at the top or bottom of the list.
						if (
							(step === -1 && targetList.targetItemIndex === 0) ||
							(step === 1 && targetList.targetItemIndex === targetListChildren?.length - 1)
						)
							return;

						const peerTargetItem =
							key === 'Home'
								? targetListChildren[0]
								: targetListChildren[targetListChildren.length - 1];
						crossList!.targetList = { ...targetList, ...getTargetItemFields(peerTargetItem) };
					} else {
						// Prevent moving the selected item if it’s the first or last item,
						// or is at the top or bottom of the list.
						if (
							(key === 'Home' && draggedIndex === 0 && !rootState.targetItem) ||
							(key === 'Home' && targetIndex === 0) ||
							(key === 'End' &&
								draggedIndex === rootState.itemRects.length - 1 &&
								!rootState.targetItem) ||
							(key === 'End' && targetIndex === rootState.itemRects.length - 1)
						)
							return;

						rootState.targetItem = key === 'Home' ? items[0] : items[items.length - 1];
					}

					targetIndex = getIndex(rootState.targetItem!);
					rootState.dragState = 'kbd-drag';

					await tick();
					ondrag?.({
						deviceType: 'keyboard',
						sourceList: ref!,
						sourceListId: id,
						sourceListIndex: index,
						draggedItem: rootState.draggedItem,
						draggedItemId: rootState.draggedItem.id,
						draggedItemIndex: draggedIndex,
						targetItem: rootState.targetItem,
						targetItemId: rootState.targetItem!.id,
						targetItemIndex: targetIndex,
						isWithinBounds: rootState.isWithinBounds,
						canRemoveOnDropOut: canRemoveOnDropOut || false,
						...getPeerTargetFields(crossList, rootState),
					});

					liveText = _announcements.dragged({
						sourceList: ref!,
						sourceListIndex: index,
						draggedItem: rootState.draggedItem,
						draggedItemIndex: draggedIndex,
						draggedItemType: rootState.draggedItem?.querySelector('.ssl-root') ? 'list' : 'item',
						targetList: crossList?.targetList?.ref,
						targetListIndex: crossList?.targetList?.index,
						targetItem: crossList?.targetList?.targetItem ?? rootState.targetItem!,
						targetItemIndex: crossList?.targetList?.targetItemIndex ?? targetIndex,
					});
				}
			}

			if (key === 'Escape' && rootState.draggedItem) {
				// Prevent closing the <dialog> if the dragged item is inside one.
				if (ref!.closest<HTMLDialogElement>('dialog')) e.preventDefault();

				// If the list is focused and Escape is pressed during a pointer drag,
				// ensure no pointer session is left alive.
				if (isPointerDrag) {
					cancelPointerDrag();
					return;
				}

				shouldScrollIntoView = true;

				const draggedIndex = getIndex(rootState.draggedItem);
				liveText = _announcements.canceled({
					sourceList: ref!,
					sourceListIndex: index,
					draggedItem: rootState.draggedItem,
					draggedItemIndex: draggedIndex,
					draggedItemType: rootState.draggedItem?.querySelector('.ssl-root') ? 'list' : 'item',
				});

				handlePointerAndKeyboardDrop(rootState.draggedItem, 'kbd-cancel');
			}

			if (!shouldScrollIntoView) return;

			await tick();
			const scrollTarget = !isKeyboardDragging
				? rootState.focusedItem
				: crossList?.targetList
					? crossList.targetList.targetItem
					: rootState.targetItem;

			if (scrollTarget && scrollableAncestor && !isFullyVisible(scrollTarget, scrollableAncestor))
				scrollIntoView(
					scrollTarget,
					scrollableAncestor,
					direction,
					step,
					isScrollingDocument,
					autoScroll?.margin
				);
		}
	}

	async function handlePointerAndKeyboardDrop(
		element: HTMLElement,
		action: 'ptr-drop' | 'ptr-cancel' | 'kbd-drop' | 'kbd-cancel'
	) {
		if (!rootState.draggedItem || isDropping) return;

		isDropping = true;
		autoScroll?.stop();
		if (pointerMoveRafId) {
			cancelAnimationFrame(pointerMoveRafId);
			pointerMoveRafId = null; // Required on mobile when transition duration is `0ms` and `rafId` is not cleared during `pointermove`.
		}
		if (scrollRafId) {
			cancelAnimationFrame(scrollRafId);
			scrollRafId = null;
		}

		if (action === 'ptr-drop') {
			if (!rootState.isWithinBounds && canRemoveOnDropOut) rootState.targetItem = null;
			await tick();
			rootState.dragState =
				!rootState.isWithinBounds && canRemoveOnDropOut
					? 'ptr-remove'
					: _transition.duration > 0
						? 'ptr-predrop'
						: 'ptr-drop';
			if (isPointerPredropping) {
				// Wait until the CSS transform in <SortableListItem> that
				// depends on `ptr-predrop` has been set before continuing.
				afterPaint(_transition.duration, async () => {
					await tick();
					rootState.dragState = 'ptr-drop';
				});
			}
		} else if (action === 'ptr-cancel') {
			// Release the peer list so the dragged item returns to its list.
			if (crossList) crossList.targetList = null;
			await tick();
			rootState.targetItem = rootState.draggedItem;
			rootState.isWithinBounds = true;
			rootState.dragState = 'ptr-cancel';
		}

		if (action === 'kbd-drop') {
			await tick();
			rootState.dragState = 'kbd-drop';
		} else if (action === 'kbd-cancel') {
			// Release the peer list so the dragged item returns to its list.
			if (crossList) crossList.targetList = null;
			await tick();
			rootState.targetItem = rootState.draggedItem;
			rootState.dragState = 'kbd-cancel';
		}

		const draggedIndex = getIndex(rootState.draggedItem);
		const targetIndex = rootState.targetItem ? getIndex(rootState.targetItem) : null;

		if (action === 'ptr-drop') {
			// Ensure finalizePointerAndKeyboardDrop() runs in the
			// same frame as the `ptr-drop` state changes above.
			afterPaint(_transition.duration, () =>
				finalizePointerAndKeyboardDrop(element, action, draggedIndex, targetIndex)
			);
		} else {
			finalizePointerAndKeyboardDrop(element, action, draggedIndex, targetIndex);
		}
	}

	function finalizePointerAndKeyboardDrop(
		element: HTMLElement,
		action: 'ptr-drop' | 'ptr-cancel' | 'kbd-drop' | 'kbd-cancel',
		draggedIndex: number,
		targetIndex: number | null
	) {
		if (isDestroyed) return;

		ondrop?.({
			deviceType: action.startsWith('ptr') ? 'pointer' : 'keyboard',
			sourceList: ref!,
			sourceListId: id,
			sourceListIndex: index,
			draggedItem: rootState.draggedItem!,
			draggedItemId: rootState.draggedItem!.id,
			draggedItemIndex: draggedIndex,
			targetItem: rootState.targetItem,
			targetItemId: rootState.targetItem ? rootState.targetItem.id : null,
			targetItemIndex: targetIndex,
			isWithinBounds: rootState.isWithinBounds,
			canRemoveOnDropOut: canRemoveOnDropOut || false,
			isCanceled: action.endsWith('cancel'),
			...getPeerTargetFields(crossList, rootState),
		});

		const dropDuration = Math.max(
			_transition.duration,
			crossList?.targetList?.state.props.transition?.duration ?? 0
		);

		if (dropDuration > 0) {
			let isResolved = false;
			function finalizeDrop(shouldHandleDragEnd = true) {
				if (isResolved) return;

				isResolved = true;
				rootState.interruptDropTransition = null;
				if (transitionTimeoutId) {
					clearTimeout(transitionTimeoutId);
					transitionTimeoutId = null;
				}

				if (shouldHandleDragEnd) handlePointerAndKeyboardDragEnd(action);
			}

			rootState.interruptDropTransition = async () => {
				// Prevent the pending timeout from triggering `handlePointerAndKeyboardDragEnd()`,
				// then settle the drop right away.
				finalizeDrop(false);
				getDropAnimations(element, ref!, crossList).forEach((animation) => animation.finish());
				await handlePointerAndKeyboardDragEnd(action);
			};

			function startDropTimer() {
				if (isResolved) return;
				const TRANSITION_END_BUFFER = 32; // ~2 frames
				transitionTimeoutId = setTimeout(finalizeDrop, dropDuration + TRANSITION_END_BUFFER);
			}

			if (action === 'ptr-drop' && _transition.duration > 0) startDropTimer();
			else afterPaint(dropDuration, startDropTimer);
		} else {
			handlePointerAndKeyboardDragEnd(action);
		}
	}

	async function handlePointerAndKeyboardDragEnd(
		action: 'ptr-drop' | 'ptr-cancel' | 'kbd-drop' | 'kbd-cancel'
	) {
		isDropping = false;
		pointerSession = endPointerSession(pointerSession);

		if (isDestroyed || !rootState.draggedItem) return;

		scrollEventTarget = removeScrollListener(scrollEventTarget, handleScroll);
		if (scrollRafId) {
			cancelAnimationFrame(scrollRafId);
			scrollRafId = null;
		}

		const draggedItem = rootState.draggedItem;
		const targetItem = rootState.targetItem;
		const peerTargetFields = getPeerTargetFields(crossList, rootState);

		// Svelte does not retain focus when elements are moved (even when keyed), so we’ll store the
		// focused element inside the list before `ondragend` lets the consumer sort the items.
		// https://github.com/sveltejs/svelte/issues/3973
		const { activeElement } = document;
		const focusedElement = ref!.contains(activeElement) ? activeElement : null;

		// Return their transitions back to the items that shifted out of sight.
		rootState.visibleRange = null;
		crossList?.end(rootState, action.endsWith('cancel'));
		rootState.dragState = 'idle';
		removeFixedOriginProbe(ref!);

		ondragend?.({
			deviceType: action.startsWith('ptr') ? 'pointer' : 'keyboard',
			sourceList: ref!,
			sourceListId: id,
			sourceListIndex: index,
			draggedItem,
			draggedItemId: draggedItem.id,
			draggedItemIndex: getIndex(draggedItem),
			targetItem,
			targetItemId: targetItem ? targetItem.id : null,
			targetItemIndex: targetItem ? getIndex(targetItem) : null,
			isWithinBounds: rootState.isWithinBounds,
			canRemoveOnDropOut: canRemoveOnDropOut || false,
			isCanceled: action.endsWith('cancel'),
			...peerTargetFields,
		});

		if (typeof pointerId === 'number' && draggedItem?.hasPointerCapture(pointerId))
			draggedItem?.releasePointerCapture(pointerId);
		pointerId = null;
		rootState.pointer = null;
		rootState.pointerOrigin = null;
		rootState.draggedItem = null;
		rootState.targetItem = null;
		rootState.itemRects = null;
		rootState.isWithinBounds = true;

		// Wait for the sorted items to be updated before restoring focus.
		await tick();
		restoreFocus(focusedElement, crossList?.crossingItemId ?? null);
	}

	// Interrupt any ongoing drop transition so the user can immediately start a new drag,
	// regardless of whether it’s finishing a pointer or a keyboard interaction.
	async function interruptDropTransition(e: PointerEvent | KeyboardEvent) {
		const droppingRootState = rootState.interruptDropTransition
			? rootState
			: crossList?.getPeerLists(rootState).find((peer) => peer.state.interruptDropTransition)
					?.state;
		if (!droppingRootState?.interruptDropTransition) return;

		e.preventDefault();
		// Wait for the interrupted drop to fully end: `ondragend` lets the consumer re-sort its items and
		// focus is restored on the moved item, so `getItemRects()` and `document.activeElement` are reliable.
		await droppingRootState.interruptDropTransition();
	}

	// `focusout` is preferred over `blur` since it detects the loss of focus
	// on the current element and it’s descendants too.
	async function handleFocusOut(e: FocusEvent) {
		const relatedTarget = e.relatedTarget as HTMLElement | null;
		if (relatedTarget?.closest('.ssl-root') !== rootState.ref || rootState.ref === relatedTarget) {
			await tick();
			const { activeElement } = document;
			if (activeElement !== rootState.ref && activeElement?.closest('.ssl-root') === rootState.ref)
				return;
			liveText = '';
		}
	}

	function handleContextMenu(e: MouseEvent) {
		if (!isIdle) {
			e.preventDefault();
		}
	}
</script>

<!-- The roving tabindex is the keyboard drag model, and it stays in place for `role="list"` too. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<ul
	bind:this={ref}
	{id}
	class={classes}
	style:--ssl-gap="{gap}px"
	style:--ssl-wrap={hasWrapping ? 'wrap' : 'nowrap'}
	style:--ssl-transition-duration="{_transition.duration}ms"
	style:--ssl-transition-easing={_transition.easing}
	data-list-id={id}
	data-list-index={index}
	data-drag-state={rootState.dragState}
	data-has-locked-axis={hasLockedAxis}
	data-has-bounds={hasBounds}
	data-can-clear-on-drag-out={canClearOnDragOut}
	data-can-remove-on-drop-out={canRemoveOnDropOut}
	data-is-group-dragging={crossList
		? group === crossList.sourceList?.group && crossList.sourceList?.state.dragState !== 'idle'
		: undefined}
	data-is-source={group ? rootState.isSource : undefined}
	data-is-target={group ? rootState.isTarget : undefined}
	data-is-nested={isNested}
	data-is-locked={isLocked}
	data-is-disabled={isDisabled}
	tabindex={tabIndex}
	role={hasNestedLists ? 'list' : 'listbox'}
	aria-orientation={direction}
	aria-disabled={isDisabled}
	aria-label={restProps['aria-label'] || undefined}
	aria-labelledby={restProps['aria-labelledby'] || undefined}
	aria-description={!restProps['aria-describedby']
		? restProps['aria-description'] || getDefaultAriaDescription(group, direction, hasNestedLists)
		: undefined}
	aria-describedby={restProps['aria-describedby'] || undefined}
	aria-activedescendant={!hasNestedLists && rootState.focusedItem
		? rootState.focusedItem.id
		: undefined}
	onpointerdown={handlePointerDown}
	onkeydown={handleKeyDown}
	onfocusout={handleFocusOut}
	oncontextmenu={handleContextMenu}
	onitemfocusout={(event) => {
		if (event.detail.item.closest('.ssl-root') !== ref) return;
		if (isKeyboardDrag) handlePointerAndKeyboardDrop(event.detail.item, 'kbd-cancel');
	}}
>
	{#if children}
		{@render children()}
		{#if rootState.isTarget && crossList?.sourceList?.draggedItemId}
			<SortableListPlaceholder
				id={crossList.sourceList.draggedItemId}
				index={getItems(ref).length ?? 0}
			/>
		{/if}
	{:else}
		<p>
			To display your list, put a few <code>&lt;SortableList.Item&gt;</code> inside your
			<code>&lt;SortableList.Root&gt;</code>.
		</p>
	{/if}
</ul>
<div class="ssl-live-region" aria-live="assertive" aria-atomic="true">{liveText}</div>

<style>
	.ssl-root,
	.ssl-root :global(*) {
		box-sizing: border-box;
	}

	.ssl-root {
		display: flex;
		flex-wrap: var(--ssl-wrap);
		/* WCAG 2.5.5 minimum touch target size. */
		min-height: var(--ssl-min-height, 44px);
		padding-inline-start: 0;
		margin: calc(var(--ssl-gap) / 2 * -1);

		/* Prevent touch gestures during a pointer drag. */
		&[data-drag-state*='ptr'] {
			touch-action: none;
		}

		&[aria-orientation='vertical'] {
			flex-direction: column;

			&[data-can-remove-on-drop-out='true']
				> :global(.ssl-item[data-drag-state*='ptr'][data-is-within-bounds='false']) {
				margin: 0 calc(var(--ssl-gap) / 2);
			}
		}

		&[aria-orientation='horizontal'] {
			flex-direction: row;

			&[data-can-remove-on-drop-out='true'] > :global(.ssl-item[data-is-within-bounds='false']) {
				margin: calc(var(--ssl-gap) / 2) 0;
			}
		}
	}

	.ssl-live-region {
		position: absolute;
		left: 0px;
		top: 0px;
		clip: rect(0px, 0px, 0px, 0px);
		clip-path: inset(50%);
		overflow: hidden;
		white-space: nowrap;
		width: 1px;
		height: 1px;
	}
</style>
