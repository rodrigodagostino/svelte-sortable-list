<script lang="ts">
	import { afterUpdate, beforeUpdate, createEventDispatcher, onMount, tick } from 'svelte';
	import { browser } from '$app/environment';
	import Ghost from '$lib/components/Ghost.svelte';
	import type {
		DragStartEventDetail,
		DragEventDetail,
		DragEndEventDetail,
		DropEventDetail,
		GhostProps,
		MountedEventDetail,
		SortableListProps,
	} from '$lib/types/index.js';
	import {
		areColliding,
		getClosestScrollableAncestor,
		getCollidingItem,
		getId,
		getIndex,
		getItemsData,
		getScrollingSpeed,
		isFullyVisible,
		isOrResidesInInteractiveElement,
		isRootElement,
		isScrollable,
		screenReaderText,
		scrollIntoView,
		shouldAutoScroll,
	} from '$lib/utils/index.js';
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
		setItemsData,
		setListProps,
		setPointer,
		setPointerOrigin,
		setTargetItem,
	} from '$lib/stores/index.js';

	let listRef: HTMLUListElement;
	let ghostRef: HTMLDivElement;

	export let gap: SortableListProps['gap'] = 12;
	export let direction: SortableListProps['direction'] = 'vertical';
	export let transitionDuration: SortableListProps['transitionDuration'] = 240;
	export let hasDropMarker: SortableListProps['hasDropMarker'] = false;
	export let hasLockedAxis: SortableListProps['hasLockedAxis'] = false;
	export let hasBoundaries: SortableListProps['hasBoundaries'] = false;
	export let canClearOnDragOut: SortableListProps['canClearOnDragOut'] = false;
	export let canRemoveOnDropOut: SortableListProps['canRemoveOnDropOut'] = false;
	export let isLocked: SortableListProps['isLocked'] = false;
	export let isDisabled: SortableListProps['isDisabled'] = false;

	const props = setListProps({
		gap,
		direction,
		transitionDuration,
		hasDropMarker,
		hasLockedAxis,
		hasBoundaries,
		canClearOnDragOut,
		canRemoveOnDropOut,
		isLocked,
		isDisabled,
	});
	$: $props = {
		gap,
		direction,
		transitionDuration,
		hasDropMarker,
		hasLockedAxis,
		hasBoundaries,
		canClearOnDragOut,
		canRemoveOnDropOut,
		isLocked,
		isDisabled,
	};

	let ghostStatus: GhostProps['status'] = 'unset';
	const pointer = setPointer(null);
	const pointerOrigin = setPointerOrigin(null);
	const itemsData = setItemsData(null);
	const draggedItem = setDraggedItem(null);
	const targetItem = setTargetItem(null);
	const focusedItem = setFocusedItem(null);
	let liveText: string = '';

	$: scrollableAncestor = getClosestScrollableAncestor(listRef);
	let scrollingSpeed = 0;
	let isScrollingDocument = true;
	$: if (scrollableAncestor) isScrollingDocument = isRootElement(scrollableAncestor, direction);
	$: if (scrollingSpeed !== 0) scroll();

	function scroll() {
		if (!scrollableAncestor) return;

		if (browser)
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
	// so we need to manually keep focus on the selected <SortableItem> as items are sorted.
	// https://github.com/sveltejs/svelte/issues/3973
	let activeElement: HTMLElement;
	beforeUpdate(() => {
		activeElement = document?.activeElement as HTMLElement;
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

	const dispatch = createEventDispatcher<{
		mounted: MountedEventDetail;
		dragstart: DragStartEventDetail;
		drag: DragEventDetail;
		drop: DropEventDetail;
		dragend: DragEndEventDetail;
	}>();

	onMount(() => {
		dispatch('mounted');
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
		const currItem: HTMLLIElement | null = target.closest('.ssl-item');
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
		// the focus on the current <SortableItem>.
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
		// Prevent focus from being set on the current <SortableItem>.
		event.preventDefault();

		currItem.setPointerCapture(event.pointerId);

		$isPointerDragging = true;
		await tick();
		$pointer = { x: event.clientX, y: event.clientY };
		$pointerOrigin = { x: event.clientX, y: event.clientY };
		$draggedItem = currItem;
		$itemsData = getItemsData(listRef);
		ghostStatus = 'init';
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

		const listRect = listRef.getBoundingClientRect();
		const ghostRect = ghostRef.getBoundingClientRect();

		$pointer = { x: clientX, y: clientY };
		$isBetweenBounds = areColliding(ghostRect, listRect);

		// Re-set itemsData only during scrolling.
		// (setting it here instead of in the `scroll()` function to reduce the performance impact)
		if (scrollingSpeed !== 0) $itemsData = getItemsData(listRef);
		await tick();
		const collidingItemData = getCollidingItem(ghostRef, $itemsData);
		if (collidingItemData)
			$targetItem = listRef.querySelector<HTMLLIElement>(
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

		if (target === listRef || target === $focusedItem) {
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
					$itemsData = getItemsData(listRef);
					dispatch('dragstart', {
						deviceType: 'keyboard',
						draggedItem: $draggedItem,
						draggedItemId: getId($focusedItem),
						draggedItemIndex: getIndex($focusedItem),
						isBetweenBounds: $isBetweenBounds,
						canRemoveOnDropOut: canRemoveOnDropOut || false,
					});
					if ($draggedItem) liveText = screenReaderText.lifted($draggedItem);
				} else {
					handlePointerAndKeyboardDrop($focusedItem, 'keyboard-drop');
				}
			}

			if (key === 'ArrowUp' || key === 'ArrowLeft' || key === 'ArrowDown' || key === 'ArrowRight') {
				event.preventDefault();

				const step = key === 'ArrowUp' || key === 'ArrowLeft' ? -1 : 1;
				const draggedItemIndex = ($draggedItem && getIndex($draggedItem)) ?? null;
				const targetItemIndex = ($targetItem && getIndex($targetItem)) ?? null;
				const focusedItemIndex = ($focusedItem && getIndex($focusedItem)) ?? null;

				if (!$isKeyboardDragging) {
					if (!$focusedItem || focusedItemIndex === null) {
						const firstItemElement = listRef.querySelector<HTMLLIElement>('.ssl-item');
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
					const items = listRef.querySelectorAll<HTMLLIElement>('.ssl-item');
					if (
						(key === 'ArrowUp' && focusedItemIndex === 0) ||
						(key === 'ArrowLeft' && focusedItemIndex === 0) ||
						(key === 'ArrowDown' && focusedItemIndex === items.length - 1) ||
						(key === 'ArrowRight' && focusedItemIndex === items.length - 1)
					)
						return;

					if (step === 1)
						($focusedItem.nextElementSibling as HTMLLIElement)?.focus({ preventScroll: true });
					else
						($focusedItem.previousElementSibling as HTMLLIElement)?.focus({ preventScroll: true });
				} else {
					if (!$draggedItem || !$itemsData) return;
					// Prevent moving the selected item if it’s the first or last item,
					// or is at the top or bottom of the list.
					if (
						((key === 'ArrowUp' || key === 'ArrowLeft') && draggedItemIndex === 0 && !targetItem) ||
						((key === 'ArrowUp' || key === 'ArrowLeft') && targetItemIndex === 0) ||
						((key === 'ArrowDown' || key === 'ArrowRight') &&
							draggedItemIndex === $itemsData.length - 1 &&
							!targetItem) ||
						((key === 'ArrowDown' || key === 'ArrowRight') &&
							targetItemIndex === $itemsData.length - 1)
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
					dispatch('drag', {
						deviceType: 'keyboard',
						draggedItem: $draggedItem,
						draggedItemId: getId($draggedItem),
						draggedItemIndex: getIndex($draggedItem),
						targetItem: $targetItem,
						targetItemId: $targetItem ? getId($targetItem) : null,
						targetItemIndex: $targetItem ? getIndex($targetItem) : null,
						isBetweenBounds: $isBetweenBounds,
						canRemoveOnDropOut: canRemoveOnDropOut || false,
					});
					if (scrollableAncestor && !isFullyVisible($targetItem, scrollableAncestor))
						scrollIntoView($targetItem, scrollableAncestor, direction, step, isScrollingDocument);
					liveText = screenReaderText.dragged($draggedItem, $targetItem, key);
				}

				await tick();
				const scrollTarget = !$isKeyboardDragging ? $focusedItem : $targetItem;
				if (scrollTarget && scrollableAncestor && !isFullyVisible(scrollTarget, scrollableAncestor))
					scrollIntoView(scrollTarget, scrollableAncestor, direction, step, isScrollingDocument);
			}

			if (key === 'Home' || key === 'End') {
				event.preventDefault();

				const items = listRef.querySelectorAll<HTMLLIElement>('.ssl-item');
				const draggedItemIndex = ($draggedItem && getIndex($draggedItem)) ?? null;
				const targetItemIndex = ($targetItem && getIndex($targetItem)) ?? null;
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
					liveText = screenReaderText.dragged($draggedItem, $targetItem, key);
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
			(action.includes('pointer') &&
				(!$draggedItem || !$isPointerDragging || $isPointerDropping)) ||
			(action.includes('keyboard') &&
				(!$draggedItem || !$isKeyboardDragging || $isKeyboardDropping))
		)
			return;

		if ($draggedItem)
			dispatch('drop', {
				deviceType: action.includes('pointer') ? 'pointer' : 'keyboard',
				draggedItem: $draggedItem,
				draggedItemId: getId($draggedItem),
				draggedItemIndex: getIndex($draggedItem),
				targetItem: $targetItem,
				targetItemId: $targetItem ? getId($targetItem) : null,
				targetItemIndex: $targetItem ? getIndex($targetItem) : null,
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
			liveText = screenReaderText.dropped($draggedItem, $targetItem);
		} else if (action === 'keyboard-cancel' && $draggedItem) {
			$isKeyboardDragging = false;
			$isKeyboardDropping = true;
			$isKeyboardCanceling = true;
			await tick();
			if (scrollableAncestor)
				scrollIntoView($draggedItem, scrollableAncestor, direction, -1, isScrollingDocument);
			liveText = screenReaderText.canceled($draggedItem);
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

<ul
	bind:this={listRef}
	class="ssl-list"
	style:--gap="{gap}px"
	style:--transition-duration="{transitionDuration}ms"
	style:pointer-events={$focusedItem ? 'none' : 'auto'}
	data-has-drop-marker={hasDropMarker}
	data-can-remove-on-drop-out={canRemoveOnDropOut}
	data-is-locked={isLocked}
	data-is-disabled={isDisabled}
	role="listbox"
	aria-orientation={direction}
	aria-disabled={isDisabled}
	aria-activedescendant={$focusedItem ? $focusedItem.id : undefined}
	aria-label="Drag and drop list. Use Arrow Up and Arrow Down to move through the list items."
	tabindex="0"
	on:pointerdown={handlePointerDown}
	on:pointercancel={handlePointerCancel}
	on:keydown={handleKeyDown}
	on:itemfocusout={(event) => handlePointerAndKeyboardDrop(event.detail.item, 'keyboard-cancel')}
>
	<slot>
		<p>
			To display your list, provide an array of <code>items</code> to
			<code>{'<SortableList>'}</code>.
		</p>
	</slot>
</ul>
<div class="ssl-live-region" role="log" aria-live="assertive" aria-atomic="true">
	{liveText}
</div>
<Ghost bind:ghostRef status={ghostStatus} {listRef} />

<style lang="scss">
	.ssl-list,
	.ssl-list :global(*) {
		box-sizing: border-box;
	}

	.ssl-list {
		display: flex;
		padding-inline-start: 0;
		margin: calc(var(--gap) / 2 * -1);
		outline-offset: calc(var(--gap) / 2 * -1);

		&[aria-orientation='vertical'] {
			flex-direction: column;
			padding-inline: calc(var(--gap) / 2);
		}

		&[aria-orientation='horizontal'] {
			flex-direction: row;
			padding-block: calc(var(--gap) / 2);
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
