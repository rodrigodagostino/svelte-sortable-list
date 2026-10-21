import type { SortableListRegistry as Registry } from '$lib/states/index.js';
import type {
	SortableListAnnouncements as Announcements,
	SortableListRootProps as RootProps,
} from '$lib/types/index.js';

export function restoreFocus(
	focusedElement: Element | null,
	crossingItemId: Registry['crossingItemId']
) {
	if (!focusedElement) return;
	// Do not restore the focus if it didn’t get lost.
	const { activeElement } = document;
	if (activeElement && activeElement !== document.body) return;

	const crossingItem = crossingItemId
		? document.querySelector<HTMLLIElement>(
				`.ssl-item[data-item-id="${CSS.escape(crossingItemId)}"]`
			)
		: null;
	const elementToFocus = focusedElement.isConnected ? focusedElement : crossingItem;
	if (elementToFocus instanceof HTMLElement) elementToFocus.focus({ preventScroll: true });
}

function getListLabel(list: RootProps['ref'], listIndex: number): string {
	const labelledBy = list?.getAttribute('aria-labelledby');
	const label =
		list?.getAttribute('aria-label') || document.getElementById(labelledBy!)?.textContent;
	return label ? `${label} list` : `list ${listIndex + 1}`;
}

export const announce: Announcements = {
	lifted: ({ draggedItemIndex, draggedItemType }) => {
		return `You have lifted ${draggedItemType === 'list' ? 'a' : 'an'} ${draggedItemType} at position ${draggedItemIndex + 1}.`;
	},

	dragged: ({
		sourceList,
		sourceListIndex,
		draggedItemIndex,
		draggedItemType,
		targetList,
		targetListIndex,
		targetItemIndex,
	}) => {
		const startPosition = draggedItemIndex + 1;
		const endPosition = targetItemIndex + 1;
		const hasCrossedList = !!targetList && targetList !== sourceList;

		if (hasCrossedList)
			return `You have moved the ${draggedItemType} from position ${startPosition} in ${getListLabel(sourceList, sourceListIndex!)} to position ${endPosition} in ${getListLabel(targetList, targetListIndex!)}.`;

		const result =
			startPosition !== endPosition
				? `from position ${startPosition} to position ${endPosition}`
				: `back to its starting position of ${startPosition}`;
		return `You have moved the ${draggedItemType} ${result}.`;
	},

	dropped: ({
		sourceList,
		sourceListIndex,
		draggedItemIndex,
		draggedItemType,
		targetList,
		targetListIndex,
		targetItemIndex,
	}) => {
		const startPosition = draggedItemIndex + 1;
		const endPosition = typeof targetItemIndex === 'number' ? targetItemIndex + 1 : null;
		const hasCrossedList = !!targetList && targetList !== sourceList;

		if (hasCrossedList)
			return `You have dropped the ${draggedItemType}. It has moved from position ${startPosition} in ${getListLabel(sourceList, sourceListIndex!)} to position ${endPosition} in ${getListLabel(targetList, targetListIndex!)}.`;

		const result =
			endPosition === null
				? `It has remained at its starting position of ${startPosition}`
				: startPosition !== endPosition
					? `It has moved from position ${startPosition} to position ${endPosition}`
					: `It has returned to its starting position of ${startPosition}`;
		return `You have dropped the ${draggedItemType}. ${result}.`;
	},

	canceled: ({ draggedItemIndex, draggedItemType }) => {
		return `You have canceled the dragging. The ${draggedItemType} has returned to its starting position of ${draggedItemIndex + 1}.`;
	},
};

export function getDefaultAriaDescription(
	group: string | undefined,
	direction: RootProps['direction'],
	hasNestedLists = false
) {
	const isVertical = direction === 'vertical';
	const mainAxisArrowKeys = isVertical ? 'Up Arrow or Down Arrow' : 'Left Arrow or Right Arrow';
	const crossAxisArrowKeys = isVertical ? 'Left Arrow or Right Arrow' : 'Up Arrow or Down Arrow';

	if (hasNestedLists)
		return `Press ${mainAxisArrowKeys} to move through the lists. Press Space to start dragging a list. When dragging, use ${mainAxisArrowKeys} to move the list around. Press Space again to drop the list, or Escape to cancel.`;

	return group
		? `Press ${mainAxisArrowKeys} to move through the list items, or ${crossAxisArrowKeys} to move to a different list. Press Space to start dragging an item. When dragging, use ${mainAxisArrowKeys} to move the item within the list, or ${crossAxisArrowKeys} to move it to a different list. Press Space again to drop the item, or Escape to cancel.`
		: `Press ${mainAxisArrowKeys} to move through the list items. Press Space to start dragging an item. When dragging, use ${mainAxisArrowKeys} to move the item around. Press Space again to drop the item, or Escape to cancel.`;
}
