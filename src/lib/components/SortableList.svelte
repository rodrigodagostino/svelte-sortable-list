<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { flip } from 'svelte/animate';

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
				const ghostStyles = [
					`left ${TRANSITION_DURATION}ms cubic-bezier(.2,1,.1,1)`,
					`top ${TRANSITION_DURATION}ms cubic-bezier(.2,1,.1,1)`,
					`translate ${TRANSITION_DURATION}ms cubic-bezier(.2,1,.1,1)`,
					`visibility 0s ${TRANSITION_DURATION}ms`,
				];
				ghostRef.style.transition = ghostStyles.join(', ');
				ghostRef.style.removeProperty('translate');
			}
		} else {
			ghostRef.style.removeProperty('transition');
		}
	}

	function handleGhostTransitionEnd(event: TransitionEvent) {
		setGhostStyles('unset');
		targetItem = null;
		targetItemId = null;
		isDropping = false;

		if (event.propertyName === 'visibility') {
			ghostRef.removeEventListener('transitionend', handleGhostTransitionEnd);
			draggedItem = null;
			draggedItemId = null;
		}
	}

	function handleMouseDown(event: MouseEvent) {
		if (isDropping || isDragging) return;

		const currTarget: HTMLLIElement | SVGElement = event.currentTarget as HTMLLIElement;
		const target: HTMLLIElement | null = !$$slots.handle
			? currTarget
			: currTarget.closest('.sortable-item');
		if (target && target.dataset.id) {
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
		ghostRef.style.translate = `${event.clientX - draggingOrigin.x}px ${event.clientY - draggingOrigin.y}px`;

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
			dispatch('sort', { oldIndex: draggedItemIndex, newIndex: targetItemIndex });
		}

		ghostRef.addEventListener('transitionend', handleGhostTransitionEnd);
		setGhostStyles('set', targetItem ? targetItem : draggedItem);
		isDragging = false;
		isDropping = true;
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
			class:is-dragging={draggedItemId === id && isDragging}
			class:is-dropping={draggedItemId === id && isDropping}
			class:is-target={targetItemId === id && targetItemId !== draggedItemId && isDragging}
			style:cursor={!$$slots.handle ? 'grab' : 'initial'}
			data-id={item[key]}
			data-index={index}
			on:mousedown={!$$slots.handle ? handleMouseDown : null}
			animate:flip={{ duration: TRANSITION_DURATION }}
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

		&:not(.sortable-item--ghost) {
			&.is-dragging,
			&.is-dropping {
				visibility: hidden;
			}
		}

		&--ghost {
			position: fixed;
			visibility: hidden;
			translate: 0;

			&.is-dragging,
			&.is-dropping {
				visibility: visible;
			}
		}

		&__handle {
			display: flex;
		}
	}
</style>
