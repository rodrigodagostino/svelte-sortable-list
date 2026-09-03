<!--
@component
## <SortableList.Root>
Serves as the primary container. Provides the main structure, the drag-and-drop interactions and emits the available events.

### Props
- `ref`: reference to the list element (HTMLUListElement). `[$bindable]`
- `group`: group this list belongs to.
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
- `isLocked`: if `true`, allows items to be focused, but prevents them from being dragged. Interactive elements inside will operate normally.
- `isDisabled`: if `true`, allows items to be focused, but prevents them from being dragged and change its appearance to dimmed. Interactive elements inside will be disabled.
- `announcements`: announcements to be read out by the screen reader during drag and drop operations.

### Events
- `onmounted`: the component is mounted.
- `ondragstart`: an item starts to be dragged by a pointer device or a keyboard.
- `ondrag`: a dragged item is moved around by a pointer device or a keyboard (fires every few hundred milliseconds).
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
	import { registry, setSortableListRootState } from '$lib/states/index.js';
	import type { RegistryList, SortableListRootProps as RootProps } from '$lib/types/index.js';
	import {
		afterPaint,
		announce,
		areColliding,
		canScroll,
		canScrollX,
		canScrollY,
		getClosestItemRect,
		getClosestScrollableAncestor,
		getCollidingItemRect,
		getDefaultAriaDescription,
		getDropAnimations,
		getIndex,
		getItemRect,
		getItemRects,
		getItemRectWithOffset,
		getItemSibling,
		getPeerTargetFields,
		getScrollingSpeed,
		getTextDirection,
		isFullyVisible,
		isOrResidesInInteractiveElement,
		isRootElement,
		scrollIntoView,
		shouldAutoScroll,
	} from '$lib/utils/index.js';

	let {
		ref = $bindable(null),
		group = undefined,
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
	const _announcements = $derived(announcements || announce);

	$effect(() => {
		rootState.props = {
			ref,
			gap,
			id,
			index,
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

	const classes = $derived(['ssl-root', restProps.class]);
	let pointerId: PointerEvent['pointerId'] | null = null;
	let isPointerReleased = false;
	let delayTimeoutId: ReturnType<typeof setTimeout> | null = null;
	let transitionTimeoutId: ReturnType<typeof setTimeout> | null = null;
	let liveText = $state('');

	let registryEntry: RegistryList | null = null;
	onMount(() => {
		if (group) {
			registryEntry = { group, ref: ref!, state: rootState, id: id ?? null, index: index ?? null };
			unregister = registry.register(registryEntry);
		}
		onmounted?.(null);
		rootState.isRTL = getTextDirection(ref!) === 'rtl';
	});

	let unregister: (() => void) | null = null;
	onDestroy(() => {
		unregister?.();
		ondestroyed?.(null);
	});

	// Svelte currently does not retain focus when elements are moved (even when keyed),
	// so we need to manually keep focus on the selected <SortableList.Item> as items are sorted.
	// https://github.com/sveltejs/svelte/issues/3973
	let activeElement: HTMLLIElement | null = $derived(rootState.focusedItem);
	$effect(() => {
		if (rootState.dragState !== 'idle') return;

		untrack(() => {
			if (activeElement && activeElement !== document.activeElement) {
				const crossingItem = registry.crossingItemId
					? document.querySelector<HTMLLIElement>(
							`.ssl-item[data-item-id="${registry.crossingItemId}"]`
						)
					: null;
				(crossingItem || activeElement).focus({ preventScroll: true });
			}
		});
	});

	let scrollableAncestor = $derived(ref ? getClosestScrollableAncestor(ref) : undefined);
	let scrollOrigin = { left: 0, top: 0 };
	let scrollSpeed = $state({ x: 0, y: 0 });
	let isScrollingDocument = $derived(
		scrollableAncestor ? isRootElement(scrollableAncestor, direction) : false
	);
	let isAutoScrolling = false;

	$effect(() => {
		if ((scrollSpeed.x !== 0 || scrollSpeed.y !== 0) && !isAutoScrolling) untrack(() => scroll());
	});

	function updateScrollOffset() {
		if (!scrollableAncestor) return;

		const left = scrollableAncestor.scrollLeft - scrollOrigin.left;
		const top = scrollableAncestor.scrollTop - scrollOrigin.top;
		if (left === rootState.scrollOffset.left && top === rootState.scrollOffset.top) return;

		rootState.scrollOffset = { left, top };
	}

	function updateTargetItem() {
		if (!rootState.itemRects || !ref || !rootState.draggedItem) return;

		const draggedRect = rootState.draggedItem.getBoundingClientRect();
		const rootRect = ref.getBoundingClientRect();
		rootState.isWithinBounds = areColliding(draggedRect, rootRect);
		updateScrollOffset();

		// Offset the dragged rect by the current scroll.
		const draggedRectWithOffset = getItemRectWithOffset(draggedRect, rootState.scrollOffset);
		const collidingItemRect = getCollidingItemRect(draggedRectWithOffset, rootState.itemRects);
		if (collidingItemRect) {
			rootState.targetItem = ref.querySelector<HTMLLIElement>(
				`.ssl-item[data-item-id="${collidingItemRect.id}"]`
			);
			if (group) registry.targetList = null;
			return;
		} else if (canClearOnDragOut && !rootState.isWithinBounds)
			rootState.targetItem = rootState.draggedItem;

		if (group) {
			const peer = registry
				.getPeers(group, rootState)
				.find((p) => areColliding(draggedRect, p.ref.getBoundingClientRect()));

			if (peer) {
				// Dragging over a peer list counts as being between bounds.
				rootState.isWithinBounds = true;

				const peerItemRects = getItemRects(peer.ref);
				const peerCollidingItemRect = getCollidingItemRect(draggedRect, peerItemRects);
				if (peerCollidingItemRect) {
					if (
						registry.targetList?.state !== peer.state ||
						registry.targetList.targetItemId !== peerCollidingItemRect.id
					) {
						registry.targetList = {
							...peer,
							targetItem:
								peer.ref.querySelector<HTMLLIElement>(
									`.ssl-item[data-item-id="${peerCollidingItemRect.id}"]`
								) ?? null,
							targetItemId: peerCollidingItemRect?.id ?? null,
							targetItemIndex: peerCollidingItemRect?.index ?? null,
						};
					}
					return;
				}

				// If the peer list is empty, place the dragged item in its first position.
				if (!peerItemRects.length) {
					if (registry.targetList?.state !== peer.state) {
						registry.targetList = {
							...peer,
							targetItem: null,
							targetItemId: null,
							targetItemIndex: 0,
						};

						// Wait until `targetList` is set and the placeholder element
						// is appended before setting `targetItem`.
						tick().then(() => {
							if (!registry.targetList) return;
							registry.targetList = {
								...registry.targetList,
								targetItem: peer.ref.querySelector<HTMLLIElement>('.ssl-placeholder'),
							};
						});
					}
					return;
				}

				// Use the placeholder to let the dragged item be dropped at the end of the peer list.
				const peerPlaceholder = peer.ref.querySelector<HTMLLIElement>('.ssl-placeholder');
				if (
					peerPlaceholder &&
					registry.targetList?.targetItemIndex !== peerItemRects.length &&
					getCollidingItemRect(draggedRect, [getItemRect(peerPlaceholder)])
				) {
					registry.targetList = {
						...peer,
						targetItem: peerPlaceholder,
						targetItemId: null,
						targetItemIndex: peerItemRects.length,
					};
				}
				return;
			}

			if (canClearOnDragOut || (canRemoveOnDropOut && !rootState.isWithinBounds))
				registry.targetList = null;
		}
	}

	function scroll() {
		if (!scrollableAncestor) return;

		isAutoScrolling = true;
		requestAnimationFrame(() => {
			if (
				isPointerReleased ||
				(!shouldAutoScroll(scrollableAncestor, 'horizontal', scrollSpeed.x) &&
					!shouldAutoScroll(scrollableAncestor, 'vertical', scrollSpeed.y))
			) {
				isAutoScrolling = false;
				return;
			}

			scrollableAncestor.scrollBy(scrollSpeed.x, scrollSpeed.y);

			if (scrollSpeed.x !== 0 || scrollSpeed.y !== 0) scroll();
			else isAutoScrolling = false;
		});
	}

	function autoScroll(clientX: PointerEvent['clientX'], clientY: PointerEvent['clientY']) {
		if (!scrollableAncestor) return;

		scrollSpeed = {
			x: canScrollX(scrollableAncestor)
				? getScrollingSpeed(scrollableAncestor, clientX, clientY, 'horizontal', isScrollingDocument)
				: 0,
			y: canScrollY(scrollableAncestor)
				? getScrollingSpeed(scrollableAncestor, clientX, clientY, 'vertical', isScrollingDocument)
				: 0,
		};
	}

	let scrollRafId: number | null = null;
	let scrollEventTarget: Document | HTMLElement | null = null;
	function handleScroll() {
		if (!rootState.dragState.startsWith('ptr')) {
			updateScrollOffset();
			return;
		}

		if (scrollRafId) return;

		scrollRafId = requestAnimationFrame(() => {
			updateTargetItem();
			scrollRafId = null;
		});
	}

	async function handlePointerDown(e: PointerEvent) {
		if (e.button !== 0) {
			e.preventDefault();
			return;
		}

		await interruptDropTransition(e);

		if (rootState.dragState !== 'idle') {
			e.preventDefault();
			return;
		}

		isPointerReleased = false;

		const target = e.target as HTMLElement;
		const currItem = target.closest<HTMLLIElement>('.ssl-item');
		if (!currItem) return;

		const isOrResidesInInteractiveElem = isOrResidesInInteractiveElement(target, currItem);
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
		const hasItemHandle = !!currItem.querySelector('.ssl-item-handle');
		const isOrResidesInItemHandle = target.closest('.ssl-item-handle');
		if (hasItemHandle && !isOrResidesInItemHandle && !isOrResidesInInteractiveElem) {
			e.preventDefault();
			return;
		}

		// Prevent dragging if the current list item contains an interactive element
		// and we’re also not dragging from a handle inside that interactive element.
		if (isOrResidesInInteractiveElem && !isOrResidesInItemHandle) return;
		// Prevent focus from being set on the current <SortableList.Item>.
		e.preventDefault();

		currItem.setPointerCapture(e.pointerId);
		pointerId = e.pointerId;

		rootState.pointer = { x: e.clientX, y: e.clientY };
		rootState.pointerOrigin = { x: e.clientX, y: e.clientY };
		rootState.draggedItem = currItem;
		rootState.itemRects = getItemRects(ref!);
		scrollOrigin = {
			left: scrollableAncestor?.scrollLeft ?? 0,
			top: scrollableAncestor?.scrollTop ?? 0,
		};
		rootState.scrollOffset = { left: 0, top: 0 };

		if (delay <= 0) await handlePointerDragStart(currItem);
		else {
			document.addEventListener('pointermove', handlePointerMoveWithDelay);
			delayTimeoutId = setTimeout(async () => await handlePointerDragStart(currItem), delay);
		}
	}

	async function handlePointerDragStart(currItem: HTMLLIElement) {
		document.removeEventListener('pointermove', handlePointerMoveWithDelay);

		await tick();
		rootState.dragState = 'ptr-drag-start';
		if (group && rootState.itemRects) {
			registry.sourceList = {
				group,
				ref: ref!,
				state: rootState,
				id: id ?? null,
				index: index ?? null,
				draggedItem: currItem,
				draggedItemId: currItem.id,
				draggedItemIndex: getIndex(currItem),
			};
		}

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

		document.addEventListener('pointermove', handlePointerMove);
		if (scrollableAncestor && canScroll(scrollableAncestor)) {
			// The document’s scrolling element doesn’t reliably receive its own
			// `scroll` events, so `document` is the target used for that case.
			scrollEventTarget = isScrollingDocument ? document : scrollableAncestor;
			scrollEventTarget.addEventListener('scroll', handleScroll, { passive: true });
		}
		document.addEventListener(
			'pointerup',
			() => {
				document.removeEventListener('pointermove', handlePointerMove);
				scrollEventTarget?.removeEventListener('scroll', handleScroll);
				scrollEventTarget = null;
				handlePointerUp();
			},
			{ once: true }
		);
		document.addEventListener(
			'pointercancel',
			() => {
				document.removeEventListener('pointermove', handlePointerMove);
				scrollEventTarget?.removeEventListener('scroll', handleScroll);
				scrollEventTarget = null;
				handlePointerCancel();
			},
			{ once: true }
		);
		// Provide a fallback for the pointerup event not firing on Webkit for iOS.
		// This occurs when tapping an item to start dragging and releasing without movement.
		document.addEventListener(
			'lostpointercapture',
			() => {
				document.removeEventListener('pointermove', handlePointerMove);
				scrollEventTarget?.removeEventListener('scroll', handleScroll);
				scrollEventTarget = null;
				// lostpointercapture can fire before pointerup in Chromium on macOS, causing valid
				// drops to be canceled. Treating it as a drop instead means a genuine capture loss
				// will drop rather than cancel, but that is preferable to silently broken drops.
				if (!isPointerReleased) handlePointerUp();
			},
			{ once: true }
		);
	}

	let rafId: number | null = null;
	function handlePointerMove({ clientX, clientY }: PointerEvent) {
		if (rafId) return;

		if (rootState.dragState !== 'ptr-drag-start' && rootState.dragState !== 'ptr-drag') {
			rafId = null;
			return;
		}

		rafId = requestAnimationFrame(() => {
			if (rootState.dragState === 'ptr-drag-start') rootState.dragState = 'ptr-drag';

			if (!rootState.draggedItem) return;

			rootState.pointer = { x: clientX, y: clientY };
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
				...getPeerTargetFields(registry, group, rootState),
			});

			if (canScroll(scrollableAncestor)) autoScroll(clientX, clientY);

			rafId = null;
		});
	}

	function handlePointerMoveWithDelay({ clientX, clientY }: PointerEvent) {
		if (delayTimeoutId !== null && rootState.pointerOrigin) {
			const threshold = 10;
			const deltaX = Math.abs(clientX - rootState.pointerOrigin.x);
			const deltaY = Math.abs(clientY - rootState.pointerOrigin.y);

			if ((deltaX > threshold || deltaY > threshold) && delayTimeoutId) {
				clearTimeout(delayTimeoutId);
				delayTimeoutId = null;
			}
		}
	}

	function handlePointerUp() {
		if (rootState.draggedItem) handlePointerAndKeyboardDrop(rootState.draggedItem, 'ptr-drop');
	}

	function handlePointerCancel() {
		if (rootState.draggedItem) handlePointerAndKeyboardDrop(rootState.draggedItem, 'ptr-cancel');
	}

	async function handleKeyDown(e: KeyboardEvent) {
		await interruptDropTransition(e);

		const { key } = e;
		const target = e.target as HTMLElement;
		let step: -1 | 1 = -1;
		let shouldScrollIntoView = false;

		if (target === ref || target === rootState.focusedItem) {
			if (key === ' ') {
				// Prevent default only if the target is a sortable item.
				// This allows interactive elements (like buttons) to operate normally.
				if (
					!target.classList.contains('ssl-item') ||
					isLocked ||
					target.dataset.isLocked === 'true'
				)
					return;
				else e.preventDefault();

				if (!rootState.focusedItem || target.getAttribute('aria-disabled') === 'true') return;

				if (rootState.dragState === 'idle') {
					rootState.draggedItem = rootState.focusedItem;
					const draggedIndex = getIndex(rootState.focusedItem);
					rootState.itemRects = getItemRects(ref!);
					scrollOrigin = {
						left: scrollableAncestor?.scrollLeft ?? 0,
						top: scrollableAncestor?.scrollTop ?? 0,
					};
					rootState.scrollOffset = { left: 0, top: 0 };
					if (scrollableAncestor && canScroll(scrollableAncestor)) {
						// The document’s scrolling element doesn’t reliably receive its own
						// `scroll` events, so `document` is the target used for that case.
						scrollEventTarget = isScrollingDocument ? document : scrollableAncestor;
						scrollEventTarget.addEventListener('scroll', handleScroll, { passive: true });
					}

					await tick();
					rootState.dragState = 'kbd-drag-start';
					if (group && rootState.itemRects) {
						registry.sourceList = {
							group,
							ref: ref!,
							state: rootState,
							id: id ?? null,
							index: index ?? null,
							draggedItem: rootState.focusedItem,
							draggedItemId: rootState.focusedItem.id,
							draggedItemIndex: draggedIndex,
						};
					}

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
						targetList: registry.targetList?.ref ?? null,
						targetListIndex: registry.targetList?.index ?? null,
						targetItem: registry.targetList?.targetItem
							? registry.targetList.targetItem
							: rootState.targetItem,
						targetItemIndex:
							typeof registry.targetList?.targetItemIndex === 'number'
								? registry.targetList.targetItemIndex
								: targetIndex,
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
				const { lists, sourceList, targetList } = registry;

				if (!rootState.dragState.startsWith('kbd-drag')) {
					if (
						((key === 'ArrowLeft' || key === 'ArrowRight') && direction === 'vertical') ||
						((key === 'ArrowUp' || key === 'ArrowDown') && direction === 'horizontal')
					) {
						if (!group || !rootState.focusedItem) return;

						// Prevent switching focus if the focused item is located at the first or last list.
						if ((step === -1 && index === 0) || (step === 1 && index === lists.length - 1)) return;

						const nextIndex = index! + step;
						const peer = registry.getPeers(group, rootState).find((p) => p.index === nextIndex);

						if (peer) {
							const closestRect = getClosestItemRect(
								rootState.focusedItem.getBoundingClientRect(),
								getItemRects(peer.ref)
							);
							const peerTargetItem =
								closestRect &&
								peer.ref.querySelector<HTMLLIElement>(
									`.ssl-item[data-item-id="${closestRect.id}"]`
								);
							peerTargetItem?.focus({ preventScroll: true });
						}
					} else {
						if (!rootState.focusedItem || focusedIndex === null) {
							const firstItem = ref!.querySelector<HTMLLIElement>('.ssl-item');
							firstItem?.focus({ preventScroll: true });
						} else {
							// Prevent focusing the previous item if the current one is the first,
							// and focusing the next item if the current one is the last.
							const items = ref!.querySelectorAll<HTMLLIElement>('.ssl-item');
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
							const targetListChildren = targetList.ref.querySelectorAll<HTMLLIElement>(
								'.ssl-item, .ssl-placeholder'
							);
							// Prevent moving the selected item if it’s at the top or bottom of the list.
							if (
								(step === -1 && targetList.targetItemIndex === 0) ||
								(step === 1 && targetList.targetItemIndex === targetListChildren?.length - 1)
							)
								return;

							const targetItemSibling = getItemSibling(targetList.targetItem, step, false);
							registry.targetList = {
								...targetList,
								targetItem: targetItemSibling,
								targetItemId: targetItemSibling?.classList.contains('ssl-placeholder')
									? null
									: (targetItemSibling?.id ?? null),
								targetItemIndex: targetItemSibling ? getIndex(targetItemSibling) : null,
							};
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
					} else {
						if (!group) return;

						if (
							(step === -1 && sourceList?.index === 0 && !targetList) ||
							(step === -1 && targetList?.index === 0) ||
							(step === 1 && sourceList?.index === lists.length - 1 && !targetList?.targetItem) ||
							(step === 1 && targetList?.index === lists.length - 1)
						)
							return;

						if (!rootState.targetItem) rootState.targetItem = rootState.draggedItem;

						const draggedRect = rootState.draggedItem.getBoundingClientRect();
						const nextIndex = targetList ? targetList.index! + step : index! + step;
						const peer = registry.getPeers(group, rootState).find((p) => p.index === nextIndex);

						if (peer && index !== nextIndex) {
							const closestRect = getClosestItemRect(draggedRect, getItemRects(peer.ref));
							const peerTargetItem =
								closestRect &&
								peer.ref.querySelector<HTMLLIElement>(
									`.ssl-item[data-item-id="${closestRect.id}"]`
								);
							if (peerTargetItem) {
								if (
									registry.targetList?.state !== peer.state ||
									registry.targetList.targetItemId !== peerTargetItem.id
								) {
									registry.targetList = {
										...peer,
										targetItem: peerTargetItem ?? null,
										targetItemId: peerTargetItem?.id ?? null,
										targetItemIndex: peerTargetItem ? getIndex(peerTargetItem) : null,
									};
								}
							}
							// If the peer list is empty, place the dragged item in its first position.
							else {
								if (registry.targetList?.state !== peer.state) {
									registry.targetList = {
										...peer,
										targetItem: null,
										targetItemId: null,
										targetItemIndex: 0,
									};

									// Wait until `targetList` is set and the placeholder element
									// is appended before setting `targetItem`.
									tick().then(() => {
										if (!registry.targetList) return;
										registry.targetList = {
											...registry.targetList,
											targetItem: peer.ref.querySelector<HTMLLIElement>('.ssl-placeholder'),
										};
									});
								}
							}
						} else {
							// Offset the dragged rect by the current scroll.
							const draggedRectWithOffset = getItemRectWithOffset(
								draggedRect,
								rootState.scrollOffset
							);
							const closestRect = getClosestItemRect(draggedRectWithOffset, rootState.itemRects);
							if (closestRect) {
								rootState.targetItem = ref!.querySelector<HTMLLIElement>(
									`.ssl-item[data-item-id="${closestRect.id}"]`
								);
							}
							registry.targetList = null;
						}
					}

					await tick();
					targetIndex = getIndex(rootState.targetItem!);

					await tick();
					rootState.dragState = 'kbd-drag';

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
						...getPeerTargetFields(registry, group, rootState),
					});

					liveText = _announcements.dragged({
						sourceList: ref!,
						sourceListIndex: index,
						draggedItem: rootState.draggedItem,
						draggedItemIndex: draggedIndex,
						targetList: registry.targetList?.ref,
						targetListIndex: registry.targetList?.index,
						targetItem: registry.targetList?.targetItem
							? registry.targetList.targetItem
							: rootState.targetItem,
						targetItemIndex:
							typeof registry.targetList?.targetItemIndex === 'number'
								? registry.targetList.targetItemIndex
								: targetIndex,
					});
				}
			}

			if (key === 'Home' || key === 'End') {
				e.preventDefault();

				step = key === 'Home' ? -1 : 1;
				shouldScrollIntoView = true;
				const items = ref!.querySelectorAll<HTMLLIElement>('.ssl-item');
				const focusedIndex = (rootState.focusedItem && getIndex(rootState.focusedItem)) ?? null;

				if (!rootState.dragState.startsWith('kbd-drag')) {
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

					const { targetList } = registry;
					const draggedIndex = getIndex(rootState.draggedItem);
					let targetIndex = rootState.targetItem ? getIndex(rootState.targetItem) : null;

					if (targetList?.targetItem) {
						const targetListChildren = targetList.ref.querySelectorAll<HTMLLIElement>(
							'.ssl-item, .ssl-placeholder'
						);
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
						registry.targetList = {
							...targetList,
							targetItem: peerTargetItem,
							targetItemId: peerTargetItem.id ?? null,
							targetItemIndex: getIndex(peerTargetItem),
						};
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

					await tick();
					targetIndex = getIndex(rootState.targetItem!);

					await tick();
					rootState.dragState = 'kbd-drag';

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
						...getPeerTargetFields(registry, group, rootState),
					});

					liveText = _announcements.dragged({
						sourceList: ref!,
						sourceListIndex: index!,
						draggedItem: rootState.draggedItem,
						draggedItemIndex: draggedIndex,
						targetList: registry.targetList?.ref,
						targetListIndex: registry.targetList?.index,
						targetItem: rootState.targetItem!,
						targetItemIndex: targetIndex,
					});
				}
			}

			if (key === 'Escape' && rootState.draggedItem) {
				// Prevent closing the <dialog> if the dragged item is inside one.
				if (ref!.closest<HTMLDialogElement>('dialog')) e.preventDefault();

				shouldScrollIntoView = true;

				const draggedIndex = getIndex(rootState.draggedItem);
				liveText = _announcements.canceled({
					sourceList: ref!,
					sourceListIndex: index,
					draggedItem: rootState.draggedItem,
					draggedItemIndex: draggedIndex,
				});

				handlePointerAndKeyboardDrop(rootState.draggedItem, 'kbd-cancel');
			}

			if (!shouldScrollIntoView) return;

			await tick();
			const scrollTarget =
				rootState.dragState !== 'kbd-drag'
					? rootState.focusedItem
					: registry.targetList
						? registry.targetList.targetItem
						: rootState.targetItem;

			if (scrollTarget && scrollableAncestor && !isFullyVisible(scrollTarget, scrollableAncestor))
				scrollIntoView(scrollTarget, scrollableAncestor, direction, step, isScrollingDocument);
		}
	}

	async function handlePointerAndKeyboardDrop(
		element: HTMLElement,
		action: 'ptr-drop' | 'ptr-cancel' | 'kbd-drop' | 'kbd-cancel'
	) {
		if (
			!rootState.draggedItem ||
			(action.startsWith('ptr') && rootState.dragState === 'ptr-drop') ||
			(action.startsWith('kbd') && rootState.dragState === 'kbd-drop')
		)
			return;

		isPointerReleased = true;
		scrollSpeed = { x: 0, y: 0 };
		if (rafId) {
			cancelAnimationFrame(rafId);
			rafId = null; // Required on mobile when transition duration is `0ms` and `rafId` is not cleared during `pointermove`.
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
			if (rootState.dragState === 'ptr-predrop') {
				// Wait until the CSS transform in <SortableListItem> that
				// depends on `ptr-predrop` has been set before continuing.
				afterPaint(_transition.duration, async () => {
					await tick();
					rootState.dragState = 'ptr-drop';
				});
			}
		} else if (action === 'ptr-cancel') {
			// Release the peer list so the dragged item returns to its list.
			registry.targetList = null;
			await tick();
			rootState.targetItem = rootState.draggedItem;
			rootState.dragState = 'ptr-cancel';
		}

		if (action === 'kbd-drop') {
			await tick();
			rootState.dragState = 'kbd-drop';
		} else if (action === 'kbd-cancel') {
			await tick();
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
			...getPeerTargetFields(registry, group, rootState),
		});

		const dropDuration = Math.max(
			_transition.duration,
			registry.targetList?.state.props.transition?.duration ?? 0
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

			rootState.interruptDropTransition = () => {
				// Prevent the pending timeout from triggering `handlePointerAndKeyboardDragEnd()`,
				// then settle the drop right away.
				finalizeDrop(false);
				getDropAnimations(element, ref!, registry).forEach((animation) => animation.finish());
				handlePointerAndKeyboardDragEnd(action);
			};

			transitionTimeoutId = setTimeout(finalizeDrop, _transition.duration + 100);

			afterPaint(dropDuration, async () => {
				if (isResolved) return;

				const animations = getDropAnimations(element, ref!, registry);
				if (animations.length)
					await Promise.allSettled(animations.map((animation) => animation.finished));

				finalizeDrop();
			});
		} else {
			handlePointerAndKeyboardDragEnd(action);
		}
	}

	async function handlePointerAndKeyboardDragEnd(
		action: 'ptr-drop' | 'ptr-cancel' | 'ptr-remove' | 'kbd-drop' | 'kbd-cancel'
	) {
		if (!rootState.draggedItem) return;

		scrollEventTarget?.removeEventListener('scroll', handleScroll);
		scrollEventTarget = null;
		if (scrollRafId) {
			cancelAnimationFrame(scrollRafId);
			scrollRafId = null;
		}

		const draggedItem = rootState.draggedItem;
		const targetItem = rootState.targetItem;

		if (!action.endsWith('cancel')) {
			registry.crossingItemId = draggedItem.id;
			requestAnimationFrame(() => (registry.crossingItemId = null));
		}

		rootState.dragState = 'idle';

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
			...getPeerTargetFields(registry, group, rootState),
		});

		if (group) {
			registry.sourceList = null;
			registry.targetList = null;
		}
		if (typeof pointerId === 'number' && draggedItem?.hasPointerCapture(pointerId))
			draggedItem?.releasePointerCapture(pointerId);
		pointerId = null;
		rootState.pointer = null;
		rootState.pointerOrigin = null;
		rootState.draggedItem = null;
		rootState.targetItem = null;
		rootState.itemRects = null;
		rootState.isWithinBounds = true;
	}

	// Interrupt any ongoing drop transition so the user can immediately start a new drag,
	// regardless of whether it’s finishing a pointer or a keyboard interaction.
	async function interruptDropTransition(e: PointerEvent | KeyboardEvent) {
		const droppingRootState = rootState.interruptDropTransition
			? rootState
			: group
				? registry.getPeers(group, rootState).find((peer) => peer.state.interruptDropTransition)
						?.state
				: undefined;
		if (!droppingRootState?.interruptDropTransition) return;

		e.preventDefault();
		droppingRootState.interruptDropTransition();
		// The `ondragend` fired above calls `sortItems()` in the parent updating the items array.
		// Wait for Svelte to flush the re-render so `getItemRects()` captures the new sorted positions.
		await tick();
	}

	// `focusout` is preferred over `blur` since it detects the loss of focus
	// on the current element and it’s descendants too.
	function handleFocusOut(e: FocusEvent) {
		const relatedTarget = e.relatedTarget as HTMLElement | null;
		if (!rootState.props.ref?.contains(relatedTarget) || rootState.props.ref === relatedTarget)
			liveText = '';
	}

	function handleContextMenu(e: MouseEvent) {
		if (rootState.dragState !== 'idle') {
			e.preventDefault();
		}
	}
</script>

<!-- svelte-ignore a11y_role_supports_aria_props -->
<ul
	bind:this={ref}
	{id}
	class={classes}
	style:pointer-events={rootState.focusedItem ? 'none' : 'auto'}
	style:--ssl-gap="{gap}px"
	style:--ssl-wrap={hasWrapping ? 'wrap' : 'nowrap'}
	style:--ssl-transition-duration="{_transition.duration}ms"
	style:--ssl-transition-easing={_transition.easing}
	data-list-id={id}
	data-list-index={index}
	data-has-locked-axis={hasLockedAxis}
	data-has-bounds={hasBounds}
	data-can-clear-on-drag-out={canClearOnDragOut}
	data-can-remove-on-drop-out={canRemoveOnDropOut}
	data-is-source={group
		? group === registry.sourceList?.group && !!id && id === registry.sourceList?.id
		: undefined}
	data-is-target={group
		? group === registry.targetList?.group && !!id && id === registry.targetList?.id
		: undefined}
	data-is-locked={isLocked}
	data-is-disabled={isDisabled}
	tabindex="0"
	role="listbox"
	aria-orientation={direction}
	aria-disabled={isDisabled}
	aria-label={restProps['aria-label'] || undefined}
	aria-labelledby={restProps['aria-labelledby'] || undefined}
	aria-description={!restProps['aria-describedby']
		? restProps['aria-description'] || getDefaultAriaDescription(group, direction)
		: undefined}
	aria-describedby={restProps['aria-describedby'] || undefined}
	aria-activedescendant={rootState.focusedItem ? rootState.focusedItem.id : undefined}
	onpointerdown={handlePointerDown}
	onkeydown={handleKeyDown}
	onfocusout={handleFocusOut}
	oncontextmenu={handleContextMenu}
	onitemfocusout={(event) => handlePointerAndKeyboardDrop(event.detail.item, 'kbd-cancel')}
>
	{#if children}
		{@render children()}
		{#if registry.isTargetList(rootState) && registry.sourceList?.draggedItemId}
			<SortableListPlaceholder
				id={registry.sourceList.draggedItemId}
				index={ref.querySelectorAll('.ssl-item').length ?? 0}
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
		touch-action: none;

		&[aria-orientation='vertical'] {
			flex-direction: column;

			&[data-can-remove-on-drop-out='true']
				:global(.ssl-item[data-drag-state*='ptr'][data-is-within-bounds='false']) {
				margin: 0 calc(var(--ssl-gap) / 2);
			}
		}

		&[aria-orientation='horizontal'] {
			flex-direction: row;

			&[data-can-remove-on-drop-out='true'] :global(.ssl-item[data-is-within-bounds='false']) {
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
