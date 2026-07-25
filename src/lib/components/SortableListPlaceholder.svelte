<script lang="ts">
	import { untrack } from 'svelte';
	import { getSortableListRootState } from '$lib/states/index.js';
	import type { SortableListPlaceholderProps as PlaceholderProps } from '$lib/types/props.js';
	import {
		calculateTranslate,
		calculateTranslateWithAlignment,
		getIndex,
		isInSameRow,
	} from '$lib/utils/index.js';

	let {
		ref = $bindable(null),
		id,
		index,
		...restProps
	}: PlaceholderProps & { class?: string } = $props();

	const rootState = getSortableListRootState();

	const classes = $derived(['ssl-placeholder', restProps.class]);

	const draggedIndex = $derived(rootState.draggedItem ? getIndex(rootState.draggedItem) : null);
	const draggedRectSnapshot = $derived(
		rootState.itemRectsSnapshot && typeof draggedIndex === 'number'
			? rootState.itemRectsSnapshot[draggedIndex]
			: null
	);
	const targetIndex = $derived(rootState.targetItem ? getIndex(rootState.targetItem) : null);
	const targetRectSnapshot = $derived(
		rootState.itemRectsSnapshot && typeof targetIndex === 'number'
			? rootState.itemRectsSnapshot[targetIndex]
			: null
	);

	function getStyleWidth() {
		if (
			rootState.props.direction === 'horizontal' &&
			!rootState.isBetweenBounds &&
			rootState.props.canRemoveOnDropOut
		)
			return '0';
		return `${draggedRectSnapshot?.width}px`;
	}

	function getStyleHeight() {
		if (
			rootState.props.direction === 'vertical' &&
			!rootState.isBetweenBounds &&
			rootState.props.canRemoveOnDropOut
		)
			return '0';
		return `${draggedRectSnapshot?.height}px`;
	}

	function getStyleMargin() {
		if (!rootState.isBetweenBounds && rootState.props.canRemoveOnDropOut) {
			return rootState.props.direction === 'vertical'
				? `0 calc(var(--ssl-gap) / 2)`
				: 'calc(var(--ssl-gap) / 2) 0';
		}
		return `calc(var(--ssl-gap) / 2)`;
	}

	function getStyleTransform() {
		if (
			!draggedRectSnapshot ||
			!targetRectSnapshot ||
			draggedIndex === null ||
			targetIndex === null
		)
			return 'translate3d(0, 0, 0)';

		const x =
			rootState.props.direction === 'vertical'
				? '0'
				: calculateTranslate(
						'x',
						targetRectSnapshot,
						draggedRectSnapshot,
						draggedIndex,
						targetIndex
					);
		const y =
			rootState.props.direction === 'vertical'
				? calculateTranslate(
						'y',
						targetRectSnapshot,
						draggedRectSnapshot,
						draggedIndex,
						targetIndex
					)
				: isInSameRow(draggedRectSnapshot, targetRectSnapshot)
					? '0'
					: calculateTranslateWithAlignment(
							rootState.props.ref!,
							targetRectSnapshot,
							draggedRectSnapshot
						);

		return `translate3d(${x}px, ${y}px, 0)`;
	}

	function getStyleOverflow() {
		if (rootState.props.canRemoveOnDropOut) return 'hidden';
		return undefined;
	}

	const styleWidth = $derived.by(() => {
		void rootState.draggedItem;
		void rootState.isBetweenBounds;
		return untrack(() => getStyleWidth());
	});
	const styleHeight = $derived.by(() => {
		void rootState.draggedItem;
		void rootState.isBetweenBounds;
		return untrack(() => getStyleHeight());
	});
	const styleMargin = $derived.by(() => {
		void rootState.draggedItem;
		void rootState.isBetweenBounds;
		return untrack(() => getStyleMargin());
	});
	const styleTransform = $derived.by(() => {
		void rootState.targetItem;
		return untrack(() => getStyleTransform());
	});
	const styleOverflow = $derived.by(() => {
		void rootState.isBetweenBounds;
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
	style:overflow={styleOverflow}
	data-item-id={id}
	data-item-index={index}
	data-drag-state={rootState.dragState}
	aria-hidden="true"
>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html rootState.draggedItem?.innerHTML}
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
