import type { SortableItemData, SortableListProps } from '$lib/types/index.js';

export const defaultProps: SortableListProps = {
	gap: 12,
	direction: 'vertical',
	swapThreshold: 1,
	transitionDuration: 320,
	hasDropMarker: false,
	hasLockedAxis: false,
	hasBoundaries: false,
	hasRemoveOnDropOut: false,
};

Object.freeze(defaultProps);

export const defaultItems: SortableItemData[] = [
	{
		id: 1,
		text: 'List item 1',
	},
	{
		id: 2,
		text: 'List item 2',
	},
	{
		id: 3,
		text: 'List item 3',
	},
	{
		id: 4,
		text: 'List item 4',
	},
	{
		id: 5,
		text: 'List item 5',
	},
];

Object.freeze(defaultItems);

export const varyingItems: SortableItemData[] = [
	{
		id: 1,
		text: 'List item 1',
	},
	{
		id: 2,
		text: 'List item 2 that will break into multiple lines',
	},
	{
		id: 3,
		text: 'List item 3',
	},
	{
		id: 4,
		text: 'List item 4',
	},
	{
		id: 5,
		text: 'List item 5 with a bit more of content that will break into more multiple lines',
	},
];

Object.freeze(varyingItems);

export const disabledItems: SortableItemData[] = [
	{
		id: 1,
		text: 'List item 1',
		isDisabled: false,
	},
	{
		id: 2,
		text: 'List item 2',
		isDisabled: true,
	},
	{
		id: 3,
		text: 'List item 3',
		isDisabled: true,
	},
	{
		id: 4,
		text: 'List item 4',
		isDisabled: false,
	},
	{
		id: 5,
		text: 'List item 5',
		isDisabled: false,
	},
];

Object.freeze(disabledItems);
