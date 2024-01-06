<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { flip } from 'svelte/animate';
	import { reorder } from '$lib/utils/index.js';

	export let items: Record<string, unknown>[];
	export let key: string = 'id';

	let draggedItemIndex: number | null;
	let targetItemIndex: number | null;
	let isDragging = false;

	const dispatch = createEventDispatcher();

	function handleDragStart(event: DragEvent) {
		const target = event.target as HTMLLIElement;
		if (target.dataset.index) {
			draggedItemIndex = +target.dataset.index;
		} else {
			draggedItemIndex = null;
		}
		isDragging = true;
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		const target = event.target as HTMLLIElement;
		if (target.dataset.index) {
			targetItemIndex = +target.dataset.index;
		} else {
			targetItemIndex = null;
		}
	}

	function handleDrop() {
		if (
			draggedItemIndex !== null &&
			targetItemIndex !== null &&
			draggedItemIndex !== targetItemIndex
		) {
			const newItems = reorder(items, draggedItemIndex, targetItemIndex);
			dispatch('sort', newItems);
		}
		draggedItemIndex = null;
		targetItemIndex = null;
		isDragging = false;
	}
</script>

<svelte:document on:dragover={handleDragOver} />

<ul class="sortable-list">
	{#each items as item, index (item[key])}
		<li
			class="sortable-item"
			class:is-dragged={draggedItemIndex === index && isDragging}
			class:is-target={targetItemIndex === index &&
				targetItemIndex !== draggedItemIndex &&
				isDragging}
			data-index={index}
			draggable="true"
			on:dragstart={handleDragStart}
			on:drop={handleDrop}
			animate:flip={{ duration: 320 }}
		>
			<slot {item} {index} />
		</li>
	{/each}
</ul>

<style>
	.sortable-list {
		padding: 0;
	}

	.sortable-item {
		list-style: none;
		cursor: grab;
	}
</style>
