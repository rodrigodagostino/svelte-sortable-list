import type { SortableList } from '$lib/index.js';

export const defaultRootProps: SortableList.RootProps = {
	gap: 12,
	direction: 'vertical',
	transition: {
		duration: 240,
		easing: 'cubic-bezier(0.2, 1, 0.1, 1)',
	},
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
		text: `List Item ${i + 1}`,
	}));
}

export function getVaryingItems(length: number): SortableList.ItemData[] {
	return Array.from({ length }, (_, i) => {
		const number = i + 1;
		const text =
			number % 5 === 0
				? `List Item ${number} with a bit more of content that will break into more multiple lines`
				: String(number / 5).split('.')[1] === '4'
					? `List Item ${number} that will break into multiple lines`
					: `List Item ${number}`;
		return {
			id: `list-item-${number}`,
			text,
		};
	});
}

export function getLockedItems(length: number): SortableList.ItemData[] {
	return Array.from({ length }, (_, i) => ({
		id: `locked-item-${i + 1}`,
		text: `Locked Item ${i + 1}`,
		isLocked: true,
	}));
}

export function getDisabledItems(length: number): SortableList.ItemData[] {
	return Array.from({ length }, (_, i) => ({
		id: `disabled-item-${i + 1}`,
		text: `Disabled Item ${i + 1}`,
		isDisabled: true,
	}));
}

export function getInteractiveItems(): SortableList.ItemData[] {
	return [
		{
			id: 'list-item-1',
			text: 'List Item 1',
			type: 'input',
		},
		{
			id: 'list-item-2',
			text: 'List Item 2',
			type: 'textarea',
		},
		{
			id: 'list-item-3',
			text: 'List Item 3',
			type: 'select',
		},
		{
			id: 'list-item-4',
			text: 'List Item 4',
			type: 'checkbox',
		},
		{
			id: 'list-item-5',
			text: 'List Item 5',
			type: 'button',
		},
		{
			id: 'list-item-6',
			text: 'List Item 6',
			type: 'a',
		},
	];
}
