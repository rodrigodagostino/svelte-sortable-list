<script lang="ts">
	import type { ItemData } from '$lib/types.js';

	export let node: HTMLLIElement;
	export let draggedItem: ItemData | null;
	export let isDragging: boolean;
	export let isDropping: boolean;
</script>

<li
	bind:this={node}
	class="ghost sortable-item"
	class:is-dragging={isDragging}
	class:is-dropping={isDropping}
	style:cursor={isDragging ? 'grabbing' : 'grab'}
	style:visibility={isDragging || isDropping ? 'visible' : 'hidden'}
	style:transform="translate3d(0, 0, 0)"
	data-id={draggedItem?.id}
	aria-hidden="true"
>
	<div class="sortable-item__inner">
		{@html draggedItem?.innerHTML || '<span>GHOST</span>'}
	</div>
</li>

<style lang="scss">
	.ghost {
		position: fixed;
		list-style: none;
		user-select: none;
		backface-visibility: hidden;
		z-index: 9999;
	}
</style>
