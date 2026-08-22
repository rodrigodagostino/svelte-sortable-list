<script lang="ts">
	import { untrack } from 'svelte';
	import { getSortableListRootState, registry } from '$lib/states/index.js';
	import { scaleFly } from '$lib/transitions/index.js';
	import type { SortableListPlaceholderProps as PlaceholderProps } from '$lib/types/props.js';
	import {
		calculateTranslate,
		calculateTranslateWithAlignment,
		getIndex,
		getItemRect,
		isInSameRow,
	} from '$lib/utils/index.js';

	let {
		ref = $bindable(null),
		id,
		index,
		...restProps
	}: PlaceholderProps & { class?: string } = $props();

	function conditionalTransition(node: HTMLElement) {
		if (!isPeerPlaceholder) return {};
		if (registry.crossingItemId === node.id) return {};
		const config = scaleFly(node, {
			duration: rootState.props.transition?.duration,
			axis: rootState.props.direction === 'vertical' ? 'y' : 'x',
		});
		// Svelte caches this config while a transition is in flight (an outro that starts
		// mid-intro reuses the intro’s config), so the crossing check must also run when
		// each direction starts, not only when the config is created.
		return {
			...config,
			get duration() {
				return registry.crossingItemId === node.id ? 0 : config.duration;
			},
		};
	}

	const rootState = getSortableListRootState();
	const sourceState = $derived(
		rootState.draggedItem ? rootState : (registry.sourceList?.state ?? rootState)
	);

	const classes = $derived(['ssl-placeholder', restProps.class]);

	const draggedIndex = $derived(sourceState.draggedItem ? getIndex(sourceState.draggedItem) : null);
	const draggedRect = $derived(
		sourceState.itemRects && typeof draggedIndex === 'number'
			? sourceState.itemRects[draggedIndex]
			: null
	);
	const targetIndex = $derived(
		registry.targetList && registry.isSourceList(rootState)
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
			rootState.props.direction === 'horizontal' &&
			((!rootState.isWithinBounds && rootState.props.canRemoveOnDropOut) || isSlotClosing())
		)
			return 0;
		return `${draggedRect?.width}px`;
	}

	function getStyleHeight() {
		if (
			rootState.props.direction === 'vertical' &&
			((!rootState.isWithinBounds && rootState.props.canRemoveOnDropOut) || isSlotClosing())
		)
			return 0;
		return `${draggedRect?.height}px`;
	}

	function getStyleMargin() {
		if ((!rootState.isWithinBounds && rootState.props.canRemoveOnDropOut) || isSlotClosing()) {
			return rootState.props.direction === 'vertical'
				? `0 calc(var(--ssl-gap) / 2)`
				: 'calc(var(--ssl-gap) / 2) 0';
		}
		return `calc(var(--ssl-gap) / 2)`;
	}

	function getStyleTransform() {
		if (registry.isTargetList(rootState)) return getPeerTransform();

		if (!draggedRect || !targetRect || draggedIndex === null || targetIndex === null)
			return 'translate3d(0, 0, 0)';

		const x =
			rootState.props.direction === 'vertical'
				? 0
				: calculateTranslate('x', targetRect, draggedRect, draggedIndex, targetIndex);
		const y =
			rootState.props.direction === 'vertical'
				? calculateTranslate('y', targetRect, draggedRect, draggedIndex, targetIndex)
				: isInSameRow(draggedRect, targetRect)
					? 0
					: calculateTranslateWithAlignment(rootState.props.ref!, targetRect, draggedRect);

		return `translate3d(${x}px, ${y}px, 0)`;
	}

	function getPeerTransform() {
		const targetItemId = registry.targetList?.targetItemId;
		if (!ref || targetItemId == null) return 'translate3d(0, 0, 0)';

		const targetItem = rootState.props.ref?.querySelector<HTMLLIElement>(
			`.ssl-item[data-item-id="${targetItemId}"]`
		);
		if (!targetItem) return 'translate3d(0, 0, 0)';

		const targetRect = getItemRect(targetItem);
		const placeholderRect = getItemRect(ref);

		return `translate3d(${targetRect.x - placeholderRect.x}px, ${targetRect.y - placeholderRect.y}px, 0)`;
	}

	function getStyleOverflow() {
		if (rootState.props.canRemoveOnDropOut || isSlotClosing()) return 'hidden';
		return undefined;
	}

	const styleWidth = $derived.by(() => {
		void rootState.dragState;
		void sourceState.draggedItem;
		void rootState.isWithinBounds;
		void registry.targetList;
		return untrack(() => getStyleWidth());
	});
	const styleHeight = $derived.by(() => {
		void rootState.dragState;
		void sourceState.draggedItem;
		void rootState.isWithinBounds;
		void registry.targetList;
		return untrack(() => getStyleHeight());
	});
	const styleMargin = $derived.by(() => {
		void rootState.dragState;
		void sourceState.draggedItem;
		void rootState.isWithinBounds;
		void registry.targetList;
		return untrack(() => getStyleMargin());
	});
	const styleTransform = $derived.by(() => {
		void rootState.targetItem;
		void registry.targetList;
		void ref;
		return untrack(() => getStyleTransform());
	});
	const styleOverflow = $derived.by(() => {
		void rootState.dragState;
		void rootState.isWithinBounds;
		void registry.targetList;
		return untrack(() => getStyleOverflow());
	});
</script>

<li
	bind:this={ref}
	{id}
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
	onintroend={() => (isPositioned = true)}
	transition:conditionalTransition
>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html sourceState.draggedItem?.innerHTML}
</li>

<style>
	.ssl-placeholder {
		flex-shrink: 0;
		position: relative;
		list-style: none;
		user-select: none;
		backface-visibility: hidden;
		transition:
			width var(--ssl-transition-duration),
			height var(--ssl-transition-duration),
			margin var(--ssl-transition-duration),
			transform var(--ssl-transition-duration);
	}
</style>
