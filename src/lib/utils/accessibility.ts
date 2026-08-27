import type {
	SortableListAnnouncements as Announcements,
	SortableListRootProps as RootProps,
} from '$lib/types/index.js';

function getListLabel(list: RootProps['ref'], listIndex: number): string {
	const labelledBy = list?.getAttribute('aria-labelledby');
	const label =
		list?.getAttribute('aria-label') || document.getElementById(labelledBy!)?.textContent;
	return label ? `${label} list` : `list ${listIndex + 1}`;
}

export const announce: Announcements = {
	lifted: ({ draggedItemIndex }) => {
		return `You have lifted an item at position ${draggedItemIndex + 1}.`;
	},

	dragged: ({
		sourceList,
		sourceListIndex,
		draggedItemIndex,
		targetList,
		targetListIndex,
		targetItemIndex,
	}) => {
		const startPosition = draggedItemIndex + 1;
		const endPosition = targetItemIndex + 1;
		const hasCrossedList = !!targetList && targetList !== sourceList;

		if (hasCrossedList)
			return `You have moved the item from position ${startPosition} in ${getListLabel(sourceList, sourceListIndex!)} to position ${endPosition} in ${getListLabel(targetList, targetListIndex!)}.`;

		const result =
			startPosition !== endPosition
				? `from position ${startPosition} to position ${endPosition}`
				: `back to its starting position of ${startPosition}`;
		return `You have moved the item ${result}.`;
	},

	dropped: ({
		sourceList,
		sourceListIndex,
		draggedItemIndex,
		targetList,
		targetListIndex,
		targetItemIndex,
	}) => {
		const startPosition = draggedItemIndex + 1;
		const endPosition = typeof targetItemIndex === 'number' ? targetItemIndex + 1 : null;
		const hasCrossedList = !!targetList && targetList !== sourceList;

		if (hasCrossedList)
			return `You have dropped the item. It has moved from position ${startPosition} in ${getListLabel(sourceList, sourceListIndex!)} to position ${endPosition} in ${getListLabel(targetList, targetListIndex!)}.`;

		const result =
			endPosition === null
				? `It has remained at its starting position of ${startPosition}`
				: startPosition !== endPosition
					? `It has moved from position ${startPosition} to position ${endPosition}`
					: `It has returned to its starting position of ${startPosition}`;
		return `You have dropped the item. ${result}.`;
	},

	canceled: ({ draggedItemIndex }) => {
		return `You have canceled the dragging. The item has returned to its starting position of ${draggedItemIndex + 1}.`;
	},
};

export function getDefaultAriaDescription(
	group: string | undefined,
	direction: RootProps['direction']
) {
	const isVertical = direction === 'vertical';
	const mainAxisArrowKeys = isVertical ? 'Up Arrow or Down Arrow' : 'Left Arrow or Right Arrow';
	const crossAxisArrowKeys = isVertical ? 'Left Arrow or Right Arrow' : 'Up Arrow or Down Arrow';

	return group
		? `Press ${mainAxisArrowKeys} to move through the list items, or ${crossAxisArrowKeys} to move to a different list. Press Space to start dragging an item. When dragging, use ${mainAxisArrowKeys} to move the item within the list, or ${crossAxisArrowKeys} to move it to a different list. Press Space again to drop the item, or Escape to cancel.`
		: `Press ${mainAxisArrowKeys} to move through the list items. Press Space to start dragging an item. When dragging, use ${mainAxisArrowKeys} to move the item around. Press Space again to drop the item, or Escape to cancel.`;
}
