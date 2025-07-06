import type { SortableList } from '$lib/index.js';

export const defaultRootProps: SortableList.RootProps = {
	gap: 12,
	direction: 'vertical',
	transition: {
		duration: 240,
		easing: 'cubic-bezier(0.2, 1, 0.1, 1)',
	},
	hasDropMarker: false,
	hasWrapping: false,
	hasLockedAxis: false,
	hasBoundaries: false,
	canClearOnDragOut: false,
	canRemoveOnDropOut: false,
	isLocked: false,
	isDisabled: false,
};

export function getDefaultItems(length: number): SortableList.ItemData[] {
	return Array.from({ length }, (_, i) => ({
		id: `list-item-${i + 1}`,
		text: `List item ${i + 1}`,
	}));
}

export function getVaryingItems(length: number): SortableList.ItemData[] {
	return Array.from({ length }, (_, i) => {
		const number = i + 1;
		const text =
			number % 5 === 0
				? `List item ${number} with a bit more of content that will break into more multiple lines`
				: String(number / 5).split('.')[1] === '4'
					? `List item ${number} that will break into multiple lines`
					: `List item ${number}`;
		return {
			id: `list-item-${number}`,
			text,
		};
	});
}

export function getLockedItems(length: number): SortableList.ItemData[] {
	return Array.from({ length }, (_, i) => ({
		id: `locked-item-${i + 1}`,
		text: `Locked item ${i + 1}`,
		isLocked: true,
	}));
}

export function getDisabledItems(length: number): SortableList.ItemData[] {
	return Array.from({ length }, (_, i) => ({
		id: `disabled-item-${i + 1}`,
		text: `Disabled item ${i + 1}`,
		isDisabled: true,
	}));
}

export function getInteractiveItems(): SortableList.ItemData[] {
	return [
		{
			id: 'list-item-1',
			text: 'List item 1',
			type: 'input',
		},
		{
			id: 'list-item-2',
			text: 'List item 2',
			type: 'textarea',
		},
		{
			id: 'list-item-3',
			text: 'List item 3',
			type: 'select',
		},
		{
			id: 'list-item-4',
			text: 'List item 4',
			type: 'checkbox',
		},
		{
			id: 'list-item-5',
			text: 'List item 5',
			type: 'button',
		},
		{
			id: 'list-item-6',
			text: 'List item 6',
			type: 'a',
		},
	];
}
