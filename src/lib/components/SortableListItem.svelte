<!--
@component
## <SortableList.Item>
Serves as an individual item within `<SortableList.Root>`. Holds the data and content for each list item, as well as the `<SortableList.ItemHandle>` and `<SortableList.ItemRemove>` components when needed.

### Props
- `id`: unique identifier for each item.
- `index`: position of the item in the list.
- `isLocked`: if `true`, will prevent the item from being dragged.
- `isDisabled`: if `true`, will prevent the item from being dragged and change its appearance to dimmed.
- `transitionIn`: animation played when the item is added to the list.
- `transitionOut`: animation played when the item is removed from the list.

### Usage
```svelte
	<SortableList.Item id={item.id} {index}>
		<div class="ssl-item-content">
			{item.text}
		</div>
	</SortableList.Item>
```
-->

<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { getSortableListRootState } from '$lib/states/index.js';
	import { scaleFly } from '$lib/transitions/index.js';
	import type { SortableListItemProps as ItemProps } from '$lib/types/index.js';
	import {
		calculateTranslate,
		calculateTranslateWithAlignment,
		dispatch,
		getIndex,
		INTERACTIVE_ELEMENTS,
		INTERACTIVE_ROLE_ATTRIBUTES,
		isInSameRow,
		joinCSSClasses,
	} from '$lib/utils/index.js';

	let itemRef: HTMLLIElement = $state()!;

	let {
		id,
		index,
		isLocked = false,
		isDisabled = false,
		transitionIn = undefined,
		transitionOut = undefined,
		children,
		...restProps
	}: ItemProps & { class?: string } = $props();

	const _transitionIn = $derived(
		transitionIn ||
			((node: HTMLElement) =>
				scaleFly(node, { axis: rootState.props.direction === 'vertical' ? 'y' : 'x' }))
	);
	const _transitionOut = $derived(
		transitionOut ||
			((node: HTMLElement) =>
				scaleFly(node, { axis: rootState.props.direction === 'vertical' ? 'y' : 'x' }))
	);

	const rootState = getSortableListRootState();

	const classes = $derived(joinCSSClasses('ssl-item', restProps.class));
	const isGhost = $derived(!!itemRef?.parentElement?.classList.contains('ssl-ghost'));

	const selectors = [...INTERACTIVE_ELEMENTS, ...INTERACTIVE_ROLE_ATTRIBUTES].join(', ');
	async function setInteractiveElementsTabIndex(...args: unknown[]) {
		await tick();
		itemRef
			?.querySelectorAll<HTMLElement>(selectors)
			.forEach(
				(el) =>
					(el.tabIndex =
						rootState.dragState !== 'kbd-drag-start' &&
						rootState.dragState !== 'kbd-drag' &&
						focusedId === String(id) &&
						!rootState.props.isDisabled &&
						!isDisabled
							? 0
							: -1)
			);
	}
	$effect(() => {
		setInteractiveElementsTabIndex(rootState.dragState === 'kbd-drag-start', focusedId);
	});

	onMount(() => {
		setInteractiveElementsTabIndex();
	});

	const currentRect = $derived(rootState.itemRects ? rootState.itemRects[index] : null);
	const draggedId = $derived(rootState.draggedItem ? rootState.draggedItem.id : null);
	const draggedIndex = $derived(rootState.draggedItem ? getIndex(rootState.draggedItem) : null);
	// rootState.itemRects is used as a reliable reference to the item’s position in the list
	// without the risk of catching in-between values while an item is translating.
	const draggedRect = $derived(
		rootState.itemRects && typeof draggedIndex === 'number'
			? rootState.itemRects[draggedIndex]
			: null
	);
	const targetIndex = $derived(rootState.targetItem ? getIndex(rootState.targetItem) : null);
	const targetRect = $derived(
		rootState.itemRects && typeof targetIndex === 'number' ? rootState.itemRects[targetIndex] : null
	);
	const focusedId = $derived(rootState.focusedItem ? rootState.focusedItem.id : null);

	function getStyleWidth(...args: unknown[]) {
		if (draggedId !== String(id)) return undefined;
		if (
			!isGhost &&
			rootState.props.direction === 'horizontal' &&
			!rootState.isBetweenBounds &&
			rootState.props.canRemoveOnDropOut
		)
			return '0';
		return `${currentRect?.width}px`;
	}

	function getStyleHeight(...args: unknown[]) {
		if (draggedId !== String(id)) return undefined;
		if (
			!isGhost &&
			rootState.props.direction === 'vertical' &&
			!rootState.isBetweenBounds &&
			rootState.props.canRemoveOnDropOut
		)
			return '0';
		return `${currentRect?.height}px`;
	}

	function getStyleTransform(...args: unknown[]) {
		if (isGhost) return 'none';
		if (
			rootState.dragState === 'idle' ||
			rootState.dragState === 'ptr-cancel' ||
			rootState.dragState === 'kbd-cancel' ||
			!rootState.itemRects ||
			!rootState.draggedItem ||
			!rootState.targetItem ||
			currentRect === null ||
			draggedIndex === null ||
			draggedRect === null ||
			targetIndex === null ||
			targetRect === null
		)
			return 'translate3d(0, 0, 0)';

		if (draggedId !== String(id)) {
			if (
				(index > draggedIndex && index <= targetIndex) ||
				(index < draggedIndex && index >= targetIndex)
			) {
				const step = index > draggedIndex ? -1 : 1;
				const operator = index > draggedIndex === !rootState.isRTL ? '-' : '';
				const x =
					rootState.props.direction === 'vertical'
						? '0'
						: isInSameRow(currentRect, rootState.itemRects[index + step])
							? `${operator}${draggedRect.width + rootState.props.gap!}px`
							: `${rootState.itemRects[index + step].right - currentRect.right}px`;
				const y =
					rootState.props.direction === 'vertical'
						? `${operator}${draggedRect.height + rootState.props.gap!}px`
						: isInSameRow(currentRect, rootState.itemRects[index + step])
							? '0'
							: calculateTranslateWithAlignment(
									rootState.ref!,
									rootState.itemRects[index + step],
									currentRect
								);

				return `translate3d(${x}, ${y}, 0)`;
			} else {
				return 'translate3d(0, 0, 0)';
			}
		} else {
			const x =
				rootState.props.direction === 'vertical'
					? '0'
					: calculateTranslate('x', targetRect, draggedRect, draggedIndex, targetIndex);
			const y =
				rootState.props.direction === 'vertical'
					? calculateTranslate('y', targetRect, draggedRect, draggedIndex, targetIndex)
					: isInSameRow(draggedRect, targetRect)
						? '0'
						: calculateTranslateWithAlignment(rootState.ref!, targetRect, draggedRect);

			return `translate3d(${x}, ${y}, 0)`;
		}
	}

	const styleWidth = $derived(getStyleWidth(rootState.draggedItem, rootState.isBetweenBounds));
	const styleHeight = $derived(getStyleHeight(rootState.draggedItem, rootState.isBetweenBounds));
	const styleTransform = $derived(
		getStyleTransform(
			rootState.draggedItem,
			rootState.targetItem,
			rootState.dragState,
			rootState.isBetweenBounds
		)
	);

	async function handleFocus(e: FocusEvent) {
		if (rootState.dragState.includes('ptr')) {
			e.preventDefault();
			return;
		}

		await tick();
		rootState.focusedItem = itemRef;
	}

	// `focusout` is preferred over `blur` since it detects the loss of focus
	// on the current element and it’s descendants too.
	async function handleFocusOut(e: FocusEvent) {
		const relatedTarget = e.relatedTarget as HTMLElement | null;
		if (!relatedTarget || (relatedTarget && !relatedTarget.closest('.ssl-item'))) {
			if (!rootState.focusedItem) return;
			dispatch(itemRef, 'itemfocusout', { item: rootState.focusedItem });
			await tick();
			rootState.focusedItem = null;
		}
	}
</script>

<li
	bind:this={itemRef}
	{id}
	class={classes}
	style:width={styleWidth}
	style:height={styleHeight}
	style:transform={styleTransform}
	data-item-id={id}
	data-item-index={index}
	data-drag-state={draggedId === String(id) ? rootState.dragState : 'idle'}
	data-is-ghost={isGhost}
	data-is-between-bounds={rootState.isBetweenBounds ||
		(draggedId === String(id) && rootState.isBetweenBounds)}
	data-is-locked={rootState.props.isLocked || isLocked}
	data-is-disabled={rootState.props.isDisabled || isDisabled}
	tabindex={focusedId === String(id) ? 0 : -1}
	role="option"
	aria-disabled={rootState.props.isDisabled || isDisabled}
	aria-label={restProps['aria-label'] || undefined}
	aria-labelledby={restProps['aria-labelledby'] || undefined}
	aria-selected={focusedId === String(id)}
	onfocus={handleFocus}
	onfocusout={handleFocusOut}
	in:_transitionIn
	out:_transitionOut
>
	{@render children?.()}
</li>

<style>
	.ssl-item {
		margin: calc(var(--ssl-gap) / 2);
		position: relative;
		list-style: none;
		user-select: none;
		backface-visibility: hidden;
		z-index: 1;

		&:not(:has([data-role='handle'])),
		& :global([data-role='handle']) {
			touch-action: none;
			cursor: grab;
		}

		&[data-drag-state*='ptr-drag'],
		&[data-drag-state*='ptr-drag'] :global([data-role='handle']) {
			cursor: grabbing;
		}

		&[data-is-locked='true'] {
			cursor: initial;
		}

		&[aria-disabled='true'] {
			cursor: not-allowed;

			& > :global(*) {
				pointer-events: none;
			}
		}

		&:not([data-drag-state='idle']),
		&:has(:global(~ *:not([data-drag-state='idle']))),
		&:not([data-drag-state='idle']) ~ :global(*) {
			transition:
				width var(--ssl-transition-duration),
				height var(--ssl-transition-duration),
				margin var(--ssl-transition-duration),
				transform var(--ssl-transition-duration),
				z-index var(--ssl-transition-duration);
		}

		&[data-is-ghost='true'] {
			margin: 0;
			transition: none;
		}

		&:focus,
		&:focus-visible,
		&:focus-within {
			z-index: 2;
		}

		&[data-drag-state*='kbd-drag'] {
			z-index: 4;
		}

		/* The z-index is different from the one in [data-drag-state*='kbd-drag'] just to force
			 the «transitionend» event to be fired when the item is dropped using the keyboard. */
		&[data-drag-state='kbd-drop'],
		&[data-drag-state='kbd-cancel'] {
			z-index: 3;
		}

		&[data-drag-state*='ptr'] {
			z-index: 0;
		}
	}
</style>
