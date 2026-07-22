<!--
@component
## <SortableList.Root>
Serves as the primary container. Provides the main structure, the drag-and-drop interactions and emits the available events.

### Props
- `ref`: reference to the list element (HTMLUListElement). `[$bindable]`
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
	import SortableListGhost from '$lib/components/SortableListGhost.svelte';
	import { setSortableListRootState } from '$lib/states/index.js';
	import type {
		SortableListRootProps as RootProps,
		SortableListGhostProps as GhostProps,
	} from '$lib/types/index.js';
	import {
		afterPaint,
		announce,
		areColliding,
		canScroll,
		canScrollX,
		canScrollY,
		getClosestScrollableAncestor,
		getCollidingItem,
		getIndex,
		getItemRects,
		getScrollingSpeed,
		getTextDirection,
		isFullyVisible,
		isOrResidesInInteractiveElement,
		isRootElement,
		scrollIntoView,
		shouldAutoScroll,
	} from '$lib/utils/index.js';

	let ghostRef: GhostProps['ref'] = $state(null);

	let {
		ref = $bindable(null),
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
			ref,
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
	let pointerId: PointerEvent['pointerId'] | null = null;
	let isPointerReleased = false;
	let delayTimeoutId: ReturnType<typeof setTimeout> | null = null;
	let transitionTimeoutId: ReturnType<typeof setTimeout> | null = null;
	let skipDragEnd: (() => void) | null = null;
	let liveText = $state('');

	onMount(() => {
		onmounted?.(null);
		rootState.isRTL = getTextDirection(ref!) === 'rtl';
	});

	onDestroy(() => {
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
				activeElement.focus({ preventScroll: true });
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

	function updateTargetItem() {
		if (!rootState.itemRectsSnapshot || !ref || !ghostRef) return;

		const rawGhostRect = ghostRef.getBoundingClientRect();
		const rootRect = ref.getBoundingClientRect();
		rootState.isBetweenBounds = areColliding(rawGhostRect, rootRect);
		if (scrollableAncestor) {
			rootState.scrollOffset = {
				left: scrollableAncestor.scrollLeft - scrollOrigin.left,
				top: scrollableAncestor.scrollTop - scrollOrigin.top,
			};
		}

		// Offset the ghost rect by the current scroll.
		const ghostRect =
			rootState.scrollOffset?.left || rootState.scrollOffset?.top
				? new DOMRect(
						rawGhostRect.x + rootState.scrollOffset.left,
						rawGhostRect.y + rootState.scrollOffset.top,
						rawGhostRect.width,
						rawGhostRect.height
					)
				: rawGhostRect;

		const collidingItemRect = getCollidingItem(ghostRect, rootState.itemRectsSnapshot);
		if (collidingItemRect)
			rootState.targetItem = ref.querySelector<HTMLLIElement>(
				`.ssl-item[data-item-id="${collidingItemRect.id}"]`
			);
		else if (canClearOnDragOut && !rootState.isBetweenBounds) rootState.targetItem = null;
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
	let scrollTarget: Document | HTMLElement | null = null;
	function handleScroll() {
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

		// Interrupt any ongoing drop transition so the user can immediately start a new drag,
		// regardless of whether it’s finishing a pointer or a keyboard interaction.
		if (
			rootState.dragState === 'ptr-drop' ||
			rootState.dragState === 'ptr-cancel' ||
			rootState.dragState === 'kbd-drop' ||
			rootState.dragState === 'kbd-cancel'
		) {
			const isPtrState = rootState.dragState.startsWith('ptr');
			const element = isPtrState ? ghostRef : rootState.focusedItem;
			e.preventDefault();
			interruptDropTransition(element, rootState.dragState);
			// The `ondragend` fired above calls sortItems() in the parent updating the items array.
			// Wait for Svelte to flush the re-render so getItemRects() captures the new sorted positions.
			await tick();
		}

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
		rootState.itemRectsSnapshot = getItemRects(ref!);
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
		rootState.ghostState = 'ptr-drag-start';
		await tick();
		rootState.dragState = 'ptr-drag-start';

		ondragstart?.({
			deviceType: 'pointer',
			draggedItem: currItem,
			draggedItemId: currItem.id,
			draggedItemIndex: getIndex(currItem),
			isBetweenBounds: rootState.isBetweenBounds,
			canRemoveOnDropOut: canRemoveOnDropOut || false,
		});

		document.addEventListener('pointermove', handlePointerMove);
		if (scrollableAncestor && canScroll(scrollableAncestor)) {
			// The document’s scrolling element doesn’t reliably receive its own
			// `scroll` events, so `document` is the target used for that case.
			scrollTarget = isScrollingDocument ? document : scrollableAncestor;
			scrollTarget.addEventListener('scroll', handleScroll, { passive: true });
		}
		document.addEventListener(
			'pointerup',
			() => {
				document.removeEventListener('pointermove', handlePointerMove);
				scrollTarget?.removeEventListener('scroll', handleScroll);
				scrollTarget = null;
				handlePointerUp();
			},
			{ once: true }
		);
		document.addEventListener(
			'pointercancel',
			() => {
				document.removeEventListener('pointermove', handlePointerMove);
				scrollTarget?.removeEventListener('scroll', handleScroll);
				scrollTarget = null;
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
				scrollTarget?.removeEventListener('scroll', handleScroll);
				scrollTarget = null;
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
			if (rootState.dragState === 'ptr-drag-start') {
				rootState.ghostState = 'ptr-drag';
				rootState.dragState = 'ptr-drag';
			}

			if (!rootState.draggedItem) return;

			rootState.pointer = { x: clientX, y: clientY };
			updateTargetItem();

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
		handlePointerAndKeyboardDrop(ghostRef!, 'ptr-drop');
	}

	function handlePointerCancel() {
		handlePointerAndKeyboardDrop(ghostRef!, 'ptr-cancel');
	}

	async function handleKeyDown(e: KeyboardEvent) {
		// Interrupt any ongoing drop transition so the user can immediately start a new drag,
		// regardless of whether it’s finishing a pointer or a keyboard interaction.
		if (
			rootState.dragState === 'ptr-drop' ||
			rootState.dragState === 'ptr-cancel' ||
			rootState.dragState === 'kbd-drop' ||
			rootState.dragState === 'kbd-cancel'
		) {
			const isPtrState = rootState.dragState.startsWith('ptr');
			const element = isPtrState ? ghostRef : rootState.focusedItem;
			e.preventDefault();
			interruptDropTransition(element, rootState.dragState);
			// The `ondragend` fired above calls sortItems() in the parent updating the items array.
			// Wait for Svelte to flush the re-render so getItemRects() captures the new sorted positions.
			await tick();
		}

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
					rootState.itemRectsSnapshot = getItemRects(ref!);
					scrollOrigin = {
						left: scrollableAncestor?.scrollLeft ?? 0,
						top: scrollableAncestor?.scrollTop ?? 0,
					};
					rootState.scrollOffset = { left: 0, top: 0 };

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
					if (!rootState.draggedItem) return;

					const draggedIndex = getIndex(rootState.draggedItem);
					const targetIndex = rootState.targetItem ? getIndex(rootState.targetItem) : null;
					liveText = _announcements.dropped(
						rootState.draggedItem,
						draggedIndex,
						rootState.targetItem,
						targetIndex
					);

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

				if (rootState.dragState !== 'kbd-drag-start' && rootState.dragState !== 'kbd-drag') {
					if (!rootState.focusedItem || focusedIndex === null) {
						shouldScrollIntoView = true;
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

						if (step === 1)
							(rootState.focusedItem.nextElementSibling as HTMLLIElement)?.focus({
								preventScroll: true,
							});
						else
							(rootState.focusedItem.previousElementSibling as HTMLLIElement)?.focus({
								preventScroll: true,
							});
					}
				} else {
					if (!rootState.draggedItem || !rootState.itemRectsSnapshot) return;

					const draggedIndex = getIndex(rootState.draggedItem);
					let targetIndex = rootState.targetItem ? getIndex(rootState.targetItem) : null;
					// Prevent moving the selected item if it’s the first or last item,
					// or is at the top or bottom of the list.
					if (
						(step === -1 && draggedIndex === 0 && !rootState.targetItem) ||
						(step === -1 && targetIndex === 0) ||
						(step === 1 &&
							draggedIndex === rootState.itemRectsSnapshot.length - 1 &&
							!rootState.targetItem) ||
						(step === 1 && targetIndex === rootState.itemRectsSnapshot.length - 1)
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

					liveText = _announcements.dragged(
						rootState.draggedItem,
						draggedIndex,
						rootState.targetItem,
						targetIndex
					);
				}
			}

			if (key === 'Home' || key === 'End') {
				e.preventDefault();

				step = key === 'Home' ? -1 : 1;
				shouldScrollIntoView = true;
				const items = ref!.querySelectorAll<HTMLLIElement>('.ssl-item');
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
					if (!rootState.draggedItem || !rootState.itemRectsSnapshot) return;

					const draggedIndex = getIndex(rootState.draggedItem);
					let targetIndex = rootState.targetItem ? getIndex(rootState.targetItem) : null;
					// Prevent moving the selected item if it’s the first or last item,
					// or is at the top or bottom of the list.
					if (
						(key === 'Home' && draggedIndex === 0 && !rootState.targetItem) ||
						(key === 'Home' && targetIndex === 0) ||
						(key === 'End' &&
							draggedIndex === rootState.itemRectsSnapshot.length - 1 &&
							!rootState.targetItem) ||
						(key === 'End' && targetIndex === rootState.itemRectsSnapshot.length - 1)
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
			}

			if (key === 'Escape' && rootState.draggedItem) {
				// Prevent closing the <dialog> if the dragged item is inside one.
				if (ref!.closest<HTMLDialogElement>('dialog')) e.preventDefault();

				shouldScrollIntoView = true;

				const draggedIndex = getIndex(rootState.draggedItem);
				liveText = _announcements.canceled(rootState.draggedItem, draggedIndex);

				handlePointerAndKeyboardDrop(rootState.draggedItem, 'kbd-cancel');
			}

			if (!shouldScrollIntoView) return;

			await tick();
			const scrollTarget =
				rootState.dragState !== 'kbd-drag' ? rootState.focusedItem : rootState.targetItem;
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
			(action.includes('ptr') && rootState.dragState === 'ptr-drop') ||
			(action.includes('kbd') && rootState.dragState === 'kbd-drop')
		)
			return;

		isPointerReleased = true;
		scrollSpeed = { x: 0, y: 0 };
		if (rafId) {
			cancelAnimationFrame(rafId);
			rafId = null; // Required on mobile when transition duration is `0ms` and `rafId` is not cleared during `pointermove`.
		}

		if (action === 'ptr-drop') {
			await tick();
			rootState.ghostState =
				!rootState.isBetweenBounds && canRemoveOnDropOut
					? 'ptr-remove'
					: _transition.duration > 0
						? 'ptr-predrop'
						: 'ptr-drop';
			// Wait until the CSS transform in <SortableListGhost> that
			// depends on `ptr-predrop` has been set before continuing.
			afterPaint(_transition.duration, async () => {
				if (rootState.ghostState === 'ptr-predrop') {
					await tick();
					rootState.ghostState = 'ptr-drop';
				}
				rootState.dragState = 'ptr-drop';
			});
		} else if (action === 'ptr-cancel') {
			await tick();
			rootState.targetItem = rootState.draggedItem;
			if (rootState.ghostState !== 'ptr-remove') rootState.ghostState = 'ptr-drop';
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
			deviceType: action.includes('pointer') ? 'pointer' : 'keyboard',
			draggedItem: rootState.draggedItem!,
			draggedItemId: rootState.draggedItem!.id,
			draggedItemIndex: draggedIndex,
			targetItem: rootState.targetItem,
			targetItemId: rootState.targetItem ? rootState.targetItem.id : null,
			targetItemIndex: targetIndex,
			isBetweenBounds: rootState.isBetweenBounds,
			canRemoveOnDropOut: canRemoveOnDropOut || false,
		});

		if (_transition.duration > 0) {
			let isResolved = false;
			function finalizeDrop(shouldHandleDragEnd = true) {
				if (isResolved) return;

				isResolved = true;
				skipDragEnd = null;
				element?.removeEventListener('transitionend', handleTransitionEnd);
				if (transitionTimeoutId) {
					clearTimeout(transitionTimeoutId);
					transitionTimeoutId = null;
				}

				if (shouldHandleDragEnd) handlePointerAndKeyboardDragEnd(action);
			}

			skipDragEnd = () => finalizeDrop(false);

			function handleTransitionEnd(e: TransitionEvent) {
				if (e.propertyName === 'transform') finalizeDrop();
			}

			element?.addEventListener('transitionend', handleTransitionEnd);
			transitionTimeoutId = setTimeout(finalizeDrop, _transition.duration + 100);
		} else {
			handlePointerAndKeyboardDragEnd(action);
		}
	}

	async function handlePointerAndKeyboardDragEnd(
		action: 'ptr-drop' | 'ptr-cancel' | 'kbd-drop' | 'kbd-cancel'
	) {
		if (!rootState.draggedItem) return;

		const draggedItem = rootState.draggedItem;
		const targetItem = rootState.targetItem;

		rootState.ghostState = 'idle';
		rootState.dragState = 'idle';

		ondragend?.({
			deviceType: action.includes('ptr') ? 'pointer' : 'keyboard',
			draggedItem,
			draggedItemId: draggedItem.id,
			draggedItemIndex: getIndex(draggedItem),
			targetItem,
			targetItemId: targetItem ? targetItem.id : null,
			targetItemIndex: targetItem ? getIndex(targetItem) : null,
			isBetweenBounds: rootState.isBetweenBounds,
			canRemoveOnDropOut: canRemoveOnDropOut || false,
			isCanceled: action.includes('cancel'),
		});

		if (typeof pointerId === 'number' && draggedItem?.hasPointerCapture(pointerId))
			draggedItem?.releasePointerCapture(pointerId);
		pointerId = null;
		rootState.pointer = null;
		rootState.pointerOrigin = null;
		rootState.draggedItem = null;
		rootState.targetItem = null;
		rootState.itemRectsSnapshot = null;
		rootState.isBetweenBounds = true;
	}

	function interruptDropTransition(
		element: HTMLElement | null | undefined,
		action: 'ptr-drop' | 'ptr-cancel' | 'kbd-drop' | 'kbd-cancel'
	) {
		// Prevent the pending `transitionend`/timeout from triggering handlePointerAndKeyboardDragEnd().
		skipDragEnd?.();
		element?.getAnimations().forEach((animation) => animation.finish());

		handlePointerAndKeyboardDragEnd(action);
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
			To display your list, put a few <code>&lt;SortableList.Item&gt;</code> inside your
			<code>&lt;SortableList.Root&gt;</code>.
		</p>
	{/if}
</ul>
<SortableListGhost bind:ref={ghostRef} />
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
		touch-action: none;

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
