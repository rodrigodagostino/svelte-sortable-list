import { getIndex } from './index.js';

export const announce = {
	lifted: (draggedItem: HTMLElement) => {
		return `You have lifted an item at position ${getIndex(draggedItem)! + 1}.`;
	},

	dragged: (draggedItem: HTMLElement, targetItem: HTMLElement) => {
		const startPosition = getIndex(draggedItem) + 1;
		const endPosition = getIndex(targetItem) + 1;
		const result =
			startPosition !== endPosition
				? `from position ${startPosition} to position ${endPosition}`
				: `back to its starting position of ${startPosition}`;
		return `You have moved the item ${result}.`;
	},

	dropped: (draggedItem: HTMLElement, targetItem: HTMLElement | null) => {
		const startPosition = getIndex(draggedItem)! + 1;
		const endPosition = targetItem ? getIndex(targetItem)! + 1 : null;
		const result =
			endPosition === null
				? `It has remained at its starting position of ${startPosition}`
				: startPosition !== endPosition
					? `It has moved from position ${startPosition} to position ${endPosition}`
					: `It has returned to its starting position of ${startPosition}`;
		return `You have dropped the item. ${result}.`;
	},

	canceled: (draggedItem: HTMLElement) => {
		const draggedItemIndex = getIndex(draggedItem)!;
		return `You have canceled the dragging. The item has returned to its starting position of ${draggedItemIndex + 1}.`;
	},
};
