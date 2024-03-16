<script lang="ts">
	import { createEventDispatcher, onMount, tick } from 'svelte';
	import { scaleFly } from '$lib/transitions/index.js';
	import { getItemData, screenReaderText } from '$lib/utils/index.js';
	import type { ItemData, SortableItemProps } from '$lib/types.js';

	export let item: SortableItemProps['item'];
	export let index: SortableItemProps['index'];
	export let gap: SortableItemProps['gap'];
	export let transitionDuration: SortableItemProps['transitionDuration'];

	let itemRef: HTMLLIElement;
	export let ghostRef: HTMLLIElement;
	export let itemsOrigin: ItemData[] | null;
	export let focusedItem: ItemData | null;
	export let draggedItem: ItemData | null;
	export let targetItem: ItemData | null;
	export let isDragging: boolean;
	export let isDropping: boolean;
	export let isSelecting: boolean;
	export let isDeselecting: boolean;
	export let isCanceling: boolean;

	$: activeElement =
		isSelecting || isDeselecting ? draggedItem : ghostRef ? getItemData(ghostRef) : null;

	const dispatch = createEventDispatcher();

	function setInteractiveElementsTabIndex() {
		itemRef
			.querySelectorAll<HTMLElement>(
				'a, audio, button, input, optgroup, option, select, textarea, video, [role="button"], [role="checkbox"], [role="link"], [role="tab"]'
			)
			.forEach((el) => (el.tabIndex = focusedItem?.id === String(item.id) ? 0 : -1));
	}

	onMount(() => setInteractiveElementsTabIndex());

	async function handleFocus() {
		await tick();
		focusedItem = getItemData(itemRef);
		setInteractiveElementsTabIndex();
	}

	async function handleFocusOut(event: FocusEvent) {
		const relatedTarget = (event.relatedTarget as HTMLElement) || null;
		if (!relatedTarget || !relatedTarget.closest('.sortable-item')) {
			focusedItem = null;
			isSelecting = false;
			isDeselecting = true;
			isCanceling = true;

			const timeoutId = setTimeout(async () => {
				draggedItem = null;
				targetItem = null;
				itemsOrigin = null;
				isDeselecting = false;
				isCanceling = false;

				clearTimeout(timeoutId);
			}, transitionDuration);
		}

		if (
			relatedTarget &&
			relatedTarget.classList.contains('sortable-item') &&
			relatedTarget.getAttribute('data-id') !== String(focusedItem?.id)
		)
			focusedItem = null;

		await tick();
		setInteractiveElementsTabIndex();
	}
</script>

<li
	bind:this={itemRef}
	class="sortable-item"
	class:is-selecting={isSelecting && draggedItem?.id === String(item.id)}
	class:is-deselecting={isDeselecting && draggedItem?.id === String(item.id)}
	style:cursor={isDragging && draggedItem?.id === String(item.id)
		? 'grabbing'
		: !$$slots.handle
			? 'grab'
			: 'initial'}
	style:visibility={(isDragging || isDropping) && draggedItem?.id === String(item.id)
		? 'hidden'
		: 'visible'}
	style:transform={(isDragging || isDropping || isSelecting || isDeselecting) &&
	draggedItem &&
	draggedItem.id !== String(item.id) &&
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
	id="sortable-item-{item.id}"
	data-id={item.id}
	data-index={index}
	role="option"
	tabindex={focusedItem?.id === String(item.id) ? 0 : -1}
	aria-roledescription={screenReaderText.item(index, item.isDisabled || false)}
	aria-selected={focusedItem?.id === String(item.id)}
	aria-disabled={item.isDisabled}
	on:focus={handleFocus}
	on:focusout={handleFocusOut}
	on:blur={setInteractiveElementsTabIndex}
	in:scaleFly={{ x: -120 }}
	out:scaleFly={{ x: 120 }}
>
	<div class="sortable-item__inner">
		<div class="sortable-item__handle" style:cursor="grab" aria-hidden="true">
			<slot name="handle" />
		</div>
		<div class="sortable-item__content">
			<slot {item} {index} />
		</div>
		<button class="sortable-item__remove" on:click={() => dispatch('remove')}>
			<slot name="remove" />
		</button>
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

		&[aria-disabled='true'] {
			pointer-events: none;

			.sortable-item__inner {
				opacity: 0.5;
			}
		}

		&__handle,
		&__content {
			display: flex;
			align-items: center;
		}

		&__handle:empty,
		&__remove:empty {
			display: none;
		}

		&__handle {
			flex-shrink: 0;
		}
	}
</style>
