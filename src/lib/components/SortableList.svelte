<!--
@component
## <SortableList.Root>
Serves as the primary container. Provides the main structure, the drag-and-drop interactions and emits the available events.

### Props
- `gap`: separation between items (in pixels).
- `direction`: orientation in which items will be arranged.
- `delay`: time before the drag operation starts (in milliseconds). Can help prevent accidental dragging.
- `transition`:
		- `duration`: time the transitions for the ghost (dropping) and items (translation, addition, removal) take to complete (in milliseconds). Assign it a value of `0` to remove animations.
		- `easing`: mathematical function that describes the rate at which the transitioning value changes. It receives any of the values accepted by the CSS `transition-timing-function` property. Currently it only affects the ghost drop transition.
- `hasWrapping`: if `true`, items can wrap onto multiple lines.
- `hasLockedAxis`: if `true`, prevents the dragged item from moving away from the main axis.
- `hasBoundaries`: if `true`, items will only be draggable inside the list limits.
- `canClearOnDragOut`: if `true`, the target item will be cleared when a the dragged item (by a pointing device) does not collide with any of the items in the list.
- `canRemoveOnDropOut`: if `true`, items will be removed when dragged and dropped outside of the list boundaries.
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
	import { BROWSER } from 'esm-env';
	import SortableListGhost from '$lib/components/SortableListGhost.svelte';
	import { setSortableListRootState } from '$lib/states/index.js';
	import type { SortableListRootProps as RootProps } from '$lib/types/index.js';
	import {
		announce,
		areColliding,
		getClosestScrollableAncestor,
		getCollidingItem,
		getIndex,
		getItemRects,
		getScrollingSpeed,
		getTextDirection,
		isFullyVisible,
		isOrResidesInInteractiveElement,
		isRootElement,
		isScrollable,
		scrollIntoView,
		shouldAutoScroll,
	} from '$lib/utils/index.js';

	let rootRef: HTMLUListElement = $state()!;
	let ghostRef: HTMLDivElement = $state()!;

	let {
		gap = 12,
		direction = 'vertical',
		delay = 0,
		transition = undefined,
		hasWrapping = false,
		hasLockedAxis = false,
		hasBoundaries = false,
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
			gap,
			direction,
			delay,
			transition: _transition,
			hasWrapping,
			hasLockedAxis,
			hasBoundaries,
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
	let pointerId: PointerEvent['pointerId'] | null = $state(null);
	let delayTimeoutId: ReturnType<typeof setTimeout> | null = $state(null);
	let transitionTimeoutId: ReturnType<typeof setTimeout> | null = $state(null);
	let liveText = $state('');

	onMount(() => {
		onmounted?.(null);
		rootState.ref = rootRef;
		rootState.isRTL = getTextDirection(rootRef) === 'rtl';
	});

	onDestroy(() => {
		ondestroyed?.(null);
	});

	// Svelte currently does not retain focus when elements are moved (even when keyed),
	// so we need to manually keep focus on the selected <SortableList.Item> as items are sorted.
	// https://github.com/sveltejs/svelte/issues/3973
	let activeElement: HTMLLIElement | null = $state(null);
	$effect.pre(() => {
		activeElement = rootState.focusedItem;
	});
	$effect(() => {
		if (rootState.dragState !== 'idle') return;

		untrack(() => {
			if (activeElement && activeElement !== document.activeElement) {
				activeElement.focus({ preventScroll: true });
			}
		});
	});

	let scrollingSpeed = $state(0);
	let scrollableAncestor: HTMLElement | undefined = $derived(getClosestScrollableAncestor(rootRef));
	let scrollableAncestorScrollTop: number | undefined = $state(0);
	let scrollableAncestorScrollLeft: number | undefined = $state(0);
	let isScrollingDocument = $derived(
		scrollableAncestor ? isRootElement(scrollableAncestor, direction) : false
	);
	$effect(() => {
		if (scrollingSpeed !== 0) untrack(() => scroll());
	});

	function scroll() {
		if (!scrollableAncestor) return;

		if (BROWSER)
			requestAnimationFrame(() => {
				if (!shouldAutoScroll(scrollableAncestor!, direction, scrollingSpeed)) return;

				const x = direction === 'horizontal' ? scrollingSpeed : 0;
				const y = direction === 'vertical' ? scrollingSpeed : 0;
				scrollableAncestor!.scrollBy(x, y);

				if (scrollingSpeed !== 0) scroll();
			});
	}

	function autoScroll(clientX: PointerEvent['clientX'], clientY: PointerEvent['clientY']) {
		if (!scrollableAncestor) return;

		scrollingSpeed = getScrollingSpeed(
			scrollableAncestor,
			clientX,
			clientY,
			direction,
			isScrollingDocument
		);
	}

	async function handlePointerDown(e: PointerEvent) {
		if (e.button !== 0 || rootState.dragState !== 'idle' || rootState.focusedItem) {
			e.preventDefault();
			return;
		}

		const target = e.target as HTMLElement;
		const currItem = target.closest<HTMLLIElement>('.ssl-item');
		if (!currItem) return;

		if (
			(isLocked && !isOrResidesInInteractiveElement(target, currItem)) ||
			(currItem.dataset.isLocked === 'true' &&
				!isOrResidesInInteractiveElement(target, currItem)) ||
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
		if (hasItemHandle && !isOrResidesInItemHandle) {
			e.preventDefault();
			return;
		}

		// Prevent dragging if the current list item contains an interactive element
		// and we’re also not dragging from a handle inside that interactive element.
		if (isOrResidesInInteractiveElement(target, currItem) && !isOrResidesInItemHandle) return;
		// Prevent focus from being set on the current <SortableList.Item>.
		e.preventDefault();

		currItem.setPointerCapture(e.pointerId);
		pointerId = e.pointerId;

		rootState.pointer = { x: e.clientX, y: e.clientY };
		rootState.pointerOrigin = { x: e.clientX, y: e.clientY };
		rootState.draggedItem = currItem;
		rootState.itemRects = getItemRects(rootRef);

		if (delay <= 0) await handlePointerDragStart(currItem);
		else {
			rootRef.addEventListener('pointermove', handlePointerMoveWithDelay);
			delayTimeoutId = setTimeout(async () => await handlePointerDragStart(currItem), delay);
		}
	}

	async function handlePointerDragStart(currItem: HTMLLIElement) {
		rootRef.removeEventListener('pointermove', handlePointerMoveWithDelay);

		await tick();
		rootState.ghostState = 'ptr-drag-start';
		rootState.dragState = 'ptr-drag-start';

		ondragstart?.({
			deviceType: 'pointer',
			draggedItem: currItem,
			draggedItemId: currItem.id,
			draggedItemIndex: getIndex(currItem),
			isBetweenBounds: rootState.isBetweenBounds,
			canRemoveOnDropOut: canRemoveOnDropOut || false,
		});

		rootRef.addEventListener('pointermove', handlePointerMove);
		rootRef.addEventListener(
			'pointerup',
			() => {
				rootRef.removeEventListener('pointermove', handlePointerMove);
				handlePointerUp();
			},
			{ once: true }
		);
		rootRef.addEventListener(
			'pointercancel',
			() => {
				rootRef.removeEventListener('pointermove', handlePointerMove);
				handlePointerCancel();
			},
			{ once: true }
		);
		// Provide a fallback for the pointerup event not firing on Webkit for iOS.
		// This occurs when tapping an item to start dragging and releasing without movement.
		rootRef.addEventListener(
			'lostpointercapture',
			() => {
				rootRef.removeEventListener('pointermove', handlePointerMove);
				if (rootState.dragState === 'ptr-drag-start') handlePointerCancel();
			},
			{ once: true }
		);
	}

	async function handlePointerMove({ clientX, clientY }: PointerEvent) {
		if (rootState.ghostState !== 'ptr-drag' || rootState.dragState !== 'ptr-drag') {
			await tick();
			rootState.ghostState = 'ptr-drag';
			rootState.dragState = 'ptr-drag';
		}

		if (!rootState.draggedItem || !rootState.itemRects || !ghostRef) return;

		const rootRect = rootRef.getBoundingClientRect();
		const ghostRect = ghostRef.getBoundingClientRect();
		rootState.pointer = { x: clientX, y: clientY };
		rootState.isBetweenBounds = areColliding(ghostRect, rootRect);

		// Re-set itemRects only during scrolling.
		// (setting it here instead of in the `scroll()` function to reduce the performance impact)
		if (
			scrollableAncestor?.scrollTop !== scrollableAncestorScrollTop ||
			scrollableAncestor?.scrollLeft !== scrollableAncestorScrollLeft
		) {
			rootState.itemRects = getItemRects(rootRef);
			scrollableAncestorScrollTop = scrollableAncestor?.scrollTop;
			scrollableAncestorScrollLeft = scrollableAncestor?.scrollLeft;
		}
		await tick();
		const collidingItemRect = getCollidingItem(ghostRect, rootState.itemRects);
		if (collidingItemRect)
			rootState.targetItem = rootRef.querySelector<HTMLLIElement>(
				`.ssl-item[data-item-id="${collidingItemRect.id}"]`
			);
		else if (canClearOnDragOut || (canRemoveOnDropOut && !rootState.isBetweenBounds))
			rootState.targetItem = null;

		ondrag?.({
			deviceType: 'pointer',
			draggedItem: rootState.draggedItem,
			draggedItemId: rootState.draggedItem.id,
			draggedItemIndex: getIndex(rootState.draggedItem),
			targetItem: rootState.targetItem,
			targetItemId: rootState.targetItem ? rootState.targetItem.id : null,
			targetItemIndex: rootState.targetItem ? getIndex(rootState.targetItem) : null,
			isBetweenBounds: rootState.isBetweenBounds,
			canRemoveOnDropOut: canRemoveOnDropOut || false,
		});

		if (isScrollable(scrollableAncestor, direction)) autoScroll(clientX, clientY);
	}

	async function handlePointerMoveWithDelay({ clientX, clientY }: PointerEvent) {
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
		handlePointerAndKeyboardDrop(ghostRef, 'ptr-drop');
	}

	function handlePointerCancel() {
		handlePointerAndKeyboardDrop(ghostRef, 'ptr-cancel');
	}

	async function handleKeyDown(e: KeyboardEvent) {
		if (rootState.dragState === 'kbd-drop') {
			e.preventDefault();
			return;
		}

		const { key } = e;
		const target = e.target as HTMLElement;

		if (target === rootRef || target === rootState.focusedItem) {
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
					rootState.itemRects = getItemRects(rootRef);

					await tick();
					rootState.dragState = 'kbd-drag-start';

					ondragstart?.({
						deviceType: 'keyboard',
						draggedItem: rootState.focusedItem,
						draggedItemId: rootState.focusedItem.id,
						draggedItemIndex: draggedIndex,
						isBetweenBounds: rootState.isBetweenBounds,
						canRemoveOnDropOut: canRemoveOnDropOut || false,
					});

					liveText = _announcements.lifted(rootState.draggedItem, draggedIndex);
				} else {
					handlePointerAndKeyboardDrop(rootState.focusedItem, 'kbd-drop');
				}
			}

			if (key === 'ArrowUp' || key === 'ArrowLeft' || key === 'ArrowDown' || key === 'ArrowRight') {
				e.preventDefault();

				const step =
					key === 'ArrowUp' ||
					(key === 'ArrowLeft' && !rootState.isRTL) ||
					(key === 'ArrowRight' && rootState.isRTL)
						? -1
						: 1;
				const focusedIndex = rootState.focusedItem ? getIndex(rootState.focusedItem) : null;

				if (rootState.dragState !== 'kbd-drag-start' && rootState.dragState !== 'kbd-drag') {
					if (!rootState.focusedItem || focusedIndex === null) {
						const firstItem = rootRef.querySelector<HTMLLIElement>('.ssl-item');
						if (!firstItem) return;

						firstItem.focus({ preventScroll: true });

						if (scrollableAncestor && !isFullyVisible(firstItem, scrollableAncestor))
							scrollIntoView(firstItem, scrollableAncestor, direction, -1, isScrollingDocument);
						return;
					}

					// Prevent focusing the previous item if the current one is the first,
					// and focusing the next item if the current one is the last.
					const items = rootRef.querySelectorAll<HTMLLIElement>('.ssl-item');
					if (
						(step === -1 && focusedIndex === 0) ||
						(step === 1 && focusedIndex === items.length - 1)
					)
						return;

					if (step === 1)
						(rootState.focusedItem.nextElementSibling as HTMLLIElement)?.focus({
							preventScroll: true,
						});
					else
						(rootState.focusedItem.previousElementSibling as HTMLLIElement)?.focus({
							preventScroll: true,
						});
				} else {
					if (!rootState.draggedItem || !rootState.itemRects) return;

					const draggedIndex = getIndex(rootState.draggedItem);
					let targetIndex = rootState.targetItem ? getIndex(rootState.targetItem) : null;
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

					if (!rootState.targetItem) {
						rootState.targetItem =
							step === 1
								? (rootState.draggedItem.nextElementSibling as HTMLLIElement)
								: (rootState.draggedItem.previousElementSibling as HTMLLIElement);
					} else {
						rootState.targetItem =
							step === 1
								? (rootState.targetItem.nextElementSibling as HTMLLIElement)
								: (rootState.targetItem.previousElementSibling as HTMLLIElement);
					}

					await tick();
					const targetId = rootState.targetItem.id;
					targetIndex = getIndex(rootState.targetItem);

					await tick();
					rootState.dragState = 'kbd-drag';

					ondrag?.({
						deviceType: 'keyboard',
						draggedItem: rootState.draggedItem,
						draggedItemId: rootState.draggedItem.id,
						draggedItemIndex: draggedIndex,
						targetItem: rootState.targetItem,
						targetItemId: targetId,
						targetItemIndex: targetIndex,
						isBetweenBounds: rootState.isBetweenBounds,
						canRemoveOnDropOut: canRemoveOnDropOut || false,
					});

					if (scrollableAncestor && !isFullyVisible(rootState.targetItem, scrollableAncestor))
						scrollIntoView(
							rootState.targetItem,
							scrollableAncestor,
							direction,
							step,
							isScrollingDocument
						);

					liveText = _announcements.dragged(
						rootState.draggedItem,
						draggedIndex,
						rootState.targetItem,
						targetIndex
					);
				}

				await tick();
				const scrollTarget =
					rootState.dragState !== 'kbd-drag' ? rootState.focusedItem : rootState.targetItem;
				if (scrollTarget && scrollableAncestor && !isFullyVisible(scrollTarget, scrollableAncestor))
					scrollIntoView(scrollTarget, scrollableAncestor, direction, step, isScrollingDocument);
			}

			if (key === 'Home' || key === 'End') {
				e.preventDefault();

				const items = rootRef.querySelectorAll<HTMLLIElement>('.ssl-item');
				const focusedIndex = (rootState.focusedItem && getIndex(rootState.focusedItem)) ?? null;

				if (rootState.dragState !== 'kbd-drag-start' && rootState.dragState !== 'kbd-drag') {
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

					const draggedIndex = getIndex(rootState.draggedItem);
					let targetIndex = rootState.targetItem ? getIndex(rootState.targetItem) : null;
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
					await tick();
					targetIndex = getIndex(rootState.targetItem);

					await tick();
					rootState.dragState = 'kbd-drag';

					ondrag?.({
						deviceType: 'keyboard',
						draggedItem: rootState.draggedItem,
						draggedItemId: rootState.draggedItem.id,
						draggedItemIndex: draggedIndex,
						targetItem: rootState.targetItem,
						targetItemId: rootState.targetItem.id,
						targetItemIndex: targetIndex,
						isBetweenBounds: rootState.isBetweenBounds,
						canRemoveOnDropOut: canRemoveOnDropOut || false,
					});

					liveText = _announcements.dragged(
						rootState.draggedItem,
						draggedIndex,
						rootState.targetItem,
						targetIndex
					);
				}

				await tick();
				const scrollTarget =
					rootState.dragState !== 'kbd-drag' ? rootState.focusedItem : rootState.targetItem;
				const step = key === 'Home' ? -1 : 1;
				if (scrollTarget && scrollableAncestor && !isFullyVisible(scrollTarget, scrollableAncestor))
					scrollIntoView(scrollTarget, scrollableAncestor, direction, step, isScrollingDocument);
			}

			if (key === 'Escape' && rootState.draggedItem) {
				// Prevent closing the <dialog> if the dragged item is inside one.
				if (rootRef.closest<HTMLDialogElement>('dialog')) e.preventDefault();
				handlePointerAndKeyboardDrop(rootState.draggedItem, 'kbd-cancel');
			}
		}
	}

	async function handlePointerAndKeyboardDrop(
		element: HTMLElement,
		action: 'ptr-drop' | 'ptr-cancel' | 'kbd-drop' | 'kbd-cancel'
	) {
		if (
			!rootState.draggedItem ||
			(action.includes('ptr') && rootState.dragState === 'ptr-drop') ||
			(action.includes('kbd') && rootState.dragState === 'kbd-drop')
		)
			return;

		await tick();
		const draggedIndex = getIndex(rootState.draggedItem);
		const targetIndex = rootState.targetItem ? getIndex(rootState.targetItem) : null;

		if (action === 'ptr-drop') {
			await tick();
			rootState.ghostState =
				!rootState.isBetweenBounds && canRemoveOnDropOut ? 'ptr-remove' : 'ptr-predrop';
			await tick();
			// Use requestAnimationFrame() to wait until the CSS transform in <SortableListGhost>
			// that depends on `ptr-predrop` has been set before continuing.
			requestAnimationFrame(async () => {
				if (rootState.ghostState !== 'ptr-remove') rootState.ghostState = 'ptr-drop';
				rootState.dragState = 'ptr-drop';
			});
		} else if (action === 'ptr-cancel') {
			await tick();
			// Use requestAnimationFrame() to wait until the CSS transform in <SortableListGhost>
			// that depends on `ptr-predrop` has been set before continuing.
			requestAnimationFrame(async () => {
				if (rootState.ghostState !== 'ptr-remove') rootState.ghostState = 'ptr-drop';
				rootState.dragState = 'ptr-cancel';
			});
		}

		if (action === 'kbd-drop') {
			await tick();
			rootState.dragState = 'kbd-drop';
			liveText = _announcements.dropped(
				rootState.draggedItem,
				draggedIndex,
				rootState.targetItem,
				targetIndex
			);
		} else if (action === 'kbd-cancel') {
			await tick();
			rootState.dragState = 'kbd-cancel';
			if (scrollableAncestor)
				scrollIntoView(
					rootState.draggedItem,
					scrollableAncestor,
					direction,
					-1,
					isScrollingDocument
				);
			liveText = _announcements.canceled(rootState.draggedItem, draggedIndex);
		}

		ondrop?.({
			deviceType: action.includes('pointer') ? 'pointer' : 'keyboard',
			draggedItem: rootState.draggedItem,
			draggedItemId: rootState.draggedItem.id,
			draggedItemIndex: draggedIndex,
			targetItem: rootState.targetItem,
			targetItemId: rootState.targetItem ? rootState.targetItem.id : null,
			targetItemIndex: targetIndex,
			isBetweenBounds: rootState.isBetweenBounds,
			canRemoveOnDropOut: canRemoveOnDropOut || false,
		});

		function handleTransitionEnd({ propertyName }: TransitionEvent) {
			if (propertyName === 'z-index') {
				handlePointerAndKeyboardDragEnd(action);
				element?.removeEventListener('transitionend', handleTransitionEnd);
				if (transitionTimeoutId) {
					clearTimeout(transitionTimeoutId);
					transitionTimeoutId = null;
				}
			}
		}

		if (_transition.duration > 0) {
			element?.addEventListener('transitionend', handleTransitionEnd);
			// Ensure the drag operation completes even if `transitionend` doesn’t fire.
			transitionTimeoutId = setTimeout(() => {
				element?.removeEventListener('transitionend', handleTransitionEnd);
				transitionTimeoutId = null;
			}, _transition.duration + 100);
		} else {
			handlePointerAndKeyboardDragEnd(action);
		}
	}

	async function handlePointerAndKeyboardDragEnd(
		action: 'ptr-drop' | 'ptr-cancel' | 'kbd-drop' | 'kbd-cancel'
	) {
		if (!rootState.draggedItem) return;

		await tick();
		rootState.ghostState = 'idle';
		rootState.dragState = 'idle';

		ondragend?.({
			deviceType: action.includes('ptr') ? 'pointer' : 'keyboard',
			draggedItem: rootState.draggedItem,
			draggedItemId: rootState.draggedItem.id,
			draggedItemIndex: getIndex(rootState.draggedItem),
			targetItem: rootState.targetItem,
			targetItemId: rootState.targetItem ? rootState.targetItem.id : null,
			targetItemIndex: rootState.targetItem ? getIndex(rootState.targetItem) : null,
			isBetweenBounds: rootState.isBetweenBounds,
			canRemoveOnDropOut: canRemoveOnDropOut || false,
			isCanceled: action.includes('cancel'),
		});

		if (typeof pointerId === 'number' && rootState.draggedItem?.hasPointerCapture(pointerId))
			rootState.draggedItem?.releasePointerCapture(pointerId);
		pointerId = null;
		rootState.pointer = null;
		rootState.pointerOrigin = null;
		rootState.draggedItem = null;
		rootState.targetItem = null;
		rootState.itemRects = null;
		rootState.isBetweenBounds = true;
		scrollingSpeed = 0;
	}

	function handleContextMenu(e: MouseEvent) {
		if (rootState.dragState !== 'idle') {
			e.preventDefault();
		}
	}
</script>

<!-- svelte-ignore a11y_role_supports_aria_props -->
<ul
	bind:this={rootRef}
	class={classes}
	style:pointer-events={rootState.focusedItem ? 'none' : 'auto'}
	style:--ssl-gap="{gap}px"
	style:--ssl-wrap={hasWrapping ? 'wrap' : 'nowrap'}
	style:--ssl-transition-duration="{_transition.duration}ms"
	style:--ssl-transition-easing={_transition.easing}
	data-has-locked-axis={hasLockedAxis}
	data-has-boundaries={hasBoundaries}
	data-can-clear-on-drag-out={canClearOnDragOut}
	data-can-remove-on-drop-out={canRemoveOnDropOut}
	data-is-locked={isLocked}
	data-is-disabled={isDisabled}
	tabindex="0"
	role="listbox"
	aria-orientation={direction}
	aria-disabled={isDisabled}
	aria-label={restProps['aria-label'] || undefined}
	aria-labelledby={restProps['aria-labelledby'] || undefined}
	aria-description={!restProps['aria-describedby']
		? restProps['aria-description'] ||
			'Press the arrow keys to move through the list items. Press Space to start dragging an item. When dragging, use the arrow keys to move the item around. Press Space again to drop the item, or Escape to cancel.'
		: undefined}
	aria-describedby={restProps['aria-describedby'] || undefined}
	aria-activedescendant={rootState.focusedItem ? rootState.focusedItem.id : undefined}
	onpointerdown={handlePointerDown}
	onkeydown={handleKeyDown}
	oncontextmenu={handleContextMenu}
	onitemfocusout={(event) => handlePointerAndKeyboardDrop(event.detail.item, 'kbd-cancel')}
>
	{#if children}
		{@render children()}
	{:else}
		<p>
			To display your list, put a few <code>{'<SortableList.Item>'}</code> inside your
			<code>{'<SortableList.Root>'}</code>.
		</p>
	{/if}
</ul>
<SortableListGhost bind:ghostRef />
<div class="ssl-live-region" aria-live="assertive" aria-atomic="true">{liveText}</div>

<style>
	.ssl-root,
	.ssl-root :global(*) {
		box-sizing: border-box;
	}

	.ssl-root {
		display: flex;
		flex-wrap: var(--ssl-wrap);
		padding-inline-start: 0;
		margin: calc(var(--ssl-gap) / 2 * -1);

		&[aria-orientation='vertical'] {
			flex-direction: column;

			&[data-can-remove-on-drop-out='true']
				:global(.ssl-item[data-drag-state*='ptr'][data-is-between-bounds='false']) {
				margin: 0 calc(var(--ssl-gap) / 2);
			}
		}

		&[aria-orientation='horizontal'] {
			flex-direction: row;

			&[data-can-remove-on-drop-out='true'] :global(.ssl-item[data-is-between-bounds='false']) {
				margin: calc(var(--ssl-gap) / 2) 0;
			}
		}

		&[data-can-remove-on-drop-out='true']
			:global(.ssl-item[data-is-ghost='false'][data-drag-state*='ptr']) {
			overflow: hidden;
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
