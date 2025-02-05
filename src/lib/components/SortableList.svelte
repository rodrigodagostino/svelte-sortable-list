<script lang="ts">
	import { afterUpdate, beforeUpdate, createEventDispatcher, tick } from 'svelte';
	import Ghost from '$lib/components/Ghost.svelte';
	import type {
		GhostProps,
		RemoveEventDetail,
		SortableListProps,
		SortEventDetail,
	} from '$lib/types/index.js';
	import {
		areColliding,
		getCollidingItem,
		getId,
		getIndex,
		getItemsData,
		isOrResidesInInteractiveElement,
		screenReaderText,
	} from '$lib/utils/index.js';
	import {
		setDraggedItem,
		setFocusedItem,
		setIsGhostBetweenBounds,
		setIsCancelingKeyboardDragging,
		setIsKeyboardDragging,
		setIsKeyboardDropping,
		setIsPointerDragging,
		setIsPointerDropping,
		setIsRemoving,
		setItemsOrigin,
		setListProps,
		setPointer,
		setPointerOrigin,
		setTargetItem,
	} from '$lib/stores/index.js';

	let listRef: HTMLUListElement;
	let ghostRef: HTMLDivElement;

	export let gap: SortableListProps['gap'] = 12;
	export let direction: SortableListProps['direction'] = 'vertical';
	export let swapThreshold: SortableListProps['swapThreshold'] = 1;
	export let transitionDuration: SortableListProps['transitionDuration'] = 320;
	export let hasDropMarker: SortableListProps['hasDropMarker'] = false;
	export let hasLockedAxis: SortableListProps['hasLockedAxis'] = false;
	export let hasBoundaries: SortableListProps['hasBoundaries'] = false;
	export let canClearTargetOnDragOut: SortableListProps['canClearTargetOnDragOut'] = false;
	export let canRemoveItemOnDropOut: SortableListProps['canRemoveItemOnDropOut'] = false;
	export let isLocked: SortableListProps['isLocked'] = false;
	export let isDisabled: SortableListProps['isDisabled'] = false;

	const props = setListProps({
		gap,
		direction,
		swapThreshold,
		transitionDuration,
		hasDropMarker,
		hasLockedAxis,
		hasBoundaries,
		canClearTargetOnDragOut,
		canRemoveItemOnDropOut,
		isLocked,
		isDisabled,
	});
	$: $props = {
		gap,
		direction,
		swapThreshold,
		transitionDuration,
		hasDropMarker,
		hasLockedAxis,
		hasBoundaries,
		canClearTargetOnDragOut,
		canRemoveItemOnDropOut,
		isLocked,
		isDisabled,
	};

	let ghostStatus: GhostProps['status'] = 'unset';
	const pointer = setPointer(null);
	const pointerOrigin = setPointerOrigin(null);
	const itemsOrigin = setItemsOrigin(null);
	const draggedItem = setDraggedItem(null);
	const targetItem = setTargetItem(null);
	const focusedItem = setFocusedItem(null);
	let liveText: string = '';

	// Svelte currently does not retain focus when elements are moved (even when keyed),
	// so we need to manually keep focus on the selected <SortableItem> as items are sorted.
	// https://github.com/sveltejs/svelte/issues/3973
	let activeElement: HTMLElement;
	beforeUpdate(() => {
		activeElement = document?.activeElement as HTMLElement;
	});
	afterUpdate(() => {
		if (activeElement) activeElement.focus();
	});

	const isPointerDragging = setIsPointerDragging(false);
	const isPointerDropping = setIsPointerDropping(false);
	const isKeyboardDragging = setIsKeyboardDragging(false);
	const isKeyboardDropping = setIsKeyboardDropping(false);
	const isCancelingKeyboardDragging = setIsCancelingKeyboardDragging(false);
	const isGhostBetweenBounds = setIsGhostBetweenBounds(true);
	const isRemoving = setIsRemoving(false);

	const dispatch = createEventDispatcher<{
		sort: SortEventDetail;
		remove: RemoveEventDetail;
	}>();

	async function handlePointerDown(event: PointerEvent) {
		if (
			$isPointerDragging ||
			$isPointerDropping ||
			$isKeyboardDragging ||
			$isKeyboardDropping ||
			$isCancelingKeyboardDragging ||
			$focusedItem
		)
			return;

		const target = event.target as HTMLElement;
		const currItem: HTMLLIElement | null = target.closest('.ssl-item');
		if (!currItem) return;

		if (
			(isLocked && !isOrResidesInInteractiveElement(target, currItem)) ||
			(currItem.classList.contains('is-locked') &&
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
		$itemsOrigin = getItemsData(listRef);
		ghostStatus = 'init';

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

	function handlePointerMove({ clientX, clientY }: PointerEvent) {
		if (!$isPointerDragging || !ghostRef || !$itemsOrigin || !$draggedItem) return;

		const listRect = listRef.getBoundingClientRect();
		const ghostRect = ghostRef.getBoundingClientRect();

		$pointer = { x: clientX, y: clientY };
		$isGhostBetweenBounds = areColliding(ghostRect, listRect);

		const enforcedSwapThreshold =
			swapThreshold && swapThreshold < 0.5
				? 0.5
				: swapThreshold && swapThreshold > 2
					? 2
					: swapThreshold;
		const collidingItemData = getCollidingItem(ghostRef, $itemsOrigin, enforcedSwapThreshold);
		if (collidingItemData)
			$targetItem = listRef.querySelector<HTMLLIElement>(
				`.ssl-item[data-id="${collidingItemData.id}"]`
			);
		else if (canClearTargetOnDragOut || (canRemoveItemOnDropOut && !$isGhostBetweenBounds))
			$targetItem = null;
	}

	function handlePointerUp() {
		handleElementDrop(ghostRef, 'pointer-drop');
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
					target.classList.contains('is-locked')
				)
					return;
				else event.preventDefault();

				if (!$focusedItem || target.getAttribute('aria-disabled') === 'true') return;

				if (!$isKeyboardDragging) {
					$isKeyboardDragging = true;

					await tick();
					$draggedItem = $focusedItem;
					$itemsOrigin = getItemsData(listRef);
					if ($draggedItem) liveText = screenReaderText.lifted($draggedItem);
				} else {
					handleElementDrop($focusedItem, 'keyboard-drop');
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
						firstItemElement?.focus();
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

					if (step === 1) ($focusedItem.nextElementSibling as HTMLLIElement)?.focus();
					else ($focusedItem.previousElementSibling as HTMLLIElement)?.focus();
				} else {
					if (!$draggedItem || !$itemsOrigin) return;
					// Prevent moving the selected item if it’s the first or last item,
					// or is at the top or bottom of the list.
					if (
						((key === 'ArrowUp' || key === 'ArrowLeft') && draggedItemIndex === 0 && !targetItem) ||
						((key === 'ArrowUp' || key === 'ArrowLeft') && targetItemIndex === 0) ||
						((key === 'ArrowDown' || key === 'ArrowRight') &&
							draggedItemIndex === $itemsOrigin.length - 1 &&
							!targetItem) ||
						((key === 'ArrowDown' || key === 'ArrowRight') &&
							targetItemIndex === $itemsOrigin.length - 1)
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

					liveText = screenReaderText.dragged($draggedItem, $targetItem, key);
				}
			}

			if (key === 'Home' || key === 'End') {
				event.preventDefault();

				const draggedItemIndex = ($draggedItem && getIndex($draggedItem)) ?? null;
				const targetItemIndex = ($targetItem && getIndex($targetItem)) ?? null;
				const focusedItemIndex = ($focusedItem && getIndex($focusedItem)) ?? null;

				if (!$isKeyboardDragging) {
					// Prevent focusing the previous item if the current one is the first,
					// and focusing the next item if the current one is the last.
					const items = listRef.querySelectorAll<HTMLLIElement>('.ssl-item');
					if (
						(key === 'Home' && focusedItemIndex === 0) ||
						(key === 'End' && focusedItemIndex === items.length - 1)
					)
						return;

					if (key === 'Home') items[0]?.focus();
					else items[items.length - 1]?.focus();
				} else {
					if (!$draggedItem || !$itemsOrigin) return;
					// Prevent moving the selected item if it’s the first or last item,
					// or is at the top or bottom of the list.
					if (
						(key === 'Home' && draggedItemIndex === 0 && !targetItem) ||
						(key === 'Home' && targetItemIndex === 0) ||
						(key === 'End' && draggedItemIndex === $itemsOrigin.length - 1 && !targetItem) ||
						(key === 'End' && targetItemIndex === $itemsOrigin.length - 1)
					)
						return;

					const items = listRef.querySelectorAll<HTMLLIElement>('.ssl-item');
					$targetItem = key === 'Home' ? items[0] : items[items.length - 1];

					liveText = screenReaderText.dragged($draggedItem, $targetItem, key);
				}
			}

			if (key === 'Escape' && $draggedItem) {
				handleElementDrop($draggedItem, 'keyboard-cancel');
			}
		}
	}

	function handleElementDrop(
		element: HTMLElement,
		action: 'pointer-drop' | 'keyboard-drop' | 'keyboard-cancel'
	) {
		if (action === 'pointer-drop' && (!$draggedItem || !$isPointerDragging || $isPointerDropping))
			return;
		if (
			(action === 'keyboard-drop' || action === 'keyboard-cancel') &&
			(!$draggedItem || !$isKeyboardDragging)
		)
			return;

		let hasDispatchedRemove = false;
		if (action === 'pointer-drop') {
			if ($draggedItem && !$isGhostBetweenBounds && canRemoveItemOnDropOut) {
				dispatchRemove($draggedItem);
				hasDispatchedRemove = true;
			}
			$isPointerDragging = false;
			ghostStatus = !$isGhostBetweenBounds && canRemoveItemOnDropOut ? 'remove' : 'set';
			$isPointerDropping = true;
			$isGhostBetweenBounds = true;
		} else {
			$isKeyboardDragging = false;
			$isKeyboardDropping = true;
		}
		if (action === 'keyboard-drop' && $draggedItem)
			liveText = screenReaderText.dropped($draggedItem, $targetItem);
		else if (action === 'keyboard-cancel' && $draggedItem) {
			$isCancelingKeyboardDragging = true;
			liveText = screenReaderText.canceled($draggedItem);
		}

		async function handleItemDrop() {
			if (
				((action === 'pointer-drop' && !hasDispatchedRemove) || action === 'keyboard-drop') &&
				$draggedItem &&
				$targetItem
			)
				dispatchSort($draggedItem, $targetItem);
			await tick();
			$draggedItem = null;
			$targetItem = null;
			$itemsOrigin = null;
			if (action === 'pointer-drop') {
				ghostStatus = 'unset';
				$pointer = null;
				$pointerOrigin = null;
				$isPointerDropping = false;
			} else $isKeyboardDropping = false;
			if (action === 'keyboard-cancel') $isCancelingKeyboardDragging = false;
		}

		function handleTransitionEnd({ propertyName }: TransitionEvent) {
			if (propertyName === 'z-index') {
				handleItemDrop();
				element?.removeEventListener('transitionend', handleTransitionEnd);
			}
		}

		if (transitionDuration! > 0) element?.addEventListener('transitionend', handleTransitionEnd);
		else handleItemDrop();
	}

	function dispatchSort(draggedItem: HTMLLIElement, targetItem: HTMLLIElement) {
		const draggedItemId = getId(draggedItem);
		const draggedItemIndex = getIndex(draggedItem);
		const targetItemId = getId(targetItem);
		const targetItemIndex = getIndex(targetItem);

		if (
			draggedItem !== null &&
			targetItem !== null &&
			typeof draggedItemIndex === 'number' &&
			typeof targetItemIndex === 'number' &&
			draggedItemIndex !== targetItemIndex
		) {
			dispatch('sort', {
				prevItemId: draggedItemId,
				prevItemIndex: draggedItemIndex,
				nextItemId: targetItemId,
				nextItemIndex: targetItemIndex,
			});
		}
	}

	async function dispatchRemove(item: HTMLLIElement) {
		const itemId = getId(item);
		const itemIndex = getIndex(item);

		if ($isPointerDragging) {
			$isRemoving = true;

			async function handleGhostDrop() {
				dispatch('remove', { itemId, itemIndex });
				await tick();
				$isRemoving = false;
			}

			function handleTransitionEnd({ propertyName }: TransitionEvent) {
				if (propertyName === 'z-index') {
					handleGhostDrop();
					ghostRef?.removeEventListener('transitionend', handleTransitionEnd);
				}
			}

			if (transitionDuration! > 0) ghostRef?.addEventListener('transitionend', handleTransitionEnd);
			else handleGhostDrop();
		} else {
			if ($focusedItem) {
				const items = listRef.children;
				if (items.length > 1) {
					// Focus the next/previous item (if it exists) before removing.
					const step = getIndex($focusedItem) !== items.length - 1 ? 1 : -1;
					if (step === 1) ($focusedItem.nextElementSibling as HTMLLIElement)?.focus();
					else ($focusedItem.previousElementSibling as HTMLLIElement)?.focus();
				} else {
					// Focus the list (if there are no items left) before removing.
					listRef.focus();
				}
			}
			dispatch('remove', { itemId, itemIndex });
		}
	}
</script>

<ul
	bind:this={listRef}
	class="ssl-list has-direction-{direction}"
	class:has-drop-marker={hasDropMarker}
	class:can-remove-item-on-drop-out={canRemoveItemOnDropOut}
	class:is-locked={isLocked}
	class:is-disabled={isDisabled}
	style:--gap="{gap}px"
	style:--transition-duration="{transitionDuration}ms"
	style:pointer-events={$focusedItem ? 'none' : 'auto'}
	role="listbox"
	aria-label="Drag and drop list. Use Arrow Up and Arrow Down to move through the list items."
	aria-orientation={direction}
	aria-activedescendant={$focusedItem ? `ssl-item-${$focusedItem.id}` : null}
	aria-disabled={isDisabled}
	tabindex="0"
	on:pointerdown={handlePointerDown}
	on:keydown={handleKeyDown}
	on:itemfocusout={(event) => handleElementDrop(event.detail.item, 'keyboard-cancel')}
	on:requestremove={(event) => dispatchRemove(event.detail.item)}
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

		&.has-direction-vertical {
			flex-direction: column;
			padding-inline: calc(var(--gap) / 2);
		}

		&.has-direction-horizontal {
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
