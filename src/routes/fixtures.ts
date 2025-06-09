import type { SortableList } from '$lib/index.js';

export const defaultProps: SortableList.RootProps = {
	gap: 12,
	direction: 'vertical',
	transitionDuration: 240,
	hasDropMarker: false,
	hasLockedAxis: false,
	hasBoundaries: false,
	canClearOnDragOut: false,
	canRemoveOnDropOut: false,
	isLocked: false,
	isDisabled: false,
};

export const defaultItems: SortableList.ItemData[] = [
	{
		id: 'list-item-1',
		text: 'List item 1',
	},
	{
		id: 'list-item-2',
		text: 'List item 2',
	},
	{
		id: 'list-item-3',
		text: 'List item 3',
	},
	{
		id: 'list-item-4',
		text: 'List item 4',
	},
	{
		id: 'list-item-5',
		text: 'List item 5',
	},
];

export const varyingItems: SortableList.ItemData[] = [
	{
		id: 'list-item-1',
		text: 'List item 1',
	},
	{
		id: 'list-item-2',
		text: 'List item 2 that will break into multiple lines',
	},
	{
		id: 'list-item-3',
		text: 'List item 3',
	},
	{
		id: 'list-item-4',
		text: 'List item 4',
	},
	{
		id: 'list-item-5',
		text: 'List item 5 with a bit more of content that will break into more multiple lines',
	},
];

export const lockedItems: SortableList.ItemData[] = [
	{
		id: 'locked-item-1',
		text: 'Locked item 1',
		isLocked: true,
	},
	{
		id: 'locked-item-2',
		text: 'Locked item 2',
		isLocked: true,
	},
	{
		id: 'locked-item-3',
		text: 'Locked item 3',
		isLocked: true,
	},
	{
		id: 'locked-item-4',
		text: 'Locked item 4',
		isLocked: true,
	},
	{
		id: 'locked-item-5',
		text: 'Locked item 5',
		isLocked: true,
	},
];

export const disabledItems: SortableList.ItemData[] = [
	{
		id: 'disabled-item-1',
		text: 'Disabled item 1',
		isDisabled: true,
	},
	{
		id: 'disabled-item-2',
		text: 'Disabled item 2',
		isDisabled: true,
	},
	{
		id: 'disabled-item-3',
		text: 'Disabled item 3',
		isDisabled: true,
	},
	{
		id: 'disabled-item-4',
		text: 'Disabled item 4',
		isDisabled: true,
	},
	{
		id: 'disabled-item-5',
		text: 'Disabled item 5',
		isDisabled: true,
	},
];

export const interactiveItems: SortableList.ItemData[] = [
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
