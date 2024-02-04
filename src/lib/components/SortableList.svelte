<script lang="ts">
	import { createEventDispatcher, tick } from 'svelte';
	import { scaleFly } from '$lib/transitions/index.js';
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
	let itemsOrigin: IItemData[] | null;
	let draggedItem: IItemData | null;
	let targetItem: IItemData | null;

	let isDragging = false;
	let isDropping = false;
	let isSelecting = false;
	let isDeselecting = false;

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

	function setCurrItemStyles(currItem: HTMLLIElement) {
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

		const target = event.target as HTMLElement;
		const handle = target.closest<HTMLButtonElement>('.sortable-item__handle');
		if ($$slots.handle && (!target || !handle)) return;

		const currItem: HTMLLIElement | null = target.closest('.sortable-item');
		if (!currItem || checkIfInteractive(target, currItem)) return;

		if (key === ' ') {
			event.preventDefault();

			if (!isSelecting) {
				isSelecting = true;
				await tick();
				draggedItem = getItemData(currItem);
				itemsOrigin = getItemsData(listRef);
			} else {
				isSelecting = false;
				isDeselecting = true;

				await tick();
				setCurrItemStyles(currItem);

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
					$$slots.handle ? handle?.focus() : currItem.focus();

					clearTimeout(timeoutId);
				}, transitionDuration);
			}
		}

		if (key === 'Tab' && isSelecting) {
			event.preventDefault();
		}

		if (key === 'ArrowUp' || key === 'ArrowDown') {
			if (!isSelecting || draggedItem === null || !itemsOrigin) return;

			event.preventDefault();

			// Prevent item movement if they are already at the top or bottom.
			if (
				(key === 'ArrowUp' && draggedItem.index === 0 && !targetItem) ||
				(key === 'ArrowUp' && targetItem && targetItem.index === 0) ||
				(key === 'ArrowDown' && draggedItem.index === itemsOrigin.length - 1 && !targetItem) ||
				(key === 'ArrowDown' && targetItem && targetItem.index === itemsOrigin.length - 1)
			)
				return;

			const step = key === 'ArrowUp' ? -1 : 1;
			targetItem = !targetItem
				? itemsOrigin.find((item) => draggedItem && item.index === draggedItem.index + step) || null
				: itemsOrigin.find((item) => targetItem && item.index === targetItem.index + step) || null;

			await tick();
			setCurrItemStyles(currItem);
		}
	}
</script>

<ul
	bind:this={listRef}
	class="sortable-list"
	style:--gap="{gap}px"
	role="presentation"
	on:pointerdown={handlePointerDown}
	on:keydown={handleKeyDown}
>
	{#each items as item, index (item[key])}
		{@const id = item[key]}
		{@const activeElement =
			isSelecting || isDeselecting ? draggedItem : ghostRef ? getItemData(ghostRef) : null}
		<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
		<li
			class="sortable-item"
			class:is-selecting={isSelecting && draggedItem?.id === id}
			class:is-deselecting={isDeselecting && draggedItem?.id === id}
			style:cursor={isDragging && draggedItem?.id === id
				? 'grabbing'
				: !$$slots.handle
					? 'grab'
					: 'initial'}
			style:visibility={(isDragging || isDropping) && draggedItem?.id === id ? 'hidden' : 'visible'}
			style:transform={(isDragging || isDropping || isSelecting || isDeselecting) &&
			draggedItem &&
			draggedItem.id !== id &&
			targetItem
				? index > draggedItem.index && index <= targetItem.index
					? activeElement && `translate3d(0, -${activeElement.height + gap}px, 0)`
					: index < draggedItem.index && index >= targetItem.index
						? activeElement && `translate3d(0, ${activeElement.height + gap}px, 0)`
						: 'translate3d(0, 0, 0)'
				: 'translate3d(0, 0, 0)'}
			style:transition={isDragging || isSelecting ? `transform ${transitionDuration}ms` : ''}
			data-id={id}
			data-index={index}
			tabindex={!$$slots.handle ? 0 : null}
			in:scaleFly={{ x: -120 }}
			out:scaleFly={{ x: 120 }}
		>
			<div class="sortable-item__inner">
				{#if $$slots.handle}
					<button class="sortable-item__handle" style:cursor="grab">
						<slot name="handle" />
					</button>
				{/if}
				<slot {item} {index} />
			</div>
		</li>
	{/each}
	<li
		bind:this={ghostRef}
		class="sortable-item sortable-item--ghost"
		class:is-dragging={isDragging}
		class:is-dropping={isDropping}
		style:cursor={isDragging ? 'grabbing' : 'grab'}
		style:visibility={isDragging || isDropping ? 'visible' : 'hidden'}
		style:transform="translate3d(0, 0, 0)"
		data-id={draggedItem?.id}
	>
		<div class="sortable-item__inner">
			{@html draggedItem?.innerHTML || '<span>GHOST</span>'}
		</div>
	</li>
</ul>

<style lang="scss">
	.sortable-list,
	.sortable-list * {
		box-sizing: border-box;
	}

	.sortable-list {
		padding: 0;
		touch-action: none;
	}

	.sortable-item {
		position: relative;
		list-style: none;
		user-select: none;
		backface-visibility: hidden;

		& + &:not(.sortable-item--ghost) {
			margin-top: var(--gap);
		}

		&.is-selecting {
			z-index: 1;
		}

		&--ghost {
			position: fixed;
		}

		&__handle {
			display: flex;
		}
	}
</style>
