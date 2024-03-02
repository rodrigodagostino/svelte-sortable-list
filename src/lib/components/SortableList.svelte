<script lang="ts">
	import { createEventDispatcher, tick } from 'svelte';
	import Ghost from '$lib/components/Ghost.svelte';
	import SortableItem from '$lib/components/SortableItem.svelte';
	import {
		checkIfInteractive,
		getCollidingItem,
		getItemData,
		getItemsData,
		type IItemData,
	} from '$lib/utils/index.js';

	export let items: Record<string, unknown>[];
	export let key: string;
	export let gap: number = 12;
	export let sortThreshold: number = 1;
	export let transitionDuration: number = 320;

	let listRef: HTMLUListElement;
	let ghostRef: HTMLLIElement;
	let ghostOrigin: { x: number; y: number };
	let itemsOrigin: IItemData[] | null = null;
	let draggedItem: IItemData | null = null;
	let targetItem: IItemData | null = null;
	let focusedItem: IItemData | null = null;
	let liveText: string = '';

	let isDragging = false;
	let isDropping = false;
	let isSelecting = false;
	let isDeselecting = false;
	let isCancelling = false;

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

	async function handlePointerDown(event: PointerEvent) {
		if (isDropping || isDragging) return;

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

		const collidingItem = getCollidingItem(getItemData(ghostRef), itemsOrigin, sortThreshold);
		if (collidingItem) targetItem = collidingItem;
		else targetItem = null;
	}

	function handlePointerUp() {
		if (!isDragging || isDropping) return;

		isDragging = false;
		setGhostStyles('set');
		isDropping = true;

		const timeoutId = setTimeout(() => {
			if (
				draggedItem &&
				draggedItem.index !== null &&
				targetItem &&
				targetItem.index !== null &&
				draggedItem.index !== targetItem.index
			) {
				dispatch('sort', { oldIndex: draggedItem.index, newIndex: targetItem.index });
			}

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
		const items = listRef.querySelectorAll<HTMLLIElement>('.sortable-item');

		if (key === ' ') {
			event.preventDefault();
			if (!focusedItem) return;

			if (!isSelecting) {
				isSelecting = true;

				await tick();
				const focusedItemElement = listRef.querySelector<HTMLLIElement>(
					`.sortable-item[data-id="${focusedItem?.id}"]`
				);
				draggedItem = focusedItemElement && getItemData(focusedItemElement);
				itemsOrigin = getItemsData(listRef);
				if (draggedItem !== null) {
					const element =
						draggedItem.index >= 0
							? listRef.querySelector<HTMLLIElement>(
									`.sortable-item[data-index="${draggedItem.index}"]`
								)?.textContent
							: 'the item';
					liveText = `Dragging ${element} at position ${
						draggedItem.index + 1
					}. Press Arrow Down to move it down, Arrow Up to move it up, Space Bar to drop it.`;
				}
			} else {
				isSelecting = false;
				isDeselecting = true;

				await tick();
				const focusedItemElement = listRef.querySelector<HTMLLIElement>(
					`.sortable-item[data-id="${focusedItem?.id}"]`
				);
				focusedItemElement && setItemStyles(focusedItemElement);
				if (draggedItem !== null) {
					const element =
						draggedItem.index >= 0
							? listRef.querySelector<HTMLLIElement>(
									`.sortable-item[data-index="${draggedItem.index}"]`
								)?.textContent
							: 'the item';
					const result =
						targetItem && draggedItem.index !== targetItem.index
							? `Moved from position ${draggedItem?.index + 1} to ${targetItem.index + 1}`
							: `Hasn’t changed position`;
					liveText = `Dropped ${element}. ${result}.`;
				}

				const timeoutId = setTimeout(async () => {
					if (
						draggedItem &&
						draggedItem.index !== null &&
						targetItem &&
						targetItem.index !== null &&
						draggedItem.index !== targetItem.index
					) {
						dispatch('sort', { oldIndex: draggedItem.index, newIndex: targetItem.index });
					}

					draggedItem = null;
					targetItem = null;
					itemsOrigin = null;
					isDeselecting = false;

					await tick();
					const focusedItemElement = listRef.querySelector<HTMLLIElement>(
						`.sortable-item[data-id="${focusedItem?.id}"]`
					);
					if (focusedItemElement) {
						focusedItem = getItemData(focusedItemElement);
						await tick();
						focusedItemElement?.focus();
					}

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
					if (firstItemElement) {
						focusedItem = getItemData(firstItemElement);
						await tick();
						firstItemElement?.focus();
					}
					return;
				}

				// Prevent focusing the previous item if the current one is the first,
				// and focusing the next item if the current one is the last.
				if (
					(key === 'ArrowUp' && focusedItem?.index === 0) ||
					(key === 'ArrowDown' && focusedItem?.index === items.length - 1)
				)
					return;

				const focusedItemElement = listRef.querySelector<HTMLLIElement>(
					`.sortable-item[data-index="${focusedItem?.index + step}"]`
				);
				if (focusedItemElement) {
					focusedItem = getItemData(focusedItemElement);
					await tick();
					focusedItemElement?.focus();
				}
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
				if (targetItem !== null) {
					const element =
						draggedItem.index >= 0
							? listRef.querySelector<HTMLLIElement>(
									`.sortable-item[data-index="${draggedItem.index}"]`
								)?.textContent
							: 'the item';
					const direction = key === 'ArrowUp' ? 'up' : 'down';
					const position = targetItem.index + 1;
					liveText = `Moved ${element} ${direction} to position ${position}.`;
				}
			}
		}

		if (key === 'Tab') handleFocusOut();

		if (key === 'Escape') {
			if (!focusedItem || !isSelecting) return;

			isSelecting = false;
			isDeselecting = true;
			isCancelling = true;

			const timeoutId = setTimeout(() => {
				draggedItem = null;
				targetItem = null;
				itemsOrigin = null;
				isDeselecting = false;
				isCancelling = false;

				clearTimeout(timeoutId);
			}, transitionDuration);
		}
	}

	function handleFocusOut() {
		if (!focusedItem) return;

		if (!isSelecting) {
			focusedItem = null;
			return;
		}

		isSelecting = false;
		isDeselecting = true;
		isCancelling = true;

		const timeoutId = setTimeout(() => {
			focusedItem = null;
			draggedItem = null;
			targetItem = null;
			itemsOrigin = null;
			isDeselecting = false;
			isCancelling = false;

			clearTimeout(timeoutId);
		}, transitionDuration);
	}
</script>

<svelte:document on:click={handleFocusOut} />

{#if items}
	<ul
		bind:this={listRef}
		class="sortable-list"
		style:--gap="{gap}px"
		role="listbox"
		aria-label="Drag and drop list. Use Arrow Up and Arrow Down to move through the list items."
		aria-activedescendant={focusedItem ? `sortable-item-${focusedItem.id}` : null}
		tabindex="0"
		on:pointerdown={handlePointerDown}
		on:keydown={handleKeyDown}
	>
		{#each items as item, index (item[key])}
			<SortableItem
				{item}
				{index}
				{key}
				{listRef}
				{ghostRef}
				{focusedItem}
				{draggedItem}
				{targetItem}
				{isDragging}
				{isDropping}
				{isSelecting}
				{isDeselecting}
				{isCancelling}
			>
				{#if $$slots.handle}
					<span class="sortable-item__handle" style:cursor="grab" aria-hidden="true">
						<slot name="handle" />
					</span>
				{/if}
				<slot {item} {index} />
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

		&:focus-visible {
			outline: 0.125rem solid var(--gray-800);
		}
	}

	.sortable-list {
		padding: 0;
		touch-action: none;

		:global(.sortable-item + .sortable-item) {
			margin-top: var(--gap);
		}
	}

	.sortable-item__handle {
		display: flex;
		flex-shrink: 0;
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
