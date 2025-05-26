import { getIndex } from './index.js';
import type { SortableItemProps } from '$lib/types/index.js';

export const screenReaderText = {
	item: (index: SortableItemProps['index'], isDisabled: SortableItemProps['isDisabled']) => {
		return [
			`Draggable item at position ${index + 1}.`,
			...(!isDisabled ? ['Press Space Bar to lift it.'] : []),
		].join(' ');
	},

	lifted: (draggedItem: HTMLLIElement) => {
		const textContent = draggedItem.textContent ? draggedItem.textContent : 'the item';
		return `Lifted ${textContent} at position ${
			getIndex(draggedItem)! + 1
		}. Press Arrow Down or Arrow Right to move it down, Arrow Up or Arrow Left to move it up, and Space Bar to drop it.`;
	},

	dragged: (
		draggedItem: HTMLLIElement,
		targetItem: HTMLLIElement,
		key: 'ArrowUp' | 'ArrowLeft' | 'ArrowDown' | 'ArrowRight' | 'Home' | 'End'
	) => {
		const textContent = draggedItem.textContent ? draggedItem.textContent : 'the item';
		const direction = key === 'ArrowUp' || key === 'ArrowLeft' || key === 'Home' ? 'up' : 'down';
		const position = getIndex(targetItem)! + 1;
		return `Moved ${textContent} ${direction} to position ${position}.`;
	},

	dropped: (draggedItem: HTMLLIElement, targetItem: HTMLLIElement | null) => {
		const draggedItemIndex = getIndex(draggedItem)!;
		const targetItemIndex = (targetItem && getIndex(targetItem)) ?? null;

		const element = draggedItem.textContent ? draggedItem.textContent : 'the item';
		const direction =
			!targetItem || targetItemIndex === null
				? null
				: draggedItemIndex > targetItemIndex
					? 'up'
					: 'down';
		const result =
			targetItem && targetItemIndex !== null && draggedItemIndex !== targetItemIndex
				? `moved ${direction} from position ${draggedItemIndex + 1} to ${targetItemIndex + 1}`
				: `hasn’t changed position`;
		return `Dropped ${element}, ${result}.`;
	},

	canceled: (draggedItem: HTMLLIElement) => {
		return `Movement has been canceled. The item has returned to its starting position of ${getIndex(draggedItem)! + 1}.`;
	},
};
