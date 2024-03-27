<script lang="ts">
	import { createEventDispatcher, tick } from 'svelte';
	import Ghost from '$lib/components/Ghost.svelte';
	import SortableItem from '$lib/components/SortableItem.svelte';
	import {
		checkIfInteractive,
		getCollidingItem,
		getFocusedItemElement,
		getItemData,
		getItemsData,
		screenReaderText,
	} from '$lib/utils/index.js';
	import type { ItemData, SortableListProps } from '$lib/types.js';

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
	let ghostRef: HTMLLIElement;
	let pointerOrigin: { x: number; y: number };
	let itemsOrigin: ItemData[] | null = null;
	let draggedItem: ItemData | null = null;
	let targetItem: ItemData | null = null;
	let focusedItem: ItemData | null = null;
	let liveText: string = '';

	let isDragging = false;
	let isDropping = false;
	let isSelecting = false;
	let isDeselecting = false;
	let isCanceling = false;
	let isBetweenBounds = true;

	let hasHandle = $$slots.handle;
	let hasRemove = $$slots.remove;

	const dispatch = createEventDispatcher();

	function setGhostStyles(action: 'init' | 'set' | 'remove' | 'unset') {
		if (action === 'init' || action === 'set' || action === 'remove') {
			if (!draggedItem) return;

			ghostRef.style.width = `${draggedItem.width}px`;
			ghostRef.style.height = `${draggedItem.height}px`;
			ghostRef.style.zIndex = '10000';

			if (action === 'init') {
				ghostRef.style.left = `${draggedItem.x}px`;
				ghostRef.style.top = `${draggedItem.y}px`;
			}

			if (action === 'set' || action === 'remove') {
				const ghostRect = ghostRef.getBoundingClientRect();
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
					if (action === 'set') {
						if (!targetItem) {
							ghostRef.style.left = `${draggedItem.x}px`;
							ghostRef.style.top = `${draggedItem.y}px`;
						} else {
							ghostRef.style.left =
								direction === 'vertical'
									? `${draggedItem.x}px`
									: draggedItem.index < targetItem.index
										? `${targetItem.x + targetItem.width - draggedItem.width}px`
										: `${targetItem.x}px`;
							ghostRef.style.top =
								direction === 'vertical'
									? draggedItem.index < targetItem.index
										? `${targetItem.y + targetItem.height - draggedItem.height}px`
										: `${targetItem.y}px`
									: `${draggedItem.y}px`;
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

		const itemsInBetween =
			draggedItem.index < targetItem.index
				? itemsOrigin.filter(
						(item) =>
							draggedItem &&
							targetItem &&
							item.index > draggedItem.index &&
							item.index <= targetItem.index
					)
				: itemsOrigin.filter(
						(item) =>
							draggedItem &&
							targetItem &&
							item.index < draggedItem.index &&
							item.index >= targetItem.index
					);
		const currItemTranslateX =
			direction === 'horizontal'
				? draggedItem.index < targetItem.index
					? itemsInBetween.reduce((sum, item) => sum + item.width + gap, 0)
					: itemsInBetween.reduce((sum, item) => sum - item.width - gap, 0)
				: 0;
		const currItemTranslateY =
			direction === 'vertical'
				? draggedItem.index < targetItem.index
					? itemsInBetween.reduce((sum, item) => sum + item.height + gap, 0)
					: itemsInBetween.reduce((sum, item) => sum - item.height - gap, 0)
				: 0;
		currItem.style.transform = `translate3d(${currItemTranslateX}px, ${currItemTranslateY}px, 0)`;
	}

	function dispatchSort(draggedItem: ItemData | null, targetItem: ItemData | null) {
		if (
			draggedItem !== null &&
			targetItem !== null &&
			typeof draggedItem.index === 'number' &&
			typeof targetItem.index === 'number' &&
			draggedItem.index !== targetItem.index
		) {
			dispatch('sort', { oldIndex: draggedItem.index, newIndex: targetItem.index });
		}
	}

	async function handlePointerDown(event: PointerEvent) {
		if (isDragging || isDropping || isSelecting || isDeselecting || isCanceling || focusedItem)
			return;

		const target = event.target as HTMLElement;
		if ($$slots.handle && (!target || !target.closest('.sortable-item__handle'))) return;

		const currItem: HTMLLIElement | null = target.closest('.sortable-item');
		if (!currItem || checkIfInteractive(target, currItem)) return;

		currItem.setPointerCapture(event.pointerId);

		isDragging = true;
		await tick();
		draggedItem = getItemData(currItem);
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
		if (!isDragging || !ghostRef || !itemsOrigin || draggedItem === null) return;

		const {
			left: listLeft,
			top: listTop,
			right: listRight,
			bottom: listBottom,
		} = listRef.getBoundingClientRect();
		const {
			left: ghostLeft,
			top: ghostTop,
			right: ghostRight,
			bottom: ghostBottom,
			width: ghostWidth,
			height: ghostHeight,
		} = ghostRef.getBoundingClientRect();

		if (
			ghostRight < listLeft ||
			ghostLeft > listRight ||
			ghostBottom < listTop ||
			ghostTop > listBottom
		)
			isBetweenBounds = false;
		else isBetweenBounds = true;

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
					? clientX - (pointerOrigin.x - draggedItem.x) < listLeft
						? listLeft - draggedItem.x
						: clientX + ghostWidth - (pointerOrigin.x - draggedItem.x) > listRight
							? listRight - draggedItem.x - ghostWidth
							: clientX - pointerOrigin.x
					: 0;
			const y =
				direction === 'vertical' || (direction === 'horizontal' && !hasLockedAxis)
					? clientY - (pointerOrigin.y - draggedItem.y) < listTop
						? listTop - draggedItem.y
						: clientY + ghostHeight - (pointerOrigin.y - draggedItem.y) > listBottom
							? listBottom - draggedItem.y - ghostHeight
							: clientY - pointerOrigin.y
					: 0;
			ghostRef.style.transform = `translate3d(${x}px, ${y}px, 0)`;
		}

		const collidingItem = getCollidingItem(getItemData(ghostRef), itemsOrigin, swapThreshold);
		if (collidingItem) targetItem = collidingItem;
		else targetItem = null;
	}

	function handlePointerUp() {
		if (!isDragging || isDropping) return;

		if (!isBetweenBounds && hasRemoveOnDragOut && draggedItem?.id) handleRemove(draggedItem.id);

		isDragging = false;
		setGhostStyles(!isBetweenBounds && hasRemoveOnDragOut ? 'remove' : 'set');
		isDropping = true;

		function handleGhostDrop({ propertyName }: TransitionEvent) {
			if (propertyName === 'top' || propertyName === 'z-index') {
				dispatchSort(draggedItem, targetItem);

				setGhostStyles('unset');
				draggedItem = null;
				targetItem = null;
				itemsOrigin = null;
				isDropping = false;
				isBetweenBounds = true;

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
		const items = listRef.querySelectorAll<HTMLLIElement>('.sortable-item');

		if (key === ' ') {
			// Prevent default only if the target is a sortable item.
			// This allows interactive elements (like buttons) to operate normally.
			if (target.classList.contains('sortable-item')) event.preventDefault();
			else return;

			if (!focusedItem || target.getAttribute('aria-disabled') === 'true') return;

			if (!isSelecting) {
				isSelecting = true;

				await tick();
				const focusedItemElement = getFocusedItemElement(listRef, 'id', focusedItem.id);
				draggedItem = focusedItemElement && getItemData(focusedItemElement);
				itemsOrigin = getItemsData(listRef);
				if (draggedItem !== null) liveText = screenReaderText.lifted(draggedItem, listRef);
			} else {
				isSelecting = false;
				isDeselecting = true;

				await tick();
				const focusedItemElement = getFocusedItemElement(listRef, 'id', focusedItem.id);
				focusedItemElement && setItemStyles(focusedItemElement);
				if (draggedItem)
					liveText = screenReaderText.dropped(draggedItem, targetItem || null, listRef);

				const timeoutId = setTimeout(async () => {
					dispatchSort(draggedItem, targetItem);

					draggedItem = null;
					targetItem = null;
					itemsOrigin = null;
					isDeselecting = false;

					await tick();
					const focusedItemElement =
						focusedItem && getFocusedItemElement(listRef, 'id', focusedItem.id);
					focusedItemElement?.focus();

					clearTimeout(timeoutId);
				}, transitionDuration);
			}
		}

		if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight') {
			event.preventDefault();

			const step = key === 'ArrowUp' || key === 'ArrowLeft' ? -1 : 1;

			if (!isSelecting) {
				if (!focusedItem) {
					const firstItemElement = listRef.querySelector<HTMLLIElement>('.sortable-item');
					firstItemElement?.focus();
					return;
				}

				// Prevent focusing the previous item if the current one is the first,
				// and focusing the next item if the current one is the last.
				if (
					(key === 'ArrowUp' && focusedItem?.index === 0) ||
					(key === 'ArrowDown' && focusedItem?.index === items.length - 1)
				)
					return;

				const focusedItemElement = getFocusedItemElement(
					listRef,
					'index',
					String(focusedItem?.index + step)
				);
				focusedItemElement?.focus();
			} else {
				if (!draggedItem || !itemsOrigin) return;
				// Prevent moving the selected item if it’s the first or last item,
				// or is at the top or bottom of the list.
				if (
					((key === 'ArrowUp' || key === 'ArrowLeft') && draggedItem.index === 0 && !targetItem) ||
					((key === 'ArrowUp' || key === 'ArrowLeft') && targetItem && targetItem.index === 0) ||
					((key === 'ArrowDown' || key === 'ArrowRight') &&
						draggedItem.index === itemsOrigin.length - 1 &&
						!targetItem) ||
					((key === 'ArrowDown' || key === 'ArrowRight') &&
						targetItem &&
						targetItem.index === itemsOrigin.length - 1)
				)
					return;

				targetItem = !targetItem
					? itemsOrigin?.find((item) => draggedItem && item.index === draggedItem.index + step) ||
						null
					: itemsOrigin?.find((item) => targetItem && item.index === targetItem.index + step) ||
						null;

				await tick();
				draggedItem && setItemStyles(items[draggedItem.index]);
				if (targetItem !== null)
					liveText = screenReaderText.dragged(draggedItem, targetItem, listRef, key);
			}
		}

		if (key === 'Escape') {
			if (!focusedItem || !isSelecting) return;

			isSelecting = false;
			isDeselecting = true;
			isCanceling = true;
			if (draggedItem) liveText = screenReaderText.canceled(draggedItem);

			const timeoutId = setTimeout(() => {
				draggedItem = null;
				targetItem = null;
				itemsOrigin = null;
				isDeselecting = false;
				isCanceling = false;

				clearTimeout(timeoutId);
			}, transitionDuration);
		}
	}

	function handleRemove(itemId: string) {
		if (focusedItem) {
			if (items.length > 1) {
				// Focus the next/previous item (if it exists) before removing.
				const step = focusedItem.index !== items.length - 1 ? 1 : -1;
				const adjacentFocusedItemId = items[focusedItem.index + step].id;
				getFocusedItemElement(listRef, 'id', adjacentFocusedItemId)?.focus();
			} else {
				// Focus the list (if there are no items left) before removing.
				focusedItem = null;
				listRef.focus();
			}
		}

		dispatch('remove', { id: itemId });
	}
</script>

{#if items}
	<ul
		bind:this={listRef}
		class="sortable-list has-direction-{direction}"
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
				{itemsOrigin}
				bind:focusedItem
				bind:draggedItem
				bind:targetItem
				bind:isDragging
				bind:isDropping
				bind:isSelecting
				bind:isDeselecting
				bind:isCanceling
				{hasHandle}
				{hasRemove}
				on:remove={() => handleRemove(String(item.id))}
			>
				<slot name="handle" slot="handle" />
				<slot {item} {index} />
				<slot name="remove" slot="remove" />
			</SortableItem>
		{/each}
	</ul>
	<Ghost
		bind:node={ghostRef}
		{transitionDuration}
		{hasRemoveOnDragOut}
		{draggedItem}
		{isDragging}
		{isDropping}
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

			:global(.sortable-item + .sortable-item) {
				margin-top: var(--gap);
			}
		}

		&.has-direction-horizontal {
			flex-direction: row;

			:global(.sortable-item + .sortable-item) {
				margin-left: var(--gap);
			}
		}
	}

	:global(.sortable-item__inner) {
		display: flex;
		align-items: center;
		gap: 0.75rem;
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
