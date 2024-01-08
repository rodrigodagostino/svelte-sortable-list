<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { flip } from 'svelte/animate';
	import { reorder } from '$lib/utils/index.js';

	export let items: Record<string, unknown>[];
	export let key: string;

	let listRef: HTMLUListElement;
	let ghostRef: HTMLLIElement;
	let draggedItem: HTMLLIElement | null;
	let draggedItemId: number | null;
	let targetItem: HTMLLIElement | null;
	let targetItemId: number | null;
	let draggingOrigin: { x: number; y: number };
	let isDragging = false;
	let isDropping = false;

	const dispatch = createEventDispatcher();

	const TRANSITION_DURATION = 320;

	function setGhostStyles(action: 'init' | 'set' | 'unset', source: HTMLLIElement | null = null) {
		if (action === 'init' || action === 'set') {
			if (!source) return;

			const sourceRect = source?.getBoundingClientRect();
			ghostRef.style.width = `${sourceRect?.width}px`;
			ghostRef.style.height = `${sourceRect?.height}px`;
			ghostRef.style.left = `${sourceRect?.left}px`;
			ghostRef.style.top = `${sourceRect?.top}px`;

			if (action === 'set') {
				ghostRef.style.transition = `left ${TRANSITION_DURATION}ms cubic-bezier(.2,1,.1,1), top ${TRANSITION_DURATION}ms cubic-bezier(.2,1,.1,1), translate ${TRANSITION_DURATION}ms cubic-bezier(.2,1,.1,1)`;
				ghostRef.style.translate = '0 0 0';
			}
		} else {
			ghostRef.style.transition = '';
		}
	}

	function handleGhostTransitionEnd() {
		draggedItem = null;
		draggedItemId = null;
		targetItem = null;
		targetItemId = null;
		setGhostStyles('unset');
		isDropping = false;

		ghostRef.removeEventListener('transitionend', handleGhostTransitionEnd);
	}

	function handleMouseDown(event: MouseEvent) {
		if (isDropping || isDragging) return;

		const target = event.currentTarget as HTMLLIElement;
		if (target.dataset.id) {
			draggedItem = target;
			draggedItemId = +target.dataset.id;
			setGhostStyles('init', draggedItem);
			draggingOrigin = { x: event.clientX, y: event.clientY };
			isDragging = true;
			isDropping = false;
		}
	}

	function handleMouseMove(event: MouseEvent) {
		if (!isDragging || !ghostRef) return;

		/* prettier-ignore */
		ghostRef.style.translate = `${event.clientX - draggingOrigin.x}px ${event.clientY - draggingOrigin.y}px 0`;

		const itemsElements = listRef.querySelectorAll<HTMLLIElement>(
			'.sortable-item:not(.sortable-item--ghost)'
		);
		const collidingItem = Array.from(itemsElements).find((item) => {
			const itemId = item.dataset.id ? +item.dataset.id : null;
			const ghostRect = ghostRef.getBoundingClientRect();
			const itemRect = item.getBoundingClientRect();
			return (
				draggedItemId !== itemId &&
				ghostRect.x + ghostRect.width / 2 > itemRect.x &&
				ghostRect.x < itemRect.x + itemRect.width / 2 &&
				ghostRect.y + ghostRect.height / 2 > itemRect.y &&
				ghostRect.y < itemRect.y + itemRect.height / 2
			);
		});

		if (collidingItem) {
			targetItem = collidingItem;
			targetItemId = collidingItem.dataset.id ? +collidingItem.dataset.id : null;
		} else {
			targetItem = null;
			targetItemId = null;
		}
	}

	function handleMouseUp() {
		if (!isDragging || isDropping) return;

		const draggedItemIndex = draggedItem?.dataset.index ? +draggedItem.dataset.index : null;
		const targetItemIndex = targetItem?.dataset.index ? +targetItem.dataset.index : null;
		if (
			draggedItemIndex !== null &&
			targetItemIndex !== null &&
			draggedItemIndex !== targetItemIndex
		) {
			const newItems = reorder(items, draggedItemIndex, targetItemIndex);
			dispatch('sort', newItems);
		}

		targetItem ? setGhostStyles('set', targetItem) : setGhostStyles('set', draggedItem);
		ghostRef.addEventListener('transitionend', handleGhostTransitionEnd);
		isDragging = false;
		isDropping = true;
	}
</script>

<svelte:document on:mousemove={handleMouseMove} on:mouseup={handleMouseUp} />

<ul bind:this={listRef} class="sortable-list">
	{#each items as item, index (item[key])}
		{@const id = item[key]}
		<li
			class="sortable-item"
			class:is-dragged={draggedItemId === id && isDragging}
			class:is-target={targetItemId === id && targetItemId !== draggedItemId && isDragging}
			class:is-dropped={draggedItemId === id && isDropping}
			data-id={item[key]}
			data-index={index}
			on:mousedown={handleMouseDown}
			animate:flip={{ duration: TRANSITION_DURATION }}
		>
			<slot {item} {index} />
		</li>
	{/each}
	<li
		bind:this={ghostRef}
		class="sortable-item sortable-item--ghost"
		class:is-visible={isDragging || isDropping}
	>
		{@html draggedItem?.innerHTML}
	</li>
</ul>

<style lang="scss">
	.sortable-list,
	.sortable-list * {
		box-sizing: border-box;
	}

	.sortable-list {
		padding: 0;
	}

	.sortable-item {
		position: relative;
		list-style: none;
		user-select: none;
		cursor: grab;

		&.is-dragged,
		&.is-dropped {
			visibility: hidden;
		}

		&--ghost {
			position: fixed;
			visibility: hidden;
			cursor: grabbing;

			&.is-visible {
				visibility: visible;
			}
		}
	}
</style>
