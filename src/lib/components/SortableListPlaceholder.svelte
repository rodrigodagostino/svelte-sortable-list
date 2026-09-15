<!--
@component
## SortableListPlaceholder
Serves as a stand-in for the dragged item’s original position. Rendered by `<SortableList.Item>` for the item currently being dragged within its own list, and by `<SortableList.Root>` itself when the list is the target of a cross-list drag, to mark where the incoming item would land.

### Props
- `ref`: reference to the placeholder element (HTMLLIElement). `[$bindable]`
- `id`: unique identifier of the item being replaced by the placeholder.
- `index`: position of the placeholder in the list.

### Usage
```svelte
	<SortableListPlaceholder {id} {index} />
```
-->

<script lang="ts">
	import { untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { getSortableListRootState, registry } from '$lib/states/index.js';
	import { scaleFly } from '$lib/transitions/index.js';
	import type { SortableListPlaceholderProps as PlaceholderProps } from '$lib/types/props.js';
	import {
		calculateTranslate,
		calculateTranslateWithAlignment,
		getIndex,
		getItemRect,
		isInSameRow,
		preserveSelectedOptions,
	} from '$lib/utils/index.js';

	let {
		ref = $bindable(null),
		id,
		index,
		...restProps
	}: PlaceholderProps & { class?: string } = $props();

	function conditionalTransition(node: HTMLElement) {
		if (!isPeerPlaceholder) return {};
		if (registry.crossingItemId === node.dataset.itemId) return {};
		const config = scaleFly(node, {
			duration: rootState.props.transition?.duration,
			axis: isVertical ? 'y' : 'x',
		});
		// Svelte caches this config while a transition is in flight (an outro that starts
		// mid-intro reuses the intro’s config), so the crossing check must also run when
		// each direction starts, not only when the config is created.
		return {
			...config,
			get duration() {
				return registry.crossingItemId === node.dataset.itemId ? 0 : config.duration;
			},
		};
	}

	const rootState = getSortableListRootState();
	const sourceState = $derived(
		rootState.draggedItem || !rootState.group
			? rootState
			: (registry.sourceList?.state ?? rootState)
	);

	const classes = $derived(['ssl-placeholder', restProps.class]);

	const draggedIndex = $derived(sourceState.draggedItem ? getIndex(sourceState.draggedItem) : null);
	const draggedRect = $derived(
		sourceState.itemRects && typeof draggedIndex === 'number'
			? sourceState.itemRects[draggedIndex]
			: null
	);
	const targetIndex = $derived(
		rootState.group && registry.targetList && registry.isSourceList(rootState)
			? null
			: sourceState.targetItem
				? getIndex(sourceState.targetItem)
				: null
	);
	const targetRect = $derived(
		sourceState.itemRects && typeof targetIndex === 'number'
			? sourceState.itemRects[targetIndex]
			: null
	);

	const content: Attachment<HTMLLIElement> = (node) => {
		const { draggedItem } = sourceState;
		if (!draggedItem) return;

		const clone = draggedItem.cloneNode(true) as HTMLLIElement;
		preserveSelectedOptions(draggedItem, clone);
		clone.querySelectorAll('[id], [name], [for]').forEach((element) => {
			element.removeAttribute('id');
			element.removeAttribute('name');
			element.removeAttribute('for');
		});
		node.replaceChildren(...clone.childNodes);

		return () => node.replaceChildren();
	};

	let isVertical = $derived(rootState.props.direction === 'vertical');
	const isPeerPlaceholder = registry.isTargetList(rootState);
	let isPositioned = $state(!isPeerPlaceholder);

	function isSlotClosing() {
		return (
			registry.isSourceList(rootState) &&
			!!registry.targetList &&
			(rootState.dragState === 'ptr-predrop' ||
				rootState.dragState === 'ptr-drop' ||
				rootState.dragState === 'kbd-drop')
		);
	}

	function getStyleWidth() {
		if (
			!isVertical &&
			((!rootState.isWithinBounds && rootState.props.canRemoveOnDropOut) || isSlotClosing())
		)
			return 0;
		return `${draggedRect?.width}px`;
	}

	function getStyleHeight() {
		if (
			isVertical &&
			((!rootState.isWithinBounds && rootState.props.canRemoveOnDropOut) || isSlotClosing())
		)
			return 0;
		return `${draggedRect?.height}px`;
	}

	function getStyleMargin() {
		if ((!rootState.isWithinBounds && rootState.props.canRemoveOnDropOut) || isSlotClosing()) {
			return isVertical ? `0 calc(var(--ssl-gap) / 2)` : 'calc(var(--ssl-gap) / 2) 0';
		}
		return `calc(var(--ssl-gap) / 2)`;
	}

	function getStyleTransform() {
		if (registry.isTargetList(rootState)) return getPeerTransform();

		if (!draggedRect || !targetRect || draggedIndex === null || targetIndex === null)
			return 'translate3d(0, 0, 0)';

		const x = isVertical
			? 0
			: calculateTranslate('x', targetRect, draggedRect, draggedIndex, targetIndex);
		const y = isVertical
			? calculateTranslate('y', targetRect, draggedRect, draggedIndex, targetIndex)
			: isInSameRow(draggedRect, targetRect)
				? 0
				: calculateTranslateWithAlignment(rootState.ref!, targetRect, draggedRect);

		return `translate3d(${x}px, ${y}px, 0)`;
	}

	function getPeerTransform() {
		const { targetItem, targetItemId } = registry.targetList ?? {};
		if (!ref || targetItemId == null || !targetItem) return 'translate3d(0, 0, 0)';

		const targetRect = getItemRect(targetItem);
		const placeholderRect = getItemRect(ref);

		return `translate3d(${targetRect.x - placeholderRect.x}px, ${targetRect.y - placeholderRect.y}px, 0)`;
	}

	function getStyleOverflow() {
		if (rootState.props.canRemoveOnDropOut || isSlotClosing()) return 'clip';
		return undefined;
	}

	const styleWidth = $derived.by(() => {
		void rootState.dragState;
		void sourceState.draggedItem;
		void rootState.isWithinBounds;
		if (rootState.group) void registry.targetList;
		return untrack(() => getStyleWidth());
	});

	const styleHeight = $derived.by(() => {
		void rootState.dragState;
		void sourceState.draggedItem;
		void rootState.isWithinBounds;
		if (rootState.group) void registry.targetList;
		return untrack(() => getStyleHeight());
	});

	const styleMargin = $derived.by(() => {
		void rootState.dragState;
		void sourceState.draggedItem;
		void rootState.isWithinBounds;
		if (rootState.group) void registry.targetList;
		return untrack(() => getStyleMargin());
	});

	const styleTransform = $derived.by(() => {
		void rootState.targetItem;
		if (rootState.group) void registry.targetList;
		void ref;
		return untrack(() => getStyleTransform());
	});

	const styleOverflow = $derived.by(() => {
		void rootState.dragState;
		void rootState.isWithinBounds;
		if (rootState.group) void registry.targetList;
		return untrack(() => getStyleOverflow());
	});
</script>

<li
	bind:this={ref}
	class={classes}
	style:width={styleWidth}
	style:height={styleHeight}
	style:margin={styleMargin}
	style:transform={styleTransform}
	style:transition={isPositioned ? undefined : 'none'}
	style:overflow={styleOverflow}
	data-item-id={id}
	data-item-index={index}
	data-drag-state={sourceState.dragState}
	aria-hidden="true"
	inert
	onintroend={() => (isPositioned = true)}
	transition:conditionalTransition
	{@attach content}
></li>

<style>
	.ssl-placeholder {
		flex-shrink: 0;
		position: relative;
		list-style: none;
		user-select: none;
		transition:
			width var(--ssl-transition-duration),
			height var(--ssl-transition-duration),
			margin var(--ssl-transition-duration),
			transform var(--ssl-transition-duration);
	}
</style>
