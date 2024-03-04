<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { scaleFly } from '$lib/transitions/index.js';
	import { getItemData, screenReaderText, type IItemData } from '$lib/utils/index.js';

	export let item: Record<string, unknown>;
	export let index: number;
	export let key: string;
	export let gap: number = 12;
	export let transitionDuration: number = 320;

	let itemRef: HTMLLIElement;
	export let ghostRef: HTMLLIElement;
	export let itemsOrigin: IItemData[] | null;
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

	function setInteractiveElementsTabIndex() {
		itemRef
			.querySelectorAll<HTMLElement>(
				'a, audio, button, input, optgroup, option, select, textarea, video, [role="button"], [role="checkbox"], [role="link"], [role="tab"]'
			)
			.forEach((el) =>
				focusedItem?.id === id ? el.removeAttribute('tabindex') : (el.tabIndex = -1)
			);
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
	aria-roledescription={screenReaderText.item(index)}
	aria-selected={focusedItem?.id === id}
	on:focus={handleFocus}
	on:focusout={handleFocusOut}
	on:blur={setInteractiveElementsTabIndex}
	in:scaleFly={{ x: -120 }}
	out:scaleFly={{ x: 120 }}
>
	<div class="sortable-item__inner">
		<slot name="handle" />
		<slot {item} {index} />
		<slot name="remove" />
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
