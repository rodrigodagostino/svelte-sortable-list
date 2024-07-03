<script lang="ts">
	import { createEventDispatcher, tick } from 'svelte';
	import SortableGhost from '$lib/components/SortableGhost.svelte';
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
	export let layout: SortableListProps['layout'] = 'list';
	export let swapThreshold: SortableListProps['swapThreshold'] = 1;
	export let transitionDuration: SortableListProps['transitionDuration'] = 320;
	export let hasDropMarker: SortableListProps['hasDropMarker'] = false;
	export let hasLockedAxis: SortableListProps['hasLockedAxis'] = false;
	export let hasBoundaries: SortableListProps['hasBoundaries'] = false;
	export let hasRemoveOnDragOut: SortableListProps['hasRemoveOnDragOut'] = false;

	let listRef: HTMLUListElement;
	let ghostRef: HTMLDivElement;
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

	function setGhostStyles(action: 'init' | 'set' | 'remove' | 'unset') {
		if (action === 'init' || action === 'set' || action === 'remove') {
			if (!draggedItem || !itemsOrigin) return;

			const ghostRect = ghostRef.getBoundingClientRect();
			const draggedItemRect = itemsOrigin[getIndex(draggedItem)!];
			const targetItemRect = targetItem && itemsOrigin[getIndex(targetItem)!];

			ghostRef.style.width = `${draggedItemRect.width}px`;
			ghostRef.style.height = `${draggedItemRect.height}px`;
			ghostRef.style.zIndex = '10000';

			if (action === 'init') {
				ghostRef.style.left = `${draggedItemRect.x}px`;
				ghostRef.style.top = `${draggedItemRect.y}px`;
			}

			if (action === 'set' || action === 'remove') {
				ghostRef.style.left = `${ghostRect.x}px`;
				ghostRef.style.top = `${ghostRect.y}px`;
				ghostRef.style.transform = 'translate3d(0, 0, 0)';
				// setTimeout will allow the values above to be properly set before setting the ones below.
				setTimeout(() => {
					if (!draggedItem) return;

					ghostRef.style.transition =
						action === 'set'
							? `left ${transitionDuration}ms cubic-bezier(0.2, 1, 0.1, 1),` +
								`top ${transitionDuration}ms cubic-bezier(0.2, 1, 0.1, 1),` +
								`transform ${transitionDuration}ms cubic-bezier(0.2, 1, 0.1, 1),` +
								`z-index 0s ${transitionDuration}ms`
							: `z-index 0s ${transitionDuration}ms`;
					// zIndex is only set and then re-set to force the transitionend event
					// (along with the handleGhostDrop() function) to be fired when the ghost
					// is dragged and dropped without being moved.
					ghostRef.style.zIndex = '9999';

					const draggedItemIndex = getIndex(draggedItem)!;
					const targetItemIndex = (targetItem && getIndex(targetItem)) ?? null;

					if (action === 'set') {
						if (!targetItem) {
							ghostRef.style.left = `${draggedItemRect.x}px`;
							ghostRef.style.top = `${draggedItemRect.y}px`;
						} else {
							if (targetItemIndex === null || !targetItemRect) return;

							ghostRef.style.left =
								direction === 'vertical'
									? `${draggedItemRect.x}px`
									: draggedItemIndex < targetItemIndex
										? `${targetItemRect.x + targetItemRect.width - draggedItemRect.width}px`
										: `${targetItemRect.x}px`;
							ghostRef.style.top =
								direction === 'vertical'
									? draggedItemIndex < targetItemIndex
										? `${targetItemRect.y + targetItemRect.height - draggedItemRect.height}px`
										: `${targetItemRect.y}px`
									: `${draggedItemRect.y}px`;
						}
					}
				}, 0);
			}
		} else {
			ghostRef.style.removeProperty('transition');
		}
	}

	function setItemStyles(currItem: HTMLLIElement) {
		if (!draggedItem || !targetItem || !itemsOrigin) return;

		const draggedItemIndex = getIndex(draggedItem)!;
		const targetItemIndex = getIndex(targetItem)!;

		const itemsInBetween =
			draggedItemIndex < targetItemIndex
				? itemsOrigin.filter(
						(item) =>
							draggedItem &&
							targetItem &&
							item.index > draggedItemIndex &&
							item.index <= targetItemIndex
					)
				: itemsOrigin.filter(
						(item) =>
							draggedItem &&
							targetItem &&
							item.index < draggedItemIndex &&
							item.index >= targetItemIndex
					);
		const currItemTranslateX =
			direction === 'horizontal'
				? draggedItemIndex < targetItemIndex
					? itemsInBetween.reduce((sum, item) => sum + item.width + gap, 0)
					: itemsInBetween.reduce((sum, item) => sum - item.width - gap, 0)
				: 0;
		const currItemTranslateY =
			direction === 'vertical'
				? draggedItemIndex < targetItemIndex
					? itemsInBetween.reduce((sum, item) => sum + item.height + gap, 0)
					: itemsInBetween.reduce((sum, item) => sum - item.height - gap, 0)
				: 0;
		currItem.style.transform = `translate3d(${currItemTranslateX}px, ${currItemTranslateY}px, 0)`;
	}

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
		setGhostStyles('init');

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
		const draggedItemRect = itemsOrigin[getIndex(draggedItem)!];

		isBetweenBounds = areColliding(ghostRect, listRect);

		if (!hasBoundaries) {
			const x =
				direction === 'horizontal' || (direction === 'vertical' && !hasLockedAxis)
					? clientX - pointerOrigin.x
					: 0;
			const y =
				direction === 'vertical' || (direction === 'horizontal' && !hasLockedAxis)
					? clientY - pointerOrigin.y
					: 0;
			ghostRef.style.transform = `translate3d(${x}px, ${y}px, 0)`;
		} else {
			const x =
				direction === 'horizontal' || (direction === 'vertical' && !hasLockedAxis)
					? clientX - (pointerOrigin.x - draggedItemRect.x) < listRect.x
						? listRect.x - draggedItemRect.x
						: clientX + ghostRect.width - (pointerOrigin.x - draggedItemRect.x) > listRect.right
							? listRect.right - draggedItemRect.x - ghostRect.width
							: clientX - pointerOrigin.x
					: 0;
			const y =
				direction === 'vertical' || (direction === 'horizontal' && !hasLockedAxis)
					? clientY - (pointerOrigin.y - draggedItemRect.y) < listRect.y
						? listRect.y - draggedItemRect.y
						: clientY + ghostRect.height - (pointerOrigin.y - draggedItemRect.y) > listRect.bottom
							? listRect.bottom - draggedItemRect.y - ghostRect.height
							: clientY - pointerOrigin.y
					: 0;
			ghostRef.style.transform = `translate3d(${x}px, ${y}px, 0)`;
		}

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
		setGhostStyles(!isBetweenBounds && hasRemoveOnDragOut ? 'remove' : 'set');
		isDropping = true;
		isBetweenBounds = true;

		function handleGhostDrop({ propertyName }: TransitionEvent) {
			if (propertyName === 'top' || propertyName === 'z-index') {
				dispatchSort(draggedItem, targetItem);

				setGhostStyles('unset');
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

				await tick();
				focusedItem && setItemStyles(focusedItem);
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

				await tick();
				draggedItem && draggedItemIndex && setItemStyles(draggedItem);
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

<ul
	bind:this={listRef}
	class="sortable-list has-direction-{direction} has-layout-{layout}"
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
<SortableGhost
	bind:node={ghostRef}
	{transitionDuration}
	{hasRemoveOnDragOut}
	{draggedItem}
	{isDragging}
	{isDropping}
	{isRemoving}
	{isBetweenBounds}
/>
<div class="sortable-live-region" role="log" aria-live="assertive" aria-atomic="true">
	{liveText}
</div>

<style lang="scss">
	.sortable-list,
	.sortable-list :global(*) {
		box-sizing: border-box;
	}

	.sortable-list {
		display: flex;
		padding: 0;
		touch-action: none;

		&.has-layout-list {
			&.has-direction-vertical {
				flex-direction: column;

				:global(.sortable-item:not(:last-of-type)) {
					margin-bottom: var(--gap);
				}
			}

			&.has-direction-horizontal {
				flex-direction: row;
				flex-wrap: nowrap;

				:global(.sortable-item:not(:last-of-type)) {
					margin-right: var(--gap);
				}
			}
		}

		&.has-layout-grid {
			flex-wrap: wrap;
			gap: var(--gap);
			justify-content: space-between;

			:global(.sortable-item) {
				flex-basis: calc(33.333% - var(--gap));
				margin-bottom: var(--gap);
			}
		}
	}

	.sortable-live-region {
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