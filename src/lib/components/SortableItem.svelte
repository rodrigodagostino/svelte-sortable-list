<script lang="ts">
	import { scaleFly } from '$lib/transitions/index.js';
	import { getItemData, screenReaderText, type IItemData } from '$lib/utils/index.js';

	export let item: Record<string, unknown>;
	export let index: number;
	export let key: string;
	export let gap: number = 12;
	export let transitionDuration: number = 320;

	let itemRef: HTMLLIElement;
	export let ghostRef: HTMLLIElement;
	export let focusedItem: IItemData | null;
	export let draggedItem: IItemData | null;
	export let targetItem: IItemData | null;
	export let isDragging: boolean;
	export let isDropping: boolean;
	export let isSelecting: boolean;
	export let isDeselecting: boolean;
	export let isCanceling: boolean;

	let id = item[key];
	$: activeElement =
		isSelecting || isDeselecting ? draggedItem : ghostRef ? getItemData(ghostRef) : null;
</script>

<li
	bind:this={itemRef}
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
		? !isCanceling && index > draggedItem.index && index <= targetItem.index
			? activeElement && `translate3d(0, -${activeElement.height + gap}px, 0)`
			: !isCanceling && index < draggedItem.index && index >= targetItem.index
				? activeElement && `translate3d(0, ${activeElement.height + gap}px, 0)`
				: 'translate3d(0, 0, 0)'
		: 'translate3d(0, 0, 0)'}
	style:transition={isDragging || isSelecting || isDeselecting
		? `transform ${transitionDuration}ms`
		: ''}
	id="sortable-item-{id}"
	data-id={id}
	data-index={index}
	role="option"
	tabindex={focusedItem?.id === id ? 0 : -1}
	aria-selected={focusedItem?.id === id}
	aria-roledescription={screenReaderText.item(index)}
	in:scaleFly={{ x: -120 }}
	out:scaleFly={{ x: 120 }}
>
	<div class="sortable-item__inner">
		<slot name="handle" />
		<slot {item} {index} />
	</div>
</li>

<style lang="scss">
	.sortable-item {
		position: relative;
		list-style: none;
		user-select: none;
		backface-visibility: hidden;

		&:focus-visible,
		&.is-selecting,
		&.is-deselecting {
			z-index: 1;
		}
	}
</style>
