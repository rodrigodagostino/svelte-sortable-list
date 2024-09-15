<script lang="ts">
	import { createEventDispatcher, tick } from 'svelte';
	import Ghost from '$lib/components/Ghost.svelte';
	import type { GhostProps, SortableListProps, SortableItemProps } from '$lib/types/index.js';
	import {
		areColliding,
		getCollidingItem,
		getId,
		getIndex,
		getItemsData,
		hasInteractiveElements,
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
	export let hasRemoveOnDropOut: SortableListProps['hasRemoveOnDropOut'] = false;

	const props = setListProps({
		gap,
		direction,
		swapThreshold,
		transitionDuration,
		hasDropMarker,
		hasLockedAxis,
		hasBoundaries,
		hasRemoveOnDropOut,
	});
	$: $props = {
		gap,
		direction,
		swapThreshold,
		transitionDuration,
		hasDropMarker,
		hasLockedAxis,
		hasBoundaries,
		hasRemoveOnDropOut,
	};

	let ghostStatus: GhostProps['status'] = 'unset';
	const pointer = setPointer(null);
	const pointerOrigin = setPointerOrigin(null);
	const itemsOrigin = setItemsOrigin(null);
	const draggedItem = setDraggedItem(null);
	const targetItem = setTargetItem(null);
	const focusedItem = setFocusedItem(null);
	let liveText: string = '';

	const isPointerDragging = setIsPointerDragging(false);
	const isPointerDropping = setIsPointerDropping(false);
	const isKeyboardDragging = setIsKeyboardDragging(false);
	const isKeyboardDropping = setIsKeyboardDropping(false);
	const isCancelingKeyboardDragging = setIsCancelingKeyboardDragging(false);
	const isGhostBetweenBounds = setIsGhostBetweenBounds(true);
	const isRemoving = setIsRemoving(false);

	const dispatch = createEventDispatcher();

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
		// Prevent dragging if the item has a handle, but we’re not dragging from it.
		const hasHandle = !!currItem?.querySelector('[data-role="handle"]');
		if (hasHandle && !target.closest('[data-role="handle"]')) return;
		// Prevent dragging if the item has an interactive element and we’re clicking on it.
		if (!currItem || (!hasHandle && hasInteractiveElements(target, currItem))) return;

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

		const collidingItemData = getCollidingItem(ghostRef, $itemsOrigin, swapThreshold);
		if (collidingItemData)
			$targetItem = listRef.querySelector<HTMLLIElement>(
				`.ssl-item[data-id="${collidingItemData.id}"]`
			);
		else $targetItem = null;
	}

	function handlePointerUp() {
		if (!$isPointerDragging || $isPointerDropping) return;

		const draggedItemId = $draggedItem && getId($draggedItem);
		if (!$isGhostBetweenBounds && hasRemoveOnDropOut && draggedItemId)
			dispatchRemove(draggedItemId);

		$isPointerDragging = false;
		ghostStatus = !$isGhostBetweenBounds && hasRemoveOnDropOut ? 'remove' : 'set';
		$isPointerDropping = true;
		$isGhostBetweenBounds = true;

		function handleGhostDrop() {
			dispatchSort($draggedItem, $targetItem);

			ghostStatus = 'unset';
			$pointer = null;
			$pointerOrigin = null;
			$itemsOrigin = null;
			$draggedItem = null;
			$targetItem = null;
			$isPointerDropping = false;
		}

		function handleTransitionEnd({ propertyName }: TransitionEvent) {
			if (propertyName === 'top' || propertyName === 'z-index') {
				handleGhostDrop();
				ghostRef?.removeEventListener('transitionend', handleTransitionEnd);
			}
		}

		if (transitionDuration > 0) ghostRef?.addEventListener('transitionend', handleTransitionEnd);
		else handleGhostDrop();
	}

	async function handleKeyDown(event: KeyboardEvent) {
		if ($isKeyboardDropping) {
			event.preventDefault();
			return;
		}

		const { key } = event;
		const target = event.target as HTMLElement;

		if (key === ' ') {
			// Prevent default only if the target is a sortable item.
			// This allows interactive elements (like buttons) to operate normally.
			if (target.classList.contains('ssl-item')) event.preventDefault();
			else return;

			if (!$focusedItem || target.getAttribute('aria-disabled') === 'true') return;

			if (!$isKeyboardDragging) {
				$isKeyboardDragging = true;

				await tick();
				$draggedItem = $focusedItem;
				$itemsOrigin = getItemsData(listRef);
				if ($draggedItem) liveText = screenReaderText.lifted($draggedItem);
			} else {
				$isKeyboardDragging = false;
				$isKeyboardDropping = true;

				if ($draggedItem) liveText = screenReaderText.dropped($draggedItem, $targetItem);

				async function handleItemDrop() {
					dispatchSort($draggedItem, $targetItem);

					$draggedItem = null;
					$targetItem = null;
					$itemsOrigin = null;
					$isKeyboardDropping = false;

					await tick();
					$focusedItem?.focus();
				}

				function handleTransitionEnd({ propertyName }: TransitionEvent) {
					if (propertyName === 'z-index') {
						handleItemDrop();
						$focusedItem?.removeEventListener('transitionend', handleTransitionEnd);
					}
				}

				if (transitionDuration > 0)
					$focusedItem.addEventListener('transitionend', handleTransitionEnd);
				else handleItemDrop();
			}
		}

		if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight') {
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
				const items = listRef.children;
				if (
					(key === 'ArrowUp' && focusedItemIndex === 0) ||
					(key === 'ArrowDown' && focusedItemIndex === items.length - 1)
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

				if ($targetItem) liveText = screenReaderText.dragged($draggedItem, $targetItem, key);
			}
		}

		if (key === 'Escape') {
			if (!$focusedItem || !$isKeyboardDragging) return;

			$isKeyboardDragging = false;
			$isKeyboardDropping = true;
			$isCancelingKeyboardDragging = true;
			if ($draggedItem) liveText = screenReaderText.canceled($draggedItem);

			function handleItemDrop() {
				$draggedItem = null;
				$targetItem = null;
				$itemsOrigin = null;
				$isKeyboardDropping = false;
				$isCancelingKeyboardDragging = false;
			}

			function handleTransitionEnd({ propertyName }: TransitionEvent) {
				if (propertyName === 'z-index') {
					handleItemDrop();
					$focusedItem?.removeEventListener('transitionend', handleTransitionEnd);
				}
			}

			if (transitionDuration > 0)
				$focusedItem.addEventListener('transitionend', handleTransitionEnd);
			else handleItemDrop();
		}
	}

	function dispatchSort(draggedItem: HTMLLIElement | null, targetItem: HTMLLIElement | null) {
		const draggerItemIndex = $draggedItem && getIndex($draggedItem);
		const targetItemIndex = $targetItem && getIndex($targetItem);

		if (
			draggedItem !== null &&
			targetItem !== null &&
			typeof draggerItemIndex === 'number' &&
			typeof targetItemIndex === 'number' &&
			draggerItemIndex !== targetItemIndex
		) {
			dispatch('sort', { prevIndex: draggerItemIndex, nextIndex: targetItemIndex });
		}
	}

	async function dispatchRemove(itemId: SortableItemProps['id']) {
		if ($isPointerDragging) {
			$isRemoving = true;

			function handleGhostDrop() {
				$isRemoving = false;
			}

			function handleTransitionEnd({ propertyName }: TransitionEvent) {
				if (propertyName === 'top' || propertyName === 'z-index') {
					dispatch('remove', { itemId });
					// setTimeout will allow the `remove` event to be handled before setting the $isRemoving state.
					setTimeout(() => {
						handleGhostDrop();
						ghostRef?.removeEventListener('transitionend', handleTransitionEnd);
					});
				}
			}

			if (transitionDuration > 0) ghostRef?.addEventListener('transitionend', handleTransitionEnd);
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
					$focusedItem = null;
					listRef.focus();
				}
			}
			dispatch('remove', { itemId });
		}
	}
</script>

<ul
	bind:this={listRef}
	class="ssl-list has-direction-{direction}"
	class:has-remove-on-drop-out={hasRemoveOnDropOut}
	style:--gap="{gap}px"
	style:--transition-duration="{transitionDuration}ms"
	style:pointer-events={$focusedItem ? 'none' : 'auto'}
	role="listbox"
	aria-label="Drag and drop list. Use Arrow Up and Arrow Down to move through the list items."
	aria-activedescendant={$focusedItem ? `ssl-item-${$focusedItem.id}` : null}
	tabindex="0"
	on:pointerdown={handlePointerDown}
	on:keydown={handleKeyDown}
	on:removestart={(event) => dispatchRemove(event.detail.itemId)}
>
	<slot>
		<p>
			To display your list, provide an array of <code>items</code> to
			<code>{'<SortableList>'}</code>.
		</p>
	</slot>
</ul>
<Ghost bind:ghostRef status={ghostStatus} />
<div class="ssl-live-region" role="log" aria-live="assertive" aria-atomic="true">
	{liveText}
</div>

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
		touch-action: none;

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
