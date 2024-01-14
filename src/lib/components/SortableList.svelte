<script lang="ts">
	import { createEventDispatcher, onMount, tick } from 'svelte';
	import { flip } from 'svelte/animate';
	import { getIntersectionRect } from '$lib/utils/index.js';

	export let items: Record<string, unknown>[];
	export let key: string;
	export let sortThreshold: number = 1;
	export let transitionDuration: number = 320;

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

	function setGhostStyles(action: 'init' | 'set' | 'unset', source: HTMLLIElement | null = null) {
		if (action === 'init' || action === 'set') {
			if (!source) return;

			const sourceRect = source?.getBoundingClientRect();
			ghostRef.style.width = `${sourceRect?.width}px`;
			ghostRef.style.height = `${sourceRect?.height}px`;
			ghostRef.style.left = `${sourceRect?.left}px`;
			ghostRef.style.top = `${sourceRect?.top}px`;

			if (action === 'set') {
				const ghostStyles = [
					`left ${transitionDuration}ms cubic-bezier(.2,1,.1,1)`,
					`top ${transitionDuration}ms cubic-bezier(.2,1,.1,1)`,
					`translate ${transitionDuration}ms cubic-bezier(.2,1,.1,1)`,
				];
				ghostRef.style.transition = ghostStyles.join(', ');
				ghostRef.style.removeProperty('translate');
			}
		} else {
			ghostRef.style.removeProperty('transition');
		}
	}

	async function handleMouseDown(event: MouseEvent) {
		if (isDropping || isDragging) return;

		const currTarget: HTMLLIElement | SVGElement = event.currentTarget as HTMLLIElement;
		const target: HTMLLIElement | null = !$$slots.handle
			? currTarget
			: currTarget.closest('.sortable-item');
		if (target && target.dataset.id) {
			isDragging = true;
			draggedItem = target;
			draggedItemId = +target.dataset.id;
			draggingOrigin = { x: event.clientX, y: event.clientY };
			await tick();
			setGhostStyles('init', draggedItem);
		}
	}

	function handleMouseMove(event: MouseEvent) {
		if (!isDragging || !ghostRef) return;

		/* prettier-ignore */
		ghostRef.style.translate = `${event.clientX - draggingOrigin.x}px ${event.clientY - draggingOrigin.y}px`;

		const itemsElements = listRef.querySelectorAll<HTMLLIElement>(
			'.sortable-item:not(.sortable-item--ghost)'
		);
		const collidingItems = Array.from(itemsElements).filter((item) => {
			const itemId = item.dataset.id ? +item.dataset.id : null;
			const ghostRect = ghostRef.getBoundingClientRect();
			const itemRect = item.getBoundingClientRect();
			return (
				draggedItemId !== itemId &&
				ghostRect.x + ghostRect.width * sortThreshold > itemRect.x &&
				ghostRect.x < itemRect.x + itemRect.width * sortThreshold &&
				ghostRect.y + ghostRect.height * sortThreshold > itemRect.y &&
				ghostRect.y < itemRect.y + itemRect.height * sortThreshold
			);
		});
		if (collidingItems.length > 1) {
			collidingItems.sort((a, b) => {
				const ghostRect = ghostRef.getBoundingClientRect();
				const aIntersectionRect = getIntersectionRect(ghostRect, a.getBoundingClientRect());
				const bIntersectionRect = getIntersectionRect(ghostRect, b.getBoundingClientRect());

				return bIntersectionRect.area - aIntersectionRect.area;
			});
		}

		const collidingItem = collidingItems[0];

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
			dispatch('sort', { oldIndex: draggedItemIndex, newIndex: targetItemIndex });
		}

		isDragging = false;
		setGhostStyles('set', targetItem ? targetItem : draggedItem);
		isDropping = true;

		const timeoutId = setTimeout(() => {
			setGhostStyles('unset');
			targetItem = null;
			targetItemId = null;
			isDropping = false;

			clearTimeout(timeoutId);
		}, transitionDuration);
	}

	onMount(() => {
		const handles = listRef.querySelectorAll<HTMLLIElement>('.sortable-item__handle');
		handles.forEach((handle) => handle.addEventListener('mousedown', handleMouseDown));

		return () => {
			handles.forEach((handle) => handle.removeEventListener('mousedown', handleMouseDown));
		};
	});
</script>

<svelte:document on:mousemove={handleMouseMove} on:mouseup={handleMouseUp} />

<ul bind:this={listRef} class="sortable-list">
	{#each items as item, index (item[key])}
		{@const id = item[key]}
		<li
			class="sortable-item"
			class:is-dragged={draggedItemId === id && (isDragging || isDropping)}
			class:is-target={targetItemId === id && targetItemId !== draggedItemId && isDragging}
			style:cursor={!$$slots.handle ? 'grab' : 'initial'}
			style:visibility={draggedItemId === id && (isDragging || isDropping) ? 'hidden' : 'visible'}
			data-id={item[key]}
			data-index={index}
			on:mousedown={!$$slots.handle ? handleMouseDown : null}
			animate:flip={{ duration: transitionDuration }}
		>
			{#if $$slots.handle}
				<span class="sortable-item__handle" style:cursor={isDragging ? 'grabbing' : 'grab'}>
					<slot name="handle" />
				</span>
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
	}

	.sortable-item {
		position: relative;
		list-style: none;
		user-select: none;

		&--ghost {
			position: fixed;
		}

		&__handle {
			display: flex;
		}
	}
</style>
