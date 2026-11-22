import { tick } from 'svelte';
import type { SortableListRootState as RootState } from '$lib/states/index.js';
import type {
	CrossListModule,
	CrossListOptions,
	ItemRect,
	RegistryList,
	SourceList,
	TargetList,
} from '$lib/types/index.js';
import {
	areColliding,
	getClosestItemRect,
	getCollidingItemRect,
	getIndex,
	getItemRect,
	getItemRectWithOffset,
	getItemRects,
	getItems,
	getPlaceholder,
	getTargetItemFields,
	getVisibleRange,
	isCenterCrossed,
} from '$lib/utils/index.js';

class Registry {
	lists: Record<string, RegistryList[]> = $state.raw({});
	sourceList: SourceList | null = $state.raw(null);
	targetList: TargetList | null = $state.raw(null);
	// Id of the item changing lists. The consumer takes it out of one list and puts it into the other
	// in the same update. While this is set, the item and its placeholder skip their out and in
	// transitions. The real item takes the placeholder’s place, and neither list resizes.
	crossingItemId: string | null = $state.raw(null);
}

const registry = new Registry();

function getGroupLists(group: string) {
	return registry.lists[group] ?? [];
}

function getPeerLists(group: string, exclude: RootState) {
	return getGroupLists(group).filter((l) => l.state !== exclude);
}

function getTargetablePeerLists(group: string, exclude: RootState) {
	return getPeerLists(group, exclude).filter(
		(l) => !l.state.props.isLocked && !l.state.props.isDisabled
	);
}

let peerSnapshot: { list: RegistryList; key: string; rects: ItemRect[] } | null = null;

function getPeerItemRects(list: RegistryList): ItemRect[] {
	const { x, y, width, height } = list.ref.getBoundingClientRect();
	const key = `${x},${y},${width},${height},${list.ref.scrollLeft},${list.ref.scrollTop}`;
	if (peerSnapshot?.list !== list || peerSnapshot.key !== key)
		peerSnapshot = { list, key, rects: getItemRects(list.ref) };

	return peerSnapshot.rects;
}

function targetPeerItem(peer: RegistryList, item: HTMLLIElement) {
	if (registry.targetList?.state !== peer.state || registry.targetList.targetItemId !== item.id)
		registry.targetList = { ...peer, ...getTargetItemFields(item) };
}

// If the peer list is empty, place the dragged item in its first position.
function targetEmptyPeer(peer: RegistryList) {
	if (registry.targetList?.state === peer.state) return;

	registry.targetList = { ...peer, ...getTargetItemFields(null), targetItemIndex: 0 };

	// Wait until `targetList` is set and the placeholder element
	// is appended before setting `targetItem`.
	tick().then(() => {
		// Bail out if the target changed in the meantime.
		if (registry.targetList?.state !== peer.state) return;
		const placeholder = getPlaceholder(peer.ref);
		registry.targetList = { ...registry.targetList, ...getTargetItemFields(placeholder) };
	});
}

export function crossList({ group }: CrossListOptions): CrossListModule {
	return {
		kind: 'crossList',
		group,
		get sourceList() {
			return registry.sourceList;
		},
		get targetList() {
			return registry.targetList;
		},
		set targetList(value) {
			registry.targetList = value;
		},
		get crossingItemId() {
			return registry.crossingItemId;
		},

		register(state) {
			const list: RegistryList = {
				ref: state.ref!,
				group,
				state,
				get id() {
					return state.props.id ?? null;
				},
				get index() {
					return state.props.index ?? null;
				},
			};
			registry.lists = { ...registry.lists, [group]: [...getGroupLists(group), list] };

			return () => {
				if (registry.sourceList?.state === state) {
					registry.sourceList = null;
					registry.targetList = null;
				} else if (registry.targetList?.state === state) {
					registry.targetList = null;
				}

				const groupLists = getGroupLists(group).filter((l) => l !== list);
				const lists = { ...registry.lists };
				// Remove the group once it becomes empty.
				if (groupLists.length) lists[group] = groupLists;
				else delete lists[group];
				registry.lists = lists;
			};
		},

		start(state, item) {
			if (!state.itemRects) return;

			registry.sourceList = {
				group,
				ref: state.ref!,
				state,
				id: state.props.id ?? null,
				index: state.props.index ?? null,
				draggedItem: item,
				draggedItemId: item.id,
				draggedItemIndex: getIndex(item),
			};
		},

		updateTarget(state, draggedRect) {
			const peer = getTargetablePeerLists(group, state).find((l) =>
				areColliding(draggedRect, l.ref.getBoundingClientRect())
			);

			if (!peer) {
				if (
					state.props.canClearOnDragOut ||
					(state.props.canRemoveOnDropOut && !state.isWithinBounds)
				)
					registry.targetList = null;
				return;
			}

			// Dragging over a peer list counts as being between bounds.
			state.isWithinBounds = true;

			const peerItemRects = getPeerItemRects(peer);
			peer.state.visibleRange = getVisibleRange(peerItemRects, draggedRect, peer.state.props.gap!);
			const collidingRect = getCollidingItemRect(draggedRect, peerItemRects);
			if (collidingRect) return targetPeerItem(peer, collidingRect.ref);

			if (!peerItemRects.length) return targetEmptyPeer(peer);

			// Use the placeholder to let the dragged item be dropped at the end of the peer list.
			const placeholder = getPlaceholder(peer.ref);
			if (
				placeholder &&
				registry.targetList?.targetItemIndex !== peerItemRects.length &&
				isCenterCrossed(draggedRect, getItemRect(placeholder))
			)
				registry.targetList = { ...peer, ...getTargetItemFields(placeholder) };
		},

		focusPeer(state, step) {
			const { index } = state.props;
			if (!state.focusedItem || index == null) return;

			// Prevent switching focus if the focused item is located at the first or last list.
			const lastListIndex = getGroupLists(group).length - 1;
			if ((step === -1 && index === 0) || (step === 1 && index === lastListIndex)) return;

			// Leave out peer lists that are empty, so they won’t block the way to the lists behind it.
			const peersWithItems = getPeerLists(group, state).filter((l) => getItems(l.ref).length);
			let nextListIndex = index + step;
			let peer: RegistryList | undefined;
			while (nextListIndex >= 0 && nextListIndex <= lastListIndex) {
				peer = peersWithItems.find((l) => l.index === nextListIndex);
				if (peer) break;
				nextListIndex += step;
			}
			if (!peer) return;

			const closestRect = getClosestItemRect(
				state.focusedItem.getBoundingClientRect(),
				getItemRects(peer.ref)
			);
			closestRect?.ref.focus({ preventScroll: true });
		},

		moveTarget(state, step) {
			const { index } = state.props;
			if (!state.draggedItem || !state.itemRects || index == null) return false;

			const { targetList } = registry;
			const lastListIndex = getGroupLists(group).length - 1;
			const targetablePeers = getTargetablePeerLists(group, state);
			let nextListIndex = (targetList ? targetList.index! : index) + step;
			let peer: RegistryList | undefined;
			while (nextListIndex >= 0 && nextListIndex <= lastListIndex && nextListIndex !== index) {
				peer = targetablePeers.find((l) => l.index === nextListIndex);
				if (peer) break;
				nextListIndex += step;
			}
			// Prevent moving the selected item past the first or last list that can receive it.
			if (nextListIndex < 0 || nextListIndex > lastListIndex) return false;

			if (!state.targetItem) state.targetItem = state.draggedItem;

			const draggedRect = state.draggedItem.getBoundingClientRect();

			if (peer) {
				const closestRect = getClosestItemRect(draggedRect, getItemRects(peer.ref));
				if (closestRect) targetPeerItem(peer, closestRect.ref);
				else targetEmptyPeer(peer);
			} else {
				// Offset the dragged rect by the current scroll.
				const draggedRectWithOffset = getItemRectWithOffset(draggedRect, state.scrollOffset);
				const closestRect = getClosestItemRect(draggedRectWithOffset, state.itemRects);
				if (closestRect) state.targetItem = closestRect.ref;
				registry.targetList = null;
			}

			return true;
		},

		end(state, isCanceled) {
			if (!isCanceled && registry.targetList && state.draggedItem) {
				registry.crossingItemId = state.draggedItem.id;
				requestAnimationFrame(() => (registry.crossingItemId = null));
			}

			// Return their transitions back to the items that shifted out of sight.
			getPeerLists(group, state).forEach((l) => (l.state.visibleRange = null));
			registry.sourceList = null;
			registry.targetList = null;
			peerSnapshot = null;
		},

		getPeerLists(state) {
			return getPeerLists(group, state);
		},

		isOtherDragActive(state) {
			return (
				!!registry.sourceList &&
				registry.sourceList.state !== state &&
				registry.sourceList.state.dragState !== 'idle'
			);
		},
	};
}
