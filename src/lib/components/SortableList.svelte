<script lang="ts">
	import { afterUpdate, beforeUpdate, createEventDispatcher, onMount, tick } from 'svelte';
	import { BROWSER } from 'esm-env';
	import SortableListGhost from '$lib/components/SortableListGhost.svelte';
	import {
		setDraggedItem,
		setFocusedItem,
		setIsBetweenBounds,
		setIsKeyboardCanceling,
		setIsKeyboardDragging,
		setIsKeyboardDropping,
		setIsPointerCanceling,
		setIsPointerDragging,
		setIsPointerDropping,
		setIsRTL,
		setItemsData,
		setPointer,
		setPointerOrigin,
		setRootProps,
		setTargetItem,
	} from '$lib/stores/index.js';
	import type {
		DragEndEventDetail,
		DragEventDetail,
		DragStartEventDetail,
		DropEventDetail,
		MountedEventDetail,
		SortableListGhostProps,
		SortableListRootEvents,
		SortableListRootProps,
	} from '$lib/types/index.js';
	import {
		announce,
		areColliding,
		getClosestScrollableAncestor,
		getCollidingItem,
		getId,
		getIndex,
		getItemsData,
		getScrollingSpeed,
		getTextDirection,
		isFullyVisible,
		isOrResidesInInteractiveElement,
		isRootElement,
		isScrollable,
		scrollIntoView,
		shouldAutoScroll,
	} from '$lib/utils/index.js';

	type $$Props = SortableListRootProps;
	type $$Events = SortableListRootEvents;

	let rootRef: HTMLUListElement;
	let ghostRef: HTMLDivElement;

	export let gap: $$Props['gap'] = 12;
	export let direction: $$Props['direction'] = 'vertical';
	export let transitionDuration: $$Props['transitionDuration'] = 240;
	export let hasDropMarker: $$Props['hasDropMarker'] = false;
	export let hasWrapping: $$Props['hasWrapping'] = false;
	export let hasLockedAxis: $$Props['hasLockedAxis'] = false;
	export let hasBoundaries: $$Props['hasBoundaries'] = false;
	export let canClearOnDragOut: $$Props['canClearOnDragOut'] = false;
	export let canRemoveOnDropOut: $$Props['canRemoveOnDropOut'] = false;
	export let isLocked: $$Props['isLocked'] = false;
	export let isDisabled: $$Props['isDisabled'] = false;
	export let announcements: $$Props['announcements'] = announce;

	const rootProps = setRootProps({
		gap,
		direction,
		transitionDuration,
		hasDropMarker,
		hasWrapping,
		hasLockedAxis,
		hasBoundaries,
		canClearOnDragOut,
		canRemoveOnDropOut,
		isLocked,
		isDisabled,
		announcements,
	});
	$: $rootProps = {
		gap,
		direction,
		transitionDuration,
		hasDropMarker,
		hasWrapping,
		hasLockedAxis,
		hasBoundaries,
		canClearOnDragOut,
		canRemoveOnDropOut,
		isLocked,
		isDisabled,
		announcements,
	};

	let ghostStatus: SortableListGhostProps['status'] = 'unset';
	const pointer = setPointer(null);
	const pointerOrigin = setPointerOrigin(null);
	const itemsData = setItemsData(null);
	const draggedItem = setDraggedItem(null);
	const targetItem = setTargetItem(null);
	const focusedItem = setFocusedItem(null);
	let liveText: string = '';

	const dispatch = createEventDispatcher<{
		mounted: MountedEventDetail;
		dragstart: DragStartEventDetail;
		drag: DragEventDetail;
		drop: DropEventDetail;
		dragend: DragEndEventDetail;
	}>();

	$: scrollableAncestor = getClosestScrollableAncestor(rootRef);
	let scrollingSpeed = 0;
	let isScrollingDocument = true;
	$: if (scrollableAncestor) isScrollingDocument = isRootElement(scrollableAncestor, direction);
	$: if (scrollingSpeed !== 0) scroll();

	function scroll() {
		if (!scrollableAncestor) return;

		if (BROWSER)
			requestAnimationFrame(() => {
				if (!shouldAutoScroll(scrollableAncestor, direction, scrollingSpeed)) return;

				const x = direction === 'horizontal' ? scrollingSpeed : 0;
				const y = direction === 'vertical' ? scrollingSpeed : 0;
				scrollableAncestor.scrollBy(x, y);

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

	// Svelte currently does not retain focus when elements are moved (even when keyed),
	// so we need to manually keep focus on the selected <SortableList.Item> as items are sorted.
	// https://github.com/sveltejs/svelte/issues/3973
	let activeElement: HTMLLIElement;
	beforeUpdate(() => {
		activeElement = document?.activeElement as HTMLLIElement;
	});
	afterUpdate(() => {
		if (activeElement) activeElement.focus({ preventScroll: true });
	});

	const isPointerDragging = setIsPointerDragging(false);
	const isPointerDropping = setIsPointerDropping(false);
	const isKeyboardDragging = setIsKeyboardDragging(false);
	const isKeyboardDropping = setIsKeyboardDropping(false);
	const isPointerCanceling = setIsPointerCanceling(false);
	const isKeyboardCanceling = setIsKeyboardCanceling(false);
	const isBetweenBounds = setIsBetweenBounds(true);
	const isRTL = setIsRTL(false);

	onMount(() => {
		dispatch('mounted');
		$isRTL = getTextDirection(rootRef) === 'rtl';
	});

	async function handlePointerDown(event: PointerEvent) {
		if (
			$isPointerDragging ||
			$isPointerDropping ||
			$isKeyboardDragging ||
			$isKeyboardDropping ||
			$isKeyboardCanceling ||
			$focusedItem
		)
			return;

		const target = event.target as HTMLElement;
		const currItem = target.closest<HTMLLIElement>('.ssl-item');
		if (!currItem) return;

		if (
			(isLocked && !isOrResidesInInteractiveElement(target, currItem)) ||
			(currItem.dataset.isLocked === 'true' &&
				!isOrResidesInInteractiveElement(target, currItem)) ||
			isDisabled ||
			currItem.getAttribute('aria-disabled') === 'true'
		) {
			event.preventDefault();
			return;
		}

		// Prevent default if the clicked/tapped element is a label with a for attribute.
		// NOTE 1: for some reason that is still unknown to me, clicking/tapping a <label> element sets
		// the focus on the current <SortableList.Item>.
		// NOTE 2: We need to run this check before isOrResidesInInteractiveElement() because, if the
		// target is a <label> element, it will stop the execution of this event handler and the
		// preventDefault() right after will never run, but we can’t preventDefault() for every element
		// because we need to allow interactive elements to run normally.
		if (target.tagName.toLowerCase() === 'label' && target.hasAttribute('for'))
			event.preventDefault();

		// Prevent dragging if the current list item contains a handle, but we’re not dragging from it.
		const hasHandle = !!currItem.querySelector('[data-role="handle"]');
		const targetIsOrResidesInHandle = target.closest('[data-role="handle"]');
		if (hasHandle && !targetIsOrResidesInHandle) return;

		// Prevent dragging if the current list item contains an interactive element
		// and we’re also not dragging from a handle inside that interactive element.
		if (isOrResidesInInteractiveElement(target, currItem) && !targetIsOrResidesInHandle) return;
		// Prevent focus from being set on the current <SortableList.Item>.
		event.preventDefault();

		currItem.setPointerCapture(event.pointerId);

		$pointer = { x: event.clientX, y: event.clientY };
		$pointerOrigin = { x: event.clientX, y: event.clientY };
		$draggedItem = currItem;
		$itemsData = getItemsData(rootRef);
		ghostStatus = 'init';
		await tick();
		$isPointerDragging = true;
		dispatch('dragstart', {
			deviceType: 'pointer',
			draggedItem: currItem,
			draggedItemId: getId(currItem),
			draggedItemIndex: getIndex(currItem),
			isBetweenBounds: $isBetweenBounds,
			canRemoveOnDropOut: canRemoveOnDropOut || false,
		});

		currItem.addEventListener('pointermove', handlePointerMove);
		currItem.addEventListener(
			'pointerup',
			() => {
				currItem.removeEventListener('pointermove', handlePointerMove);
				handlePointerUp();
			},
			{ once: true }
		);
	}

	async function handlePointerMove({ clientX, clientY }: PointerEvent) {
		if (!$isPointerDragging || !ghostRef || !$itemsData || !$draggedItem) return;

		dispatch('drag', {
			deviceType: 'pointer',
			draggedItem: $draggedItem,
			draggedItemId: getId($draggedItem),
			draggedItemIndex: getIndex($draggedItem),
			targetItem: $targetItem,
			targetItemId: $targetItem ? getId($targetItem) : null,
			targetItemIndex: $targetItem ? getIndex($targetItem) : null,
			isBetweenBounds: $isBetweenBounds,
			canRemoveOnDropOut: canRemoveOnDropOut || false,
		});

		const rootRect = rootRef.getBoundingClientRect();
		const ghostRect = ghostRef.getBoundingClientRect();

		$pointer = { x: clientX, y: clientY };
		$isBetweenBounds = areColliding(ghostRect, rootRect);

		// Re-set itemsData only during scrolling.
		// (setting it here instead of in the `scroll()` function to reduce the performance impact)
		if (scrollingSpeed !== 0) $itemsData = getItemsData(rootRef);
		await tick();
		const collidingItemData = getCollidingItem(ghostRef, $itemsData);
		if (collidingItemData)
			$targetItem = rootRef.querySelector<HTMLLIElement>(
				`.ssl-item[data-item-id="${collidingItemData.id}"]`
			);
		else if (canClearOnDragOut || (canRemoveOnDropOut && !$isBetweenBounds)) $targetItem = null;

		if (isScrollable(scrollableAncestor, direction)) autoScroll(clientX, clientY);
	}

	function handlePointerUp() {
		handlePointerAndKeyboardDrop(ghostRef, 'pointer-drop');
	}

	function handlePointerCancel() {
		handlePointerAndKeyboardDrop(ghostRef, 'pointer-cancel');
	}

	async function handleKeyDown(event: KeyboardEvent) {
		if ($isKeyboardDropping) {
			event.preventDefault();
			return;
		}

		const { key } = event;
		const target = event.target as HTMLElement;

		if (target === rootRef || target === $focusedItem) {
			if (key === ' ') {
				// Prevent default only if the target is a sortable item.
				// This allows interactive elements (like buttons) to operate normally.
				if (
					!target.classList.contains('ssl-item') ||
					isLocked ||
					target.dataset.isLocked === 'true'
				)
					return;
				else event.preventDefault();

				if (!$focusedItem || target.getAttribute('aria-disabled') === 'true') return;

				if (!$isKeyboardDragging) {
					$isKeyboardDragging = true;

					await tick();
					$draggedItem = $focusedItem;
					const draggedItemId = getId($focusedItem);
					const draggedItemIndex = getIndex($focusedItem);
					$itemsData = getItemsData(rootRef);
					dispatch('dragstart', {
						deviceType: 'keyboard',
						draggedItem: $draggedItem,
						draggedItemId,
						draggedItemIndex,
						isBetweenBounds: $isBetweenBounds,
						canRemoveOnDropOut: canRemoveOnDropOut || false,
					});
					liveText = announcements!.lifted($draggedItem, draggedItemIndex);
				} else {
					handlePointerAndKeyboardDrop($focusedItem, 'keyboard-drop');
				}
			}

			if (key === 'ArrowUp' || key === 'ArrowLeft' || key === 'ArrowDown' || key === 'ArrowRight') {
				event.preventDefault();

				const step =
					key === 'ArrowUp' || (key === 'ArrowLeft' && !$isRTL) || (key === 'ArrowRight' && $isRTL)
						? -1
						: 1;
				const focusedItemIndex = $focusedItem ? getIndex($focusedItem) : null;

				if (!$isKeyboardDragging) {
					if (!$focusedItem || focusedItemIndex === null) {
						const firstItemElement = rootRef.querySelector<HTMLLIElement>('.ssl-item');
						if (!firstItemElement) return;
						firstItemElement.focus({ preventScroll: true });
						if (scrollableAncestor && !isFullyVisible(firstItemElement, scrollableAncestor))
							scrollIntoView(
								firstItemElement,
								scrollableAncestor,
								direction,
								-1,
								isScrollingDocument
							);
						return;
					}

					// Prevent focusing the previous item if the current one is the first,
					// and focusing the next item if the current one is the last.
					const items = rootRef.querySelectorAll<HTMLLIElement>('.ssl-item');
					if (
						(step === -1 && focusedItemIndex === 0) ||
						(step === 1 && focusedItemIndex === items.length - 1)
					)
						return;

					if (step === 1)
						($focusedItem.nextElementSibling as HTMLLIElement)?.focus({ preventScroll: true });
					else
						($focusedItem.previousElementSibling as HTMLLIElement)?.focus({ preventScroll: true });
				} else {
					if (!$draggedItem || !$itemsData) return;

					const draggedItemId = getId($draggedItem);
					const draggedItemIndex = getIndex($draggedItem);
					let targetItemId = $targetItem ? getId($targetItem) : null;
					let targetItemIndex = $targetItem ? getIndex($targetItem) : null;
					// Prevent moving the selected item if it’s the first or last item,
					// or is at the top or bottom of the list.
					if (
						(step === -1 && draggedItemIndex === 0 && !targetItem) ||
						(step === -1 && targetItemIndex === 0) ||
						(step === 1 && draggedItemIndex === $itemsData.length - 1 && !targetItem) ||
						(step === 1 && targetItemIndex === $itemsData.length - 1)
					)
						return;

					if (!$targetItem) {
						$targetItem =
							step === 1
								? ($draggedItem.nextElementSibling as HTMLLIElement)
								: ($draggedItem.previousElementSibling as HTMLLIElement);
					} else {
						$targetItem =
							step === 1
								? ($targetItem.nextElementSibling as HTMLLIElement)
								: ($targetItem.previousElementSibling as HTMLLIElement);
					}

					await tick();
					targetItemId = getId($targetItem);
					targetItemIndex = getIndex($targetItem);
					dispatch('drag', {
						deviceType: 'keyboard',
						draggedItem: $draggedItem,
						draggedItemId,
						draggedItemIndex,
						targetItem: $targetItem,
						targetItemId,
						targetItemIndex,
						isBetweenBounds: $isBetweenBounds,
						canRemoveOnDropOut: canRemoveOnDropOut || false,
					});
					if (scrollableAncestor && !isFullyVisible($targetItem, scrollableAncestor))
						scrollIntoView($targetItem, scrollableAncestor, direction, step, isScrollingDocument);
					liveText = announcements!.dragged(
						$draggedItem,
						draggedItemIndex,
						$targetItem,
						targetItemIndex
					);
				}

				await tick();
				const scrollTarget = !$isKeyboardDragging ? $focusedItem : $targetItem;
				if (scrollTarget && scrollableAncestor && !isFullyVisible(scrollTarget, scrollableAncestor))
					scrollIntoView(scrollTarget, scrollableAncestor, direction, step, isScrollingDocument);
			}

			if (key === 'Home' || key === 'End') {
				event.preventDefault();

				const items = rootRef.querySelectorAll<HTMLLIElement>('.ssl-item');
				const focusedItemIndex = ($focusedItem && getIndex($focusedItem)) ?? null;

				if (!$isKeyboardDragging) {
					// Prevent focusing the previous item if the current one is the first,
					// and focusing the next item if the current one is the last.
					if (
						(key === 'Home' && focusedItemIndex === 0) ||
						(key === 'End' && focusedItemIndex === items.length - 1)
					)
						return;

					if (key === 'Home') items[0]?.focus({ preventScroll: true });
					else items[items.length - 1]?.focus({ preventScroll: true });
				} else {
					if (!$draggedItem || !$itemsData) return;

					const draggedItemIndex = getIndex($draggedItem);
					const targetItemIndex = $targetItem ? getIndex($targetItem) : null;
					// Prevent moving the selected item if it’s the first or last item,
					// or is at the top or bottom of the list.
					if (
						(key === 'Home' && draggedItemIndex === 0 && !targetItem) ||
						(key === 'Home' && targetItemIndex === 0) ||
						(key === 'End' && draggedItemIndex === $itemsData.length - 1 && !targetItem) ||
						(key === 'End' && targetItemIndex === $itemsData.length - 1)
					)
						return;

					$targetItem = key === 'Home' ? items[0] : items[items.length - 1];
					liveText = announcements!.dragged(
						$draggedItem,
						draggedItemIndex,
						$targetItem,
						getIndex($targetItem)
					);
				}

				await tick();
				const scrollTarget = !$isKeyboardDragging ? $focusedItem : $targetItem;
				const step = key === 'Home' ? -1 : 1;
				if (scrollTarget && scrollableAncestor && !isFullyVisible(scrollTarget, scrollableAncestor))
					scrollIntoView(scrollTarget, scrollableAncestor, direction, step, isScrollingDocument);
			}

			if (key === 'Escape' && $draggedItem) {
				handlePointerAndKeyboardDrop($draggedItem, 'keyboard-cancel');
			}
		}
	}

	async function handlePointerAndKeyboardDragEnd(
		action: 'pointer-drop' | 'pointer-cancel' | 'keyboard-drop' | 'keyboard-cancel'
	) {
		if ($draggedItem)
			dispatch('dragend', {
				deviceType: action.includes('pointer') ? 'pointer' : 'keyboard',
				draggedItem: $draggedItem,
				draggedItemId: getId($draggedItem),
				draggedItemIndex: getIndex($draggedItem),
				targetItem: $targetItem,
				targetItemId: $targetItem ? getId($targetItem) : null,
				targetItemIndex: $targetItem ? getIndex($targetItem) : null,
				isBetweenBounds: $isBetweenBounds,
				canRemoveOnDropOut: canRemoveOnDropOut || false,
				isCanceled: action.includes('cancel'),
			});

		$draggedItem = null;
		$targetItem = null;
		$itemsData = null;

		if (action.includes('pointer')) {
			ghostStatus = 'unset';
			$pointer = null;
			$pointerOrigin = null;
			$isPointerDropping = false;
			$isBetweenBounds = true;
		} else $isKeyboardDropping = false;

		if (action === 'pointer-cancel') $isPointerCanceling = false;
		if (action === 'keyboard-cancel') $isKeyboardCanceling = false;
	}

	async function handlePointerAndKeyboardDrop(
		element: HTMLElement,
		action: 'pointer-drop' | 'pointer-cancel' | 'keyboard-drop' | 'keyboard-cancel'
	) {
		if (
			!$draggedItem ||
			(action.includes('pointer') && (!$isPointerDragging || $isPointerDropping)) ||
			(action.includes('keyboard') && (!$isKeyboardDragging || $isKeyboardDropping))
		)
			return;

		const draggedItemId = getId($draggedItem);
		const draggedItemIndex = getIndex($draggedItem);
		const targetItemId = $targetItem ? getId($targetItem) : null;
		const targetItemIndex = $targetItem ? getIndex($targetItem) : null;

		if ($draggedItem)
			dispatch('drop', {
				deviceType: action.includes('pointer') ? 'pointer' : 'keyboard',
				draggedItem: $draggedItem,
				draggedItemId,
				draggedItemIndex,
				targetItem: $targetItem,
				targetItemId,
				targetItemIndex,
				isBetweenBounds: $isBetweenBounds,
				canRemoveOnDropOut: canRemoveOnDropOut || false,
			});

		if (action === 'pointer-drop') {
			$isPointerDragging = false;
			ghostStatus = !$isBetweenBounds && canRemoveOnDropOut ? 'remove' : 'preset';
			await tick();
			if (ghostStatus !== 'remove') ghostStatus = 'set';
			$isPointerDropping = true;
			scrollingSpeed = 0;
		} else if (action === 'pointer-cancel') {
			$isPointerDragging = false;
			$isPointerCanceling = true;
			if (ghostStatus !== 'remove') ghostStatus = 'set';
			$isPointerDropping = true;
			scrollingSpeed = 0;
		}

		if (action === 'keyboard-drop' && $draggedItem) {
			$isKeyboardDragging = false;
			$isKeyboardDropping = true;
			liveText = announcements!.dropped(
				$draggedItem,
				draggedItemIndex,
				$targetItem,
				targetItemIndex
			);
		} else if (action === 'keyboard-cancel' && $draggedItem) {
			$isKeyboardDragging = false;
			$isKeyboardDropping = true;
			$isKeyboardCanceling = true;
			await tick();
			if (scrollableAncestor)
				scrollIntoView($draggedItem, scrollableAncestor, direction, -1, isScrollingDocument);
			liveText = announcements!.canceled($draggedItem, draggedItemIndex);
		}

		function handleTransitionEnd({ propertyName }: TransitionEvent) {
			if (propertyName === 'z-index') {
				handlePointerAndKeyboardDragEnd(action);
				element?.removeEventListener('transitionend', handleTransitionEnd);
			}
		}

		if (transitionDuration! > 0) element?.addEventListener('transitionend', handleTransitionEnd);
		else handlePointerAndKeyboardDragEnd(action);
	}
</script>

<!-- svelte-ignore a11y-role-supports-aria-props -->
<ul
	bind:this={rootRef}
	class="ssl-list"
	style:--ssl-gap="{gap}px"
	style:--ssl-wrap={hasWrapping ? 'wrap' : 'nowrap'}
	style:--ssl-transition-duration="{transitionDuration}ms"
	style:pointer-events={$focusedItem ? 'none' : 'auto'}
	data-has-drop-marker={hasDropMarker}
	data-can-remove-on-drop-out={canRemoveOnDropOut}
	data-is-locked={isLocked}
	tabindex="0"
	role="listbox"
	aria-label={$$restProps['aria-label'] || undefined}
	aria-labelledby={$$restProps['aria-labelledby'] || undefined}
	aria-description={!$$restProps['aria-describedby']
		? $$restProps['aria-description'] ||
			'Press the arrow keys to move through the list items. Press Space to start dragging an item. When dragging, use the arrow keys to move the item around. Press Space again to drop the item, or Escape to cancel.'
		: undefined}
	aria-describedby={$$restProps['aria-describedby'] || undefined}
	aria-orientation={direction}
	aria-activedescendant={$focusedItem ? $focusedItem.id : undefined}
	aria-disabled={isDisabled}
	on:pointerdown={handlePointerDown}
	on:pointercancel={handlePointerCancel}
	on:keydown={handleKeyDown}
	on:itemfocusout={(event) => handlePointerAndKeyboardDrop(event.detail.item, 'keyboard-cancel')}
>
	<slot>
		<p>
			To display your list, provide an array of <code>items</code> to
			<code>{'<SortableList.Root>'}</code>.
		</p>
	</slot>
</ul>
<SortableListGhost bind:ghostRef status={ghostStatus} {rootRef} />
<div class="ssl-live-region" aria-live="assertive" aria-atomic="true">{liveText}</div>

<!--
@component
## SortableList
Serves as the primary container. Provides the main structure, the drag-and-drop interactions and emits the available events.

### Props
- `gap`: separation between items (in pixels).
- `direction`: orientation in which items will be arranged.
- `transitionDuration`: time the transitions for the ghost (dropping) and items (translation, addition, removal) take to complete (in milliseconds).
- `hasDropMarker`: displays a position marker representing where the dragged item will be positioned when drag-and-dropping.
- `hasLockedAxis`: prevents the dragged item from moving away from the main axis.
- `hasBoundaries`: items will only be draggable inside the list limits.
- `canClearOnDragOut`: the target item will be cleared when a the dragged item (by a pointing device) does not collide with any of the items in the list.
- `canRemoveOnDropOut`: items will be removed when dragged and dropped outside of the list boundaries.
- `isLocked`: allows items to be focused, but prevents them from being dragged. Interactive elements inside will operate normally.
- `isDisabled`: allows items to be focused, but prevents them from being dragged and change its appearance to dimmed. Interactive elements inside will be disabled.

### Events
- `on:mounted`: the component is mounted.
- `on:dragstart`: an item starts to be dragged by a pointer device or a keyboard.
- `on:drag`: a dragged item is moved around by a pointer device or a keyboard (fires every few hundred milliseconds).
- `on:drop`: a dragged item is released by a pointer device or a keyboard.
- `on:dragend`: a dragged item reaches its destination after being released.

### Usage
```svelte
	<SortableList.Root on:dragend={handleDragEnd}>
		{#each items as item, index (item.id)}
			<SortableList.Item {...item} {index}>
				<div class="ssl-item-content">
					{item.text}
				</div>
			</SortableList.Item>
		{/each}
	</SortableList.Root>
```
-->

<style>
	.ssl-list,
	.ssl-list :global(*) {
		box-sizing: border-box;
	}

	.ssl-list {
		display: flex;
		flex-wrap: var(--ssl-wrap);
		padding-inline-start: 0;
		margin: calc(var(--ssl-gap) / 2 * -1);
		outline-offset: calc(var(--ssl-gap) / 2 * -1);

		&[aria-orientation='vertical'] {
			flex-direction: column;
		}

		&[aria-orientation='horizontal'] {
			flex-direction: row;
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
