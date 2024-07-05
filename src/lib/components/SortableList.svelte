<script lang="ts">
	import { createEventDispatcher, tick } from 'svelte';
	import Ghost from '$lib/components/Ghost.svelte';
	import SortableItem from '$lib/components/SortableItem.svelte';
	import type { ItemData, SortableListProps } from '$lib/types.js';
	import {
		areColliding,
		getCollidingItem,
		getId,
		getIndex,
		getItemsData,
		hasInteractiveElements,
		screenReaderText,
	} from '$lib/utils/index.js';

	export let items: SortableListProps['items'];
	export let gap: SortableListProps['gap'] = 12;
	export let direction: SortableListProps['direction'] = 'vertical';
	export let swapThreshold: SortableListProps['swapThreshold'] = 1;
	export let transitionDuration: SortableListProps['transitionDuration'] = 320;
	export let hasDropMarker: SortableListProps['hasDropMarker'] = false;
	export let hasLockedAxis: SortableListProps['hasLockedAxis'] = false;
	export let hasBoundaries: SortableListProps['hasBoundaries'] = false;
	export let hasRemoveOnDragOut: SortableListProps['hasRemoveOnDragOut'] = false;

	let listRef: HTMLUListElement;
	let ghostRef: HTMLDivElement;
	let ghostStatus: 'init' | 'set' | 'remove' | 'unset' = 'unset';
	let pointer: { x: number; y: number };
	let pointerOrigin: { x: number; y: number };
	let itemsOrigin: ItemData[] | null = null;
	let draggedItem: HTMLLIElement | null = null;
	let targetItem: HTMLLIElement | null = null;
	let focusedItem: HTMLLIElement | null = null;
	let liveText: string = '';

	let isDragging = false;
	let isDropping = false;
	let isSelecting = false;
	let isDeselecting = false;
	let isCanceling = false;
	let isRemoving = false;
	let isBetweenBounds = true;

	let slots = $$slots;

	const dispatch = createEventDispatcher();

	function dispatchSort(draggedItem: HTMLLIElement | null, targetItem: HTMLLIElement | null) {
		const draggerItemIndex = draggedItem && getIndex(draggedItem);
		const targetItemIndex = targetItem && getIndex(targetItem);

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

	async function handlePointerDown(event: PointerEvent) {
		if (isDragging || isDropping || isSelecting || isDeselecting || isCanceling || focusedItem)
			return;

		const target = event.target as HTMLElement;
		if (slots.handle && (!target || !target.closest('.sortable-item__handle'))) return;

		const currItem: HTMLLIElement | null = target.closest('.sortable-item');
		if (!currItem || hasInteractiveElements(target, currItem)) return;

		currItem.setPointerCapture(event.pointerId);

		isDragging = true;
		await tick();
		draggedItem = currItem;
		pointerOrigin = { x: event.clientX, y: event.clientY };
		itemsOrigin = getItemsData(listRef);
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
		if (!isDragging || !ghostRef || !itemsOrigin || !draggedItem) return;

		const listRect = listRef.getBoundingClientRect();
		const ghostRect = ghostRef.getBoundingClientRect();

		pointer = { x: clientX, y: clientY };
		isBetweenBounds = areColliding(ghostRect, listRect);

		const collidingItemData = getCollidingItem(ghostRef, itemsOrigin, swapThreshold);
		if (collidingItemData)
			targetItem = listRef.querySelector<HTMLLIElement>(
				`.sortable-item[data-id="${collidingItemData.id}"]`
			);
		else targetItem = null;
	}

	function handlePointerUp() {
		if (!isDragging || isDropping) return;

		const draggedItemId = draggedItem && getId(draggedItem);
		if (!isBetweenBounds && hasRemoveOnDragOut && draggedItemId) handleRemove(draggedItemId);

		isDragging = false;
		ghostStatus = !isBetweenBounds && hasRemoveOnDragOut ? 'remove' : 'set';
		isDropping = true;
		isBetweenBounds = true;

		function handleGhostDrop({ propertyName }: TransitionEvent) {
			if (propertyName === 'top' || propertyName === 'z-index') {
				dispatchSort(draggedItem, targetItem);

				ghostStatus = 'unset';
				draggedItem = null;
				targetItem = null;
				itemsOrigin = null;
				isDropping = false;

				ghostRef.removeEventListener('transitionend', handleGhostDrop);
			}
		}

		ghostRef.addEventListener('transitionend', handleGhostDrop);
	}

	async function handleKeyDown(event: KeyboardEvent) {
		if (isDeselecting) {
			event.preventDefault();
			return;
		}

		const { key } = event;
		const target = event.target as HTMLElement;

		if (key === ' ') {
			// Prevent default only if the target is a sortable item.
			// This allows interactive elements (like buttons) to operate normally.
			if (target.classList.contains('sortable-item')) event.preventDefault();
			else return;

			if (!focusedItem || target.getAttribute('aria-disabled') === 'true') return;

			if (!isSelecting) {
				isSelecting = true;

				await tick();
				draggedItem = focusedItem;
				itemsOrigin = getItemsData(listRef);
				if (draggedItem) liveText = screenReaderText.lifted(draggedItem);
			} else {
				isSelecting = false;
				isDeselecting = true;

				if (draggedItem) liveText = screenReaderText.dropped(draggedItem, targetItem);

				async function handleItemDrop({ propertyName }: TransitionEvent) {
					if (propertyName === 'z-index') {
						dispatchSort(draggedItem, targetItem);

						draggedItem = null;
						targetItem = null;
						itemsOrigin = null;
						isDeselecting = false;

						await tick();
						focusedItem?.focus();

						focusedItem?.removeEventListener('transitionend', handleItemDrop);
					}
				}

				focusedItem.addEventListener('transitionend', handleItemDrop);
			}
		}

		if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight') {
			event.preventDefault();

			const step = key === 'ArrowUp' || key === 'ArrowLeft' ? -1 : 1;
			const draggedItemIndex = (draggedItem && getIndex(draggedItem)) ?? null;
			const targetItemIndex = (targetItem && getIndex(targetItem)) ?? null;
			const focusedItemIndex = (focusedItem && getIndex(focusedItem)) ?? null;

			if (!isSelecting) {
				if (!focusedItem || focusedItemIndex === null) {
					const firstItemElement = listRef.querySelector<HTMLLIElement>('.sortable-item');
					firstItemElement?.focus();
					return;
				}

				// Prevent focusing the previous item if the current one is the first,
				// and focusing the next item if the current one is the last.
				if (
					(key === 'ArrowUp' && focusedItemIndex === 0) ||
					(key === 'ArrowDown' && focusedItemIndex === items.length - 1)
				)
					return;

				step === 1
					? (focusedItem.nextElementSibling as HTMLLIElement)?.focus()
					: (focusedItem.previousElementSibling as HTMLLIElement)?.focus();
			} else {
				if (!draggedItem || !itemsOrigin) return;
				// Prevent moving the selected item if it’s the first or last item,
				// or is at the top or bottom of the list.
				if (
					((key === 'ArrowUp' || key === 'ArrowLeft') && draggedItemIndex === 0 && !targetItem) ||
					((key === 'ArrowUp' || key === 'ArrowLeft') && targetItemIndex === 0) ||
					((key === 'ArrowDown' || key === 'ArrowRight') &&
						draggedItemIndex === itemsOrigin.length - 1 &&
						!targetItem) ||
					((key === 'ArrowDown' || key === 'ArrowRight') &&
						targetItemIndex === itemsOrigin.length - 1)
				)
					return;

				if (!targetItem) {
					targetItem =
						step === 1
							? (draggedItem.nextElementSibling as HTMLLIElement)
							: (draggedItem.previousElementSibling as HTMLLIElement);
				} else {
					targetItem =
						step === 1
							? (targetItem.nextElementSibling as HTMLLIElement)
							: (targetItem.previousElementSibling as HTMLLIElement);
				}

				if (targetItem) liveText = screenReaderText.dragged(draggedItem, targetItem, key);
			}
		}

		if (key === 'Escape') {
			if (!focusedItem || !isSelecting) return;

			isSelecting = false;
			isDeselecting = true;
			isCanceling = true;
			if (draggedItem) liveText = screenReaderText.canceled(draggedItem);

			function handleItemDrop({ propertyName }: TransitionEvent) {
				if (propertyName === 'z-index') {
					draggedItem = null;
					targetItem = null;
					itemsOrigin = null;
					isDeselecting = false;
					isCanceling = false;

					focusedItem?.removeEventListener('transitionend', handleItemDrop);
				}
			}

			focusedItem.addEventListener('transitionend', handleItemDrop);
		}
	}

	async function handleRemove(itemId: unknown) {
		if (focusedItem) {
			if (items.length > 1) {
				// Focus the next/previous item (if it exists) before removing.
				const step = getIndex(focusedItem) !== items.length - 1 ? 1 : -1;
				step === 1
					? (focusedItem.nextElementSibling as HTMLLIElement)?.focus()
					: (focusedItem.previousElementSibling as HTMLLIElement)?.focus();
			} else {
				// Focus the list (if there are no items left) before removing.
				focusedItem = null;
				listRef.focus();
			}
		} else if (isDragging) {
			isRemoving = true;

			function handleGhostDrop({ propertyName }: TransitionEvent) {
				if (propertyName === 'top' || propertyName === 'z-index') {
					isRemoving = false;

					ghostRef.removeEventListener('transitionend', handleGhostDrop);
				}
			}

			ghostRef.addEventListener('transitionend', handleGhostDrop);
		}

		dispatch('remove', { itemId });
	}
</script>

{#if items}
	<ul
		bind:this={listRef}
		class="sortable-list has-direction-{direction}"
		class:is-dragging={isDragging}
		class:is-dropping={isDropping}
		class:is-selecting={isSelecting}
		class:is-deselecting={isDeselecting}
		class:is-between-bounds={isBetweenBounds}
		class:is-out-of-bounds={!isBetweenBounds}
		class:is-removing={isRemoving}
		class:has-remove-on-drag-out={hasRemoveOnDragOut}
		style:--gap="{gap}px"
		style:--transition-duration="{transitionDuration}ms"
		style:pointer-events={focusedItem ? 'none' : 'auto'}
		role="listbox"
		aria-label="Drag and drop list. Use Arrow Up and Arrow Down to move through the list items."
		aria-activedescendant={focusedItem ? `sortable-item-${focusedItem.id}` : null}
		tabindex="0"
		on:pointerdown={handlePointerDown}
		on:keydown={handleKeyDown}
	>
		{#each items as item, index (item.id)}
			<SortableItem
				{item}
				{index}
				{gap}
				{direction}
				{transitionDuration}
				{hasDropMarker}
				{hasRemoveOnDragOut}
				bind:itemsOrigin
				bind:focusedItem
				bind:draggedItem
				bind:targetItem
				{isDragging}
				{isDropping}
				bind:isSelecting
				bind:isDeselecting
				bind:isCanceling
				{isRemoving}
				{isBetweenBounds}
				{slots}
				on:remove={() => handleRemove(String(item.id))}
			>
				<slot name="handle" slot="handle" />
				<slot {item} {index} />
				<slot name="remove" slot="remove" />
			</SortableItem>
		{/each}
	</ul>
	<Ghost
		bind:ghostRef
		{ghostStatus}
		{direction}
		{transitionDuration}
		{hasLockedAxis}
		{hasBoundaries}
		{pointer}
		{pointerOrigin}
		{itemsOrigin}
		{draggedItem}
		{targetItem}
		{isDragging}
		{isDropping}
		{isRemoving}
		{isBetweenBounds}
	/>
	<div class="live-region" role="log" aria-live="assertive" aria-atomic="true">
		{liveText}
	</div>
{:else}
	<p>
		To display your list, provide an array of <code>items</code> to
		<code>{'<SortableList />'}</code>.
	</p>
{/if}

<style lang="scss">
	.sortable-list,
	.sortable-list :global(*) {
		box-sizing: border-box;
	}

	.sortable-list {
		display: flex;
		padding: 0;
		touch-action: none;

		&.has-direction-vertical {
			flex-direction: column;

			:global(.sortable-item:not(:last-of-type)) {
				margin-bottom: var(--gap);
			}
		}

		&.has-direction-horizontal {
			flex-direction: row;

			:global(.sortable-item:not(:last-of-type)) {
				margin-right: var(--gap);
			}
		}
	}

	.live-region {
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
