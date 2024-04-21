<script lang="ts">
	import { getId } from '$lib/utils/index.js';

	export let node: HTMLLIElement;
	export let transitionDuration: number;
	export let hasRemoveOnDragOut: boolean;
	export let draggedItem: HTMLLIElement | null;
	export let isDragging: boolean;
	export let isDropping: boolean;
	export let isRemoving: boolean;
	export let isBetweenBounds: boolean;
</script>

<li
	bind:this={node}
	class="ghost sortable-item"
	class:has-remove-on-drag-out={hasRemoveOnDragOut}
	class:is-dragging={isDragging}
	class:is-dropping={isDropping}
	class:is-between-bounds={isBetweenBounds}
	class:is-out-of-bounds={!isBetweenBounds}
	class:is-removing={isRemoving}
	style:--transition-duration="{transitionDuration}ms"
	style:cursor={isDragging ? 'grabbing' : !isRemoving ? 'grab' : 'initial'}
	style:visibility={isDragging || isDropping ? 'visible' : 'hidden'}
	style:transform="translate3d(0, 0, 0)"
	data-id={draggedItem && getId(draggedItem)}
	aria-hidden="true"
>
	{@html draggedItem?.innerHTML.trim() || '<span>GHOST</span>'}
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
