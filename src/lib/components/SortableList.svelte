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
	export let swapThreshold: SortableListProps['swapThreshold'] = 1;
	export let transitionDuration: SortableListProps['transitionDuration'] = 320;
	export let hasDropMarker: SortableListProps['hasDropMarker'] = false;

	let listRef: HTMLUListElement;
	let ghostRef: HTMLLIElement;
	let ghostOrigin: { x: number; y: number };
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

	let hasHandle = $$slots.handle;
	let hasRemove = $$slots.remove;

	const dispatch = createEventDispatcher();

	function setGhostStyles(action: 'init' | 'set' | 'unset') {
		if (action === 'init' || action === 'set') {
			const source = targetItem ? targetItem : draggedItem;
			if (!source) return;

			ghostRef.style.width = `${source.width}px`;
			ghostRef.style.left = `${source.x}px`;

			if (action === 'init') ghostRef.style.top = `${source.y}px`;

			if (action === 'set') {
				if (draggedItem?.y && targetItem?.y) {
					const ghostTop =
						// Check if the dragged item is above the target item.
						draggedItem.y < source.y ? source.y + (source.height - draggedItem.height) : source.y;
					ghostRef.style.top = `${ghostTop}px`;
				}
				ghostRef.style.transition =
					`left ${transitionDuration}ms cubic-bezier(0.2, 1, 0.1, 1),` +
					`top ${transitionDuration}ms cubic-bezier(0.2, 1, 0.1, 1),` +
					`transform ${transitionDuration}ms cubic-bezier(0.2, 1, 0.1, 1)`;
				ghostRef.style.transform = 'translate3d(0, 0, 0)';
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
		const currItemTranslateY =
			draggedItem.index < targetItem.index
				? itemsInBetween.reduce((sum, item) => sum + item.height + gap, 0)
				: itemsInBetween.reduce((sum, item) => sum - item.height - gap, 0);
		currItem.style.transform = `translate3d(0, ${currItemTranslateY}px, 0)`;
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
		ghostOrigin = { x: event.clientX, y: event.clientY };
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

	function handlePointerMove(event: PointerEvent) {
		if (!isDragging || !ghostRef || !itemsOrigin || draggedItem === null) return;

		/* prettier-ignore */
		ghostRef.style.transform = `translate3d(${event.clientX - ghostOrigin.x}px, ${event.clientY - ghostOrigin.y}px, 0)`;

		const collidingItem = getCollidingItem(getItemData(ghostRef), itemsOrigin, swapThreshold);
		if (collidingItem) targetItem = collidingItem;
		else targetItem = null;
	}

	function handlePointerUp() {
		if (!isDragging || isDropping) return;

		isDragging = false;
		setGhostStyles('set');
		isDropping = true;

		const timeoutId = setTimeout(() => {
			dispatchSort(draggedItem, targetItem);

			setGhostStyles('unset');
			draggedItem = null;
			targetItem = null;
			itemsOrigin = null;
			isDropping = false;

			clearTimeout(timeoutId);
		}, transitionDuration);
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

		if (key === 'ArrowUp' || key === 'ArrowDown') {
			event.preventDefault();

			const step = key === 'ArrowUp' ? -1 : 1;

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
					(key === 'ArrowUp' && draggedItem.index === 0 && !targetItem) ||
					(key === 'ArrowUp' && targetItem && targetItem.index === 0) ||
					(key === 'ArrowDown' && draggedItem.index === itemsOrigin.length - 1 && !targetItem) ||
					(key === 'ArrowDown' && targetItem && targetItem.index === itemsOrigin.length - 1)
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

	async function handleRemove(itemId: unknown) {
		if (items.length > 1 && focusedItem) {
			// Focus the next/previous item (if it exists) before removing.
			const step = focusedItem.index !== items.length - 1 ? 1 : -1;
			const adjacentFocusedItemId = items[focusedItem.index + step].id as string;
			getFocusedItemElement(listRef, 'id', adjacentFocusedItemId)?.focus();
		} else {
			// Focus the list (if there are no items left) before removing.
			focusedItem = null;
			listRef.focus();
		}

		dispatch('remove', { id: itemId });
	}
</script>

{#if items}
	<ul
		bind:this={listRef}
		class="sortable-list"
		style:--gap="{gap}px"
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
				{transitionDuration}
				{hasDropMarker}
				{ghostRef}
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
				on:remove={() => handleRemove(item.id)}
			>
				<slot name="handle" slot="handle" />
				<slot {item} {index} />
				<slot name="remove" slot="remove" />
			</SortableItem>
		{/each}
	</ul>
	<Ghost bind:node={ghostRef} {draggedItem} {isDragging} {isDropping} />
	<div class="live-text" role="log" aria-live="assertive" aria-atomic="true">
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
		padding: 0;
		touch-action: none;

		:global(.sortable-item + .sortable-item) {
			margin-top: var(--gap);
		}
	}

	:global(.sortable-item__inner) {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.live-text {
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
