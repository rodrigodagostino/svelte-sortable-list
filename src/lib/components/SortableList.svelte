<script lang="ts">
	import { createEventDispatcher, onMount, tick } from 'svelte';
	import {
		checkIfInteractive,
		getCollidingItem,
		getItemData,
		getItemsData,
		type IItemData,
	} from '$lib/utils/index.js';

	export let items: Record<string, unknown>[];
	export let key: string;
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

	function setGhostStyles(action: 'init' | 'set' | 'unset', source: IItemData | null = null) {
		if (action === 'init' || action === 'set') {
			if (!source) return;

			ghostRef.style.width = `${source.width}px`;
			ghostRef.style.height = `${source.height}px`;
			ghostRef.style.left = `${source.x}px`;
			ghostRef.style.top = `${source.y}px`;

			if (action === 'set') {
				const ghostStyles = [
					`left ${transitionDuration}ms cubic-bezier(.2,1,.1,1)`,
					`top ${transitionDuration}ms cubic-bezier(.2,1,.1,1)`,
					`transform ${transitionDuration}ms cubic-bezier(.2,1,.1,1)`,
				];
				ghostRef.style.transition = ghostStyles.join(', ');
				ghostRef.style.removeProperty('transform');
			}
		} else {
			ghostRef.style.removeProperty('transition');
		}
	}

	async function handleMouseDown(event: MouseEvent) {
		if (isDropping || isDragging) return;

		const target = event.target;
		const currTarget = event.currentTarget as HTMLElement;
		const currItem: HTMLLIElement | null = currTarget.closest('.sortable-item');

		if (target && checkIfInteractive(target as Element, currItem!)) return;

		if (currItem && currItem.dataset.id) {
			isDragging = true;
			draggedItem = getItemData(currItem);
			ghostOrigin = { x: event.clientX, y: event.clientY };
			itemsOrigin = getItemsData(listRef);
			await tick();
			setGhostStyles('init', draggedItem);
		}
	}

	function handleMouseMove(event: MouseEvent) {
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

	function handleMouseUp() {
		if (!isDragging || isDropping) return;

		isDragging = false;
		setGhostStyles('set', targetItem ? targetItem : draggedItem);
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
			class:is-dragged={draggedItem?.id === id && (isDragging || isDropping)}
			style:cursor={!$$slots.handle ? 'grab' : 'initial'}
			style:visibility={draggedItem?.id === id && (isDragging || isDropping) ? 'hidden' : 'visible'}
			style:transform={(isDragging || isDropping) &&
			draggedItem?.id !== id &&
			draggedItem &&
			targetItem
				? index <= targetItem?.index && index > draggedItem?.index
					? `translate3d(0, -${ghostRef.getBoundingClientRect().height + 12}px, 0)`
					: index >= targetItem?.index && index < draggedItem?.index
						? `translate3d(0, ${ghostRef.getBoundingClientRect().height + 12}px, 0)`
						: ''
				: ''}
			style:transition={isDragging || isDropping ? `transform ${transitionDuration}ms` : ''}
			data-id={item[key]}
			data-index={index}
			on:mousedown={!$$slots.handle ? handleMouseDown : null}
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
