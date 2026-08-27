import type { SortableListAnnouncements as Announcements } from '$lib/types/index.js';

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
			return `You have moved the item from position ${startPosition} in list ${sourceListIndex! + 1} to position ${endPosition} in list ${targetListIndex! + 1}.`;

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
			return `You have dropped the item. It has moved from position ${startPosition} in list ${sourceListIndex! + 1} to position ${endPosition} in list ${targetListIndex! + 1}.`;

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
