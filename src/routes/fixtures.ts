import type { SortableListProps } from '$lib/types.js';

export const defaultItems: SortableListProps['items'] = [
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

export const varyingItems: SortableListProps['items'] = [
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

export const disabledItems: SortableListProps['items'] = [
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
