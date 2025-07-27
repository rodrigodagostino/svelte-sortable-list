<!--
@component
## <SortableList.Root>
Serves as the primary container. Provides the main structure, the drag-and-drop interactions and emits the available events.

### Props
- `gap`: separation between items (in pixels).
- `direction`: orientation in which items will be arranged.
- `transition`:
		- `duration`: time the transitions for the ghost (dropping) and items (translation, addition, removal) take to complete (in milliseconds). Assign it a value of `0` to remove animations.
		- `easing`: mathematical function that describes the rate at which the transitioning value changes. It receives any of the values accepted by the CSS `transition-timing-function` property. Currently it only affects the ghost drop transition.
- `hasWrapping`: if `true`, items can wrap onto multiple lines.
- `hasLockedAxis`: if `true`, prevents the dragged item from moving away from the main axis.
- `hasBoundaries`: if `true`, items will only be draggable inside the list limits.
- `canClearOnDragOut`: if `true`, the target item will be cleared when a the dragged item (by a pointing device) does not collide with any of the items in the list.
- `canRemoveOnDropOut`: if `true`, items will be removed when dragged and dropped outside of the list boundaries.
- `isLocked`: if `true`, allows items to be focused, but prevents them from being dragged. Interactive elements inside will operate normally.
- `isDisabled`: if `true`, allows items to be focused, but prevents them from being dragged and change its appearance to dimmed. Interactive elements inside will be disabled.
- `announcements`: announcements to be read out by the screen reader during drag and drop operations.

### Events
- `mounted`: the component is mounted.
- `dragstart`: an item starts to be dragged by a pointer device or a keyboard.
- `drag`: a dragged item is moved around by a pointer device or a keyboard (fires every few hundred milliseconds).
- `drop`: a dragged item is released by a pointer device or a keyboard.
- `dragend`: a dragged item reaches its destination after being released.
- `destroyed`: the component is destroyed.

### Usage
```svelte
	<SortableList.Root on:drop={handleDrop} on:dragend={handleDragEnd}>
		{#each items as item, index (item.id)}
			<SortableList.Item {...item} {index}>
				<div class="ssl-item-content">
					<span class="ssl-item-content__text">{item.text}</span>
				</div>
			</SortableList.Item>
		{/each}
	</SortableList.Root>
```
-->

<script lang="ts">
	import {
		afterUpdate,
		beforeUpdate,
		createEventDispatcher,
		onDestroy,
		onMount,
		tick,
	} from 'svelte';
	import { BROWSER } from 'esm-env';
	import SortableListGhost from '$lib/components/SortableListGhost.svelte';
	import {
		setDragState,
		setDraggedItem,
		setFocusedItem,
		setIsBetweenBounds,
		setIsRTL,
		setItemRects,
		setPointer,
		setPointerOrigin,
		setRoot,
		setRootProps,
		setTargetItem,
	} from '$lib/stores/index.js';
	import type {
		DestroyedEventDetail,
		DragEndEventDetail,
		DragEventDetail,
		DragStartEventDetail,
		DropEventDetail,
		MountedEventDetail,
		SortableListGhostProps as GhostProps,
		SortableListRootEvents as RootEvents,
		SortableListRootProps as RootProps,
	} from '$lib/types/index.js';
	import {
		announce,
		areColliding,
		getClosestScrollableAncestor,
		getCollidingItem,
		getIndex,
		getItemRects,
		getScrollingSpeed,
		getTextDirection,
		isFullyVisible,
		isOrResidesInInteractiveElement,
		isRootElement,
		isScrollable,
		joinCSSClasses,
		scrollIntoView,
		shouldAutoScroll,
	} from '$lib/utils/index.js';

	type $$Props = RootProps & { class?: string };
	type $$Events = RootEvents;

	let rootRef: HTMLUListElement;
	let ghostRef: HTMLDivElement;

	export let gap: $$Props['gap'] = 12;
	export let direction: $$Props['direction'] = 'vertical';
	export let transition: $$Props['transition'] = undefined;
	export let hasWrapping: $$Props['hasWrapping'] = false;
	export let hasLockedAxis: $$Props['hasLockedAxis'] = false;
	export let hasBoundaries: $$Props['hasBoundaries'] = false;
	export let canClearOnDragOut: $$Props['canClearOnDragOut'] = false;
	export let canRemoveOnDropOut: $$Props['canRemoveOnDropOut'] = false;
	export let isLocked: $$Props['isLocked'] = false;
	export let isDisabled: $$Props['isDisabled'] = false;
	export let announcements: $$Props['announcements'] = undefined;

	$: _transition = { duration: 240, easing: 'cubic-bezier(0.2, 1, 0.1, 1)', ...transition };
	$: _announcements = announcements || announce;

	$: classes = joinCSSClasses('ssl-root', $$restProps.class);

	const rootProps = setRootProps({
		gap,
		direction,
		transition: _transition,
		hasWrapping,
		hasLockedAxis,
		hasBoundaries,
		canClearOnDragOut,
		canRemoveOnDropOut,
		isLocked,
		isDisabled,
		announcements: _announcements,
	});
	$: $rootProps = {
		gap,
		direction,
		transition: _transition,
		hasWrapping,
		hasLockedAxis,
		hasBoundaries,
		canClearOnDragOut,
		canRemoveOnDropOut,
		isLocked,
		isDisabled,
		announcements: _announcements,
	};

	const root = setRoot(null);
	let pointerId: PointerEvent['pointerId'] | null = null;
	const pointer = setPointer(null);
	const pointerOrigin = setPointerOrigin(null);
	const itemRects = setItemRects(null);
	const draggedItem = setDraggedItem(null);
	const targetItem = setTargetItem(null);
	const focusedItem = setFocusedItem(null);
	let liveText: string = '';

	const dragState = setDragState('idle');
	let ghostState: GhostProps['state'] = 'unset';
	const isBetweenBounds = setIsBetweenBounds(true);
	const isRTL = setIsRTL(false);

	const dispatch = createEventDispatcher<{
		mounted: MountedEventDetail;
		dragstart: DragStartEventDetail;
		drag: DragEventDetail;
		drop: DropEventDetail;
		dragend: DragEndEventDetail;
		destroyed: DestroyedEventDetail;
	}>();

	onMount(() => {
		dispatch('mounted');
		$root = rootRef;
		$isRTL = getTextDirection(rootRef) === 'rtl';
	});

	onDestroy(() => {
		dispatch('destroyed');
	});

	// Svelte currently does not retain focus when elements are moved (even when keyed),
	// so we need to manually keep focus on the selected <SortableList.Item> as items are sorted.
	// https://github.com/sveltejs/svelte/issues/3973
	let activeElement: HTMLLIElement;
	beforeUpdate(() => {
		activeElement = document?.activeElement as HTMLLIElement;
	});
	afterUpdate(() => {
		if (activeElement) activeElement.focus({ preventScroll: true });
	});

	let scrollingSpeed = 0;
	let isScrollingDocument = true;
	$: scrollableAncestor = getClosestScrollableAncestor(rootRef);
	let scrollableAncestorScrollTop: number | undefined = 0;
	$: if (scrollableAncestor) isScrollingDocument = isRootElement(scrollableAncestor, direction);
	$: if (scrollingSpeed !== 0) scroll();

	function scroll() {
		if (!scrollableAncestor) return;

		if (BROWSER)
			requestAnimationFrame(() => {
				if (!shouldAutoScroll(scrollableAncestor, direction, scrollingSpeed)) return;

				const x = direction === 'horizontal' ? scrollingSpeed : 0;
				const y = direction === 'vertical' ? scrollingSpeed : 0;
				scrollableAncestor.scrollBy(x, y);

				if (scrollingSpeed !== 0) scroll();
			});
	}

	function autoScroll(clientX: PointerEvent['clientX'], clientY: PointerEvent['clientY']) {
		if (!scrollableAncestor) return;

		scrollingSpeed = getScrollingSpeed(
			scrollableAncestor,
			clientX,
			clientY,
			direction,
			isScrollingDocument
		);
	}

	async function handlePointerDown(e: PointerEvent) {
		if ($dragState !== 'idle' || $focusedItem) {
			e.preventDefault();
			return;
		}

		const target = e.target as HTMLElement;
		const currItem = target.closest<HTMLLIElement>('.ssl-item');
		if (!currItem) return;

		if (
			(isLocked && !isOrResidesInInteractiveElement(target, currItem)) ||
			(currItem.dataset.isLocked === 'true' &&
				!isOrResidesInInteractiveElement(target, currItem)) ||
			isDisabled ||
			currItem.getAttribute('aria-disabled') === 'true'
		) {
			e.preventDefault();
			return;
		}

		// Prevent default if the clicked/tapped element is a label with a for attribute.
		// NOTE 1: for some reason that is still unknown to me, clicking/tapping a <label> element sets
		// the focus on the current <SortableList.Item>.
		// NOTE 2: We need to run this check before isOrResidesInInteractiveElement() because, if the
		// target is a <label> element, it will stop the execution of this event handler and the
		// preventDefault() right after will never run, but we can’t preventDefault() for every element
		// because we need to allow interactive elements to run normally.
		if (target.tagName.toLowerCase() === 'label' && target.hasAttribute('for')) e.preventDefault();

		// Prevent dragging if the current list item contains a handle, but we’re not dragging from it.
		const hasHandle = !!currItem.querySelector('[data-role="handle"]');
		const targetIsOrResidesInHandle = target.closest('[data-role="handle"]');
		if (hasHandle && !targetIsOrResidesInHandle) {
			e.preventDefault();
			return;
		}

		// Prevent dragging if the current list item contains an interactive element
		// and we’re also not dragging from a handle inside that interactive element.
		if (isOrResidesInInteractiveElement(target, currItem) && !targetIsOrResidesInHandle) return;
		// Prevent focus from being set on the current <SortableList.Item>.
		e.preventDefault();

		pointerId = e.pointerId;
		currItem.setPointerCapture(pointerId);

		$pointer = { x: e.clientX, y: e.clientY };
		$pointerOrigin = { x: e.clientX, y: e.clientY };
		$draggedItem = currItem;
		$itemRects = getItemRects(rootRef);
		await tick();
		ghostState = 'init';
		$dragState = 'pointer-dragging';
		dispatch('dragstart', {
			deviceType: 'pointer',
			draggedItem: currItem,
			draggedItemId: currItem.id,
			draggedItemIndex: getIndex(currItem),
			isBetweenBounds: $isBetweenBounds,
			canRemoveOnDropOut: canRemoveOnDropOut || false,
		});

		currItem.addEventListener('pointermove', handlePointerMove);
		currItem.addEventListener(
			'pointerup',
			() => {
				currItem.removeEventListener('pointermove', handlePointerMove);
				handlePointerUp();
			},
			{ once: true }
		);
	}

	let rafId: number | null = null;
	async function handlePointerMove({ clientX, clientY }: PointerEvent) {
		if (rafId || $dragState !== 'pointer-dragging') return;

		rafId = requestAnimationFrame(async () => {
			if (!$draggedItem || !$itemRects || !ghostRef) return;

			dispatch('drag', {
				deviceType: 'pointer',
				draggedItem: $draggedItem,
				draggedItemId: $draggedItem.id,
				draggedItemIndex: getIndex($draggedItem),
				targetItem: $targetItem,
				targetItemId: $targetItem ? $targetItem.id : null,
				targetItemIndex: $targetItem ? getIndex($targetItem) : null,
				isBetweenBounds: $isBetweenBounds,
				canRemoveOnDropOut: canRemoveOnDropOut || false,
			});

			const rootRect = rootRef.getBoundingClientRect();
			const ghostRect = ghostRef.getBoundingClientRect();
			$pointer = { x: clientX, y: clientY };
			$isBetweenBounds = areColliding(ghostRect, rootRect);

			// Re-set itemRects only during scrolling.
			// (setting it here instead of in the `scroll()` function to reduce the performance impact)
			if (scrollableAncestor?.scrollTop !== scrollableAncestorScrollTop) {
				$itemRects = getItemRects(rootRef);
				scrollableAncestorScrollTop = scrollableAncestor?.scrollTop;
			}
			await tick();
			const collidingItemRect = getCollidingItem(ghostRect, $itemRects);
			if (collidingItemRect)
				$targetItem = rootRef.querySelector<HTMLLIElement>(
					`.ssl-item[data-item-id="${collidingItemRect.id}"]`
				);
			else if (canClearOnDragOut || (canRemoveOnDropOut && !$isBetweenBounds)) $targetItem = null;

			if (isScrollable(scrollableAncestor, direction)) autoScroll(clientX, clientY);

			rafId = null;
		});
	}

	function handlePointerUp() {
		handlePointerAndKeyboardDrop(ghostRef, 'pointer-drop');
	}

	function handlePointerCancel() {
		handlePointerAndKeyboardDrop(ghostRef, 'pointer-cancel');
	}

	async function handleKeyDown(e: KeyboardEvent) {
		if ($dragState === 'keyboard-dropping') {
			e.preventDefault();
			return;
		}

		const { key } = e;
		const target = e.target as HTMLElement;

		if (target === rootRef || target === $focusedItem) {
			if (key === ' ') {
				// Prevent default only if the target is a sortable item.
				// This allows interactive elements (like buttons) to operate normally.
				if (
					!target.classList.contains('ssl-item') ||
					isLocked ||
					target.dataset.isLocked === 'true'
				)
					return;
				else e.preventDefault();

				if (!$focusedItem || target.getAttribute('aria-disabled') === 'true') return;

				if ($dragState !== 'keyboard-dragging') {
					$dragState = 'keyboard-dragging';

					await tick();
					$draggedItem = $focusedItem;
					const draggedIndex = getIndex($focusedItem);
					$itemRects = getItemRects(rootRef);
					dispatch('dragstart', {
						deviceType: 'keyboard',
						draggedItem: $draggedItem,
						draggedItemId: $focusedItem.id,
						draggedItemIndex: draggedIndex,
						isBetweenBounds: $isBetweenBounds,
						canRemoveOnDropOut: canRemoveOnDropOut || false,
					});
					liveText = _announcements.lifted($draggedItem, draggedIndex);
				} else {
					handlePointerAndKeyboardDrop($focusedItem, 'keyboard-drop');
				}
			}

			if (key === 'ArrowUp' || key === 'ArrowLeft' || key === 'ArrowDown' || key === 'ArrowRight') {
				e.preventDefault();

				const step =
					key === 'ArrowUp' || (key === 'ArrowLeft' && !$isRTL) || (key === 'ArrowRight' && $isRTL)
						? -1
						: 1;
				const focusedIndex = $focusedItem ? getIndex($focusedItem) : null;

				if ($dragState !== 'keyboard-dragging') {
					if (!$focusedItem || focusedIndex === null) {
						const firstItem = rootRef.querySelector<HTMLLIElement>('.ssl-item');
						if (!firstItem) return;
						firstItem.focus({ preventScroll: true });
						if (scrollableAncestor && !isFullyVisible(firstItem, scrollableAncestor))
							scrollIntoView(firstItem, scrollableAncestor, direction, -1, isScrollingDocument);
						return;
					}

					// Prevent focusing the previous item if the current one is the first,
					// and focusing the next item if the current one is the last.
					const items = rootRef.querySelectorAll<HTMLLIElement>('.ssl-item');
					if (
						(step === -1 && focusedIndex === 0) ||
						(step === 1 && focusedIndex === items.length - 1)
					)
						return;

					if (step === 1)
						($focusedItem.nextElementSibling as HTMLLIElement)?.focus({ preventScroll: true });
					else
						($focusedItem.previousElementSibling as HTMLLIElement)?.focus({ preventScroll: true });
				} else {
					if (!$draggedItem || !$itemRects) return;

					const draggedId = $draggedItem.id;
					const draggedIndex = getIndex($draggedItem);
					let targetId = $targetItem ? $targetItem.id : null;
					let targetIndex = $targetItem ? getIndex($targetItem) : null;
					// Prevent moving the selected item if it’s the first or last item,
					// or is at the top or bottom of the list.
					if (
						(step === -1 && draggedIndex === 0 && !targetItem) ||
						(step === -1 && targetIndex === 0) ||
						(step === 1 && draggedIndex === $itemRects.length - 1 && !targetItem) ||
						(step === 1 && targetIndex === $itemRects.length - 1)
					)
						return;

					if (!$targetItem) {
						$targetItem =
							step === 1
								? ($draggedItem.nextElementSibling as HTMLLIElement)
								: ($draggedItem.previousElementSibling as HTMLLIElement);
					} else {
						$targetItem =
							step === 1
								? ($targetItem.nextElementSibling as HTMLLIElement)
								: ($targetItem.previousElementSibling as HTMLLIElement);
					}

					await tick();
					targetId = $targetItem.id;
					targetIndex = getIndex($targetItem);
					dispatch('drag', {
						deviceType: 'keyboard',
						draggedItem: $draggedItem,
						draggedItemId: draggedId,
						draggedItemIndex: draggedIndex,
						targetItem: $targetItem,
						targetItemId: targetId,
						targetItemIndex: targetIndex,
						isBetweenBounds: $isBetweenBounds,
						canRemoveOnDropOut: canRemoveOnDropOut || false,
					});
					if (scrollableAncestor && !isFullyVisible($targetItem, scrollableAncestor))
						scrollIntoView($targetItem, scrollableAncestor, direction, step, isScrollingDocument);
					liveText = _announcements.dragged($draggedItem, draggedIndex, $targetItem, targetIndex);
				}

				await tick();
				const scrollTarget = $dragState !== 'keyboard-dragging' ? $focusedItem : $targetItem;
				if (scrollTarget && scrollableAncestor && !isFullyVisible(scrollTarget, scrollableAncestor))
					scrollIntoView(scrollTarget, scrollableAncestor, direction, step, isScrollingDocument);
			}

			if (key === 'Home' || key === 'End') {
				e.preventDefault();

				const items = rootRef.querySelectorAll<HTMLLIElement>('.ssl-item');
				const focusedIndex = ($focusedItem && getIndex($focusedItem)) ?? null;

				if ($dragState !== 'keyboard-dragging') {
					// Prevent focusing the previous item if the current one is the first,
					// and focusing the next item if the current one is the last.
					if (
						(key === 'Home' && focusedIndex === 0) ||
						(key === 'End' && focusedIndex === items.length - 1)
					)
						return;

					if (key === 'Home') items[0]?.focus({ preventScroll: true });
					else items[items.length - 1]?.focus({ preventScroll: true });
				} else {
					if (!$draggedItem || !$itemRects) return;

					const draggedIndex = getIndex($draggedItem);
					const targetIndex = $targetItem ? getIndex($targetItem) : null;
					// Prevent moving the selected item if it’s the first or last item,
					// or is at the top or bottom of the list.
					if (
						(key === 'Home' && draggedIndex === 0 && !targetItem) ||
						(key === 'Home' && targetIndex === 0) ||
						(key === 'End' && draggedIndex === $itemRects.length - 1 && !targetItem) ||
						(key === 'End' && targetIndex === $itemRects.length - 1)
					)
						return;

					$targetItem = key === 'Home' ? items[0] : items[items.length - 1];
					liveText = _announcements.dragged(
						$draggedItem,
						draggedIndex,
						$targetItem,
						getIndex($targetItem)
					);
				}

				await tick();
				const scrollTarget = $dragState !== 'keyboard-dragging' ? $focusedItem : $targetItem;
				const step = key === 'Home' ? -1 : 1;
				if (scrollTarget && scrollableAncestor && !isFullyVisible(scrollTarget, scrollableAncestor))
					scrollIntoView(scrollTarget, scrollableAncestor, direction, step, isScrollingDocument);
			}

			if (key === 'Escape' && $draggedItem) {
				handlePointerAndKeyboardDrop($draggedItem, 'keyboard-cancel');
			}
		}
	}

	async function handlePointerAndKeyboardDragEnd(
		action: 'pointer-drop' | 'pointer-cancel' | 'keyboard-drop' | 'keyboard-cancel'
	) {
		if ($draggedItem)
			dispatch('dragend', {
				deviceType: action.includes('pointer') ? 'pointer' : 'keyboard',
				draggedItem: $draggedItem,
				draggedItemId: $draggedItem.id,
				draggedItemIndex: getIndex($draggedItem),
				targetItem: $targetItem,
				targetItemId: $targetItem ? $targetItem.id : null,
				targetItemIndex: $targetItem ? getIndex($targetItem) : null,
				isBetweenBounds: $isBetweenBounds,
				canRemoveOnDropOut: canRemoveOnDropOut || false,
				isCanceled: action.includes('cancel'),
			});

		if (typeof pointerId === 'number' && $draggedItem?.hasPointerCapture(pointerId))
			$draggedItem?.releasePointerCapture(pointerId);
		pointerId = null;
		$pointer = null;
		$pointerOrigin = null;
		$draggedItem = null;
		$targetItem = null;
		$itemRects = null;
		ghostState = 'unset';
		$dragState = 'idle';
		$isBetweenBounds = true;
	}

	async function handlePointerAndKeyboardDrop(
		element: HTMLElement,
		action: 'pointer-drop' | 'pointer-cancel' | 'keyboard-drop' | 'keyboard-cancel'
	) {
		if (
			!$draggedItem ||
			(action.includes('pointer') && $dragState === 'pointer-dropping') ||
			(action.includes('keyboard') && $dragState === 'keyboard-dropping')
		)
			return;

		const draggedIndex = getIndex($draggedItem);
		const targetIndex = $targetItem ? getIndex($targetItem) : null;

		if ($draggedItem)
			dispatch('drop', {
				deviceType: action.includes('pointer') ? 'pointer' : 'keyboard',
				draggedItem: $draggedItem,
				draggedItemId: $draggedItem.id,
				draggedItemIndex: draggedIndex,
				targetItem: $targetItem,
				targetItemId: $targetItem ? $targetItem.id : null,
				targetItemIndex: targetIndex,
				isBetweenBounds: $isBetweenBounds,
				canRemoveOnDropOut: canRemoveOnDropOut || false,
			});

		if (action === 'pointer-drop') {
			ghostState = !$isBetweenBounds && canRemoveOnDropOut ? 'remove' : 'preset';
			await tick();
			$dragState = 'pointer-dropping';
			if (ghostState !== 'remove') ghostState = 'set';
			scrollingSpeed = 0;
		} else if (action === 'pointer-cancel') {
			$dragState = 'pointer-canceling';
			if (ghostState !== 'remove') ghostState = 'set';
			scrollingSpeed = 0;
		}

		if (action === 'keyboard-drop' && $draggedItem) {
			$dragState = 'keyboard-dropping';
			liveText = _announcements.dropped($draggedItem, draggedIndex, $targetItem, targetIndex);
		} else if (action === 'keyboard-cancel' && $draggedItem) {
			$dragState = 'keyboard-canceling';
			await tick();
			if (scrollableAncestor)
				scrollIntoView($draggedItem, scrollableAncestor, direction, -1, isScrollingDocument);
			liveText = _announcements.canceled($draggedItem, draggedIndex);
		}

		function handleTransitionEnd({ propertyName }: TransitionEvent) {
			if (propertyName === 'z-index') {
				handlePointerAndKeyboardDragEnd(action);
				element?.removeEventListener('transitionend', handleTransitionEnd);
			}
		}

		if (_transition.duration > 0) element?.addEventListener('transitionend', handleTransitionEnd);
		else handlePointerAndKeyboardDragEnd(action);
	}
</script>

<!-- svelte-ignore a11y-role-supports-aria-props -->
<ul
	bind:this={rootRef}
	class={classes}
	style:pointer-events={$focusedItem ? 'none' : 'auto'}
	style:--ssl-gap="{gap}px"
	style:--ssl-wrap={hasWrapping ? 'wrap' : 'nowrap'}
	style:--ssl-transition-duration="{_transition.duration}ms"
	style:--ssl-transition-easing={_transition.easing}
	data-has-locked-axis={hasLockedAxis}
	data-has-boundaries={hasBoundaries}
	data-can-clear-on-drag-out={canClearOnDragOut}
	data-can-remove-on-drop-out={canRemoveOnDropOut}
	data-is-locked={isLocked}
	data-is-disabled={isDisabled}
	tabindex="0"
	role="listbox"
	aria-orientation={direction}
	aria-disabled={isDisabled}
	aria-label={$$restProps['aria-label'] || undefined}
	aria-labelledby={$$restProps['aria-labelledby'] || undefined}
	aria-description={!$$restProps['aria-describedby']
		? $$restProps['aria-description'] ||
			'Press the arrow keys to move through the list items. Press Space to start dragging an item. When dragging, use the arrow keys to move the item around. Press Space again to drop the item, or Escape to cancel.'
		: undefined}
	aria-describedby={$$restProps['aria-describedby'] || undefined}
	aria-activedescendant={$focusedItem ? $focusedItem.id : undefined}
	on:pointerdown={handlePointerDown}
	on:pointercancel={handlePointerCancel}
	on:keydown={handleKeyDown}
	on:itemfocusout={(event) => handlePointerAndKeyboardDrop(event.detail.item, 'keyboard-cancel')}
>
	<slot>
		<p>
			To display your list, provide an array of <code>items</code> to
			<code>{'<SortableList.Root>'}</code>.
		</p>
	</slot>
</ul>
<!-- The following if clause will prevent the <SortableListItem> -->
<!-- inside <SortableListGhost> from transitioning out on page navigation. -->
{#if $root}
	<SortableListGhost bind:ghostRef state={ghostState} />
{/if}
<div class="ssl-live-region" aria-live="assertive" aria-atomic="true">{liveText}</div>

<style>
	.ssl-root,
	.ssl-root :global(*) {
		box-sizing: border-box;
	}

	.ssl-root {
		display: flex;
		flex-wrap: var(--ssl-wrap);
		padding-inline-start: 0;
		margin: calc(var(--ssl-gap) / 2 * -1);

		&[aria-orientation='vertical'] {
			flex-direction: column;

			&[data-can-remove-on-drop-out='true']
				.ssl-item[data-drag-state*='pointer'][data-is-between-bounds='false'] {
				margin: 0 calc(var(--ssl-gap) / 2);
			}
		}

		&[aria-orientation='horizontal'] {
			flex-direction: row;

			&[data-can-remove-on-drop-out='true'] .ssl-item[data-is-between-bounds='false'] {
				margin: calc(var(--ssl-gap) / 2) 0;
			}
		}

		&[data-can-remove-on-drop-out='true']
			.ssl-item[data-is-ghost='false'][data-drag-state*='pointer'] {
			overflow: hidden;
		}
	}

	.ssl-live-region {
		position: absolute;
		left: 0px;
		top: 0px;
		clip: rect(0px, 0px, 0px, 0px);
		clip-path: inset(50%);
		overflow: hidden;
		white-space: nowrap;
		width: 1px;
		height: 1px;
	}
</style>
