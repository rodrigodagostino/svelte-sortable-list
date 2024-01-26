<script lang="ts">
	import { createEventDispatcher, onMount, tick } from 'svelte';
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
	let draggedItem: IItemData | null;
	let targetItem: IItemData | null;
	let ghostOrigin: { x: number; y: number };
	let itemsOrigin: IItemData[] | null;
	let isDragging = false;
	let isDropping = false;

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

	async function handlePointerDown(event: PointerEvent) {
		if (isDropping || isDragging) return;

		const target = event.target;
		const currTarget = event.currentTarget as HTMLElement;
		const currItem: HTMLLIElement | null = currTarget.closest('.sortable-item');

		if (target && checkIfInteractive(target as Element, currItem!)) return;

		if (currItem && currItem.dataset.id) {
			isDragging = true;
			await tick();
			draggedItem = getItemData(currItem);
			ghostOrigin = { x: event.clientX, y: event.clientY };
			itemsOrigin = getItemsData(listRef);
			setGhostStyles('init');
		}

		listRef.addEventListener('pointermove', handlePointerMove);
		listRef.addEventListener(
			'pointerup',
			() => {
				listRef.removeEventListener('pointermove', handlePointerMove);
				handlePointerUp();
			},
			{ once: true }
		);
	}

	function handlePointerMove(event: PointerEvent) {
		if (!isDragging || !ghostRef || !itemsOrigin || draggedItem === null) return;

		/* prettier-ignore */
		ghostRef.style.transform = `translate3d(${event.clientX - ghostOrigin.x}px, ${event.clientY - ghostOrigin.y}px, 0)`;

		const collidingItem = getCollidingItem(ghostRef, itemsOrigin, draggedItem.id, sortThreshold);
		if (collidingItem) {
			targetItem = collidingItem;
		} else {
			targetItem = null;
		}
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
			targetItem = null;
			itemsOrigin = null;
			isDropping = false;

			clearTimeout(timeoutId);
		}, transitionDuration);
	}

	onMount(() => {
		const handles = listRef.querySelectorAll<HTMLElement>('.sortable-item__handle');
		handles.forEach((handle) => handle.addEventListener('pointerdown', handlePointerDown));

		return () => {
			handles.forEach((handle) => handle.removeEventListener('pointerdown', handlePointerDown));
		};
	});
</script>

<ul bind:this={listRef} class="sortable-list" style:--gap="{gap}px">
	{#each items as item, index (item[key])}
		{@const id = item[key]}
		<li
			class="sortable-item"
			class:is-dragged={draggedItem?.id === id && (isDragging || isDropping)}
			style:cursor={!$$slots.handle ? 'grab' : 'initial'}
			style:visibility={draggedItem?.id === id && (isDragging || isDropping) ? 'hidden' : 'visible'}
			style:transform={(isDragging || isDropping) &&
			draggedItem?.id !== id &&
			draggedItem &&
			targetItem
				? index <= targetItem?.index && index > draggedItem?.index
					? `translate3d(0, -${ghostRef.getBoundingClientRect().height + gap}px, 0)`
					: index >= targetItem?.index && index < draggedItem?.index
						? `translate3d(0, ${ghostRef.getBoundingClientRect().height + gap}px, 0)`
						: 'translate3d(0, 0, 0)'
				: 'translate3d(0, 0, 0)'}
			style:transition={isDragging || isDropping ? `transform ${transitionDuration}ms` : ''}
			data-id={item[key]}
			data-index={index}
			on:pointerdown={!$$slots.handle ? handlePointerDown : null}
			in:scaleFly={{ x: -120 }}
			out:scaleFly={{ x: 120 }}
		>
			{#if $$slots.handle}
				<button class="sortable-item__handle" style:cursor={isDragging ? 'grabbing' : 'grab'}>
					<slot name="handle" />
				</button>
			{/if}
			<slot {item} {index} />
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
	>
		{@html draggedItem?.innerHTML || '<span>GHOST</span>'}
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

		&--ghost {
			position: fixed;
		}

		&__handle {
			display: flex;
		}
	}
</style>
