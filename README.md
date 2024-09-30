# Svelte Sortable List

A package to create accessible sortable lists in Svelte.

![NPM Version](https://img.shields.io/npm/v/@rodrigodagostino/svelte-sortable-list) [![Latest release](https://img.shields.io/github/release/rodrigodagostino/svelte-sortable-list.svg)](https://github.com/rodrigodagostino/svelte-sortable-list/releases/latest) [![License](https://img.shields.io/github/license/rodrigodagostino/svelte-sortable-list.svg)](LICENSE.md)

![Preview](https://raw.githubusercontent.com/rodrigodagostino/svelte-sortable-list/master/static/preview.gif?raw=true)

Live demo:

- [Netlify](https://svelte-sortable-list.netlify.app)
- [Vercel](https://svelte-sortable-list.vercel.app)

## Table of contents

- [Features](#features)
- [Get started](#get-started)
  - [Install it](#install-it)
  - [Import it](#import-it)
  - [Use it](#use-it)
- [Keyboard navigation](#keyboard-navigation)
- [Components](#components)
  - [`<SortableList>` props](#sortablelist-props)
  - [`<SortableList>` events](#sortablelist-events)
  - [`<SortableItem>` props](#sortableitem-props)
- [Utilities](#utilities)
- [Types](#types)
- [Styles](#styles)
  - [Selectors](#selectors)
  - [Custom properties](#custom-properties)
- [Motivation](#motivation)

## Features

- Accessibility focused (keyboard navigation and screen reader support).
- Drag and drop.
- Handle.
- Drop marker.
- Varying heights.
- Vertical and horizontal direction.
- Lockable axis.
- Remove on drop outside.
- Touch screen support.
- RTL support.
- Un-opinionated styling.
- Typescript definitions.
- No dependencies.

## Get started

### Install it

```bash
pnpm install @rodrigodagostino/svelte-sortable-list
```

```bash
npm install @rodrigodagostino/svelte-sortable-list
```

```bash
yarn add @rodrigodagostino/svelte-sortable-list
```

### Import it

```ts
<script lang="ts">
	import { SortableList, sortItems, type SortableListProps } from 'svelte-sortable-list';
</script>
```

### Use it

```ts
<script lang="ts">
	import { SortableItem, SortableList, sortItems } from '$lib/index.js';
	import type { SortableItemData } from '$lib/types/index.js';
	import '$lib/styles.css';

	let items: SortableItemData[] = [
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

	function handleSort(event: CustomEvent<SortEventDetail>) {
		const { prevItemIndex, nextItemIndex } = event.detail;
		items = sortItems(items, prevItemIndex, nextItemIndex);
	}
</script>

<SortableList on:sort={handleSort}>
	{#each items as item, index (item.id)}
		<SortableItem id={item.id} {index}>
			<div class="ssl-item__content">
				{item.text}
			</div>
		</SortableItem>
	{/each}
</SortableList>
```

## Keyboard navigation

The following is a list of steps to navigate and operate the Sortable List:

1. Press `tab` to focus the list.
2. Press `arrow up`, `arrow left`, `arrow down` or `arrow right` to focus the first item in the list.
3. Press `arrow up` or `arrow left` to move the focus to the previous item.
4. Press `arrow down` or `arrow right` to move the focus to the next item.
5. Press `space` to lift or drop an item.
6. Press `arrow up` or `arrow left` to move the lifted item to the previous position.
7. Press `arrow down` or `arrow right` to move the lifted item to the next position.
8. Press `escape` to cancel the lift and return the item to its initial position.

## Components

The following is a list of the available components inside the package:

| Component        | Description                                                                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<SortableList>` | The primary container. Provides the main structure, drag-and-drop interactions and emits the available events.                                                            |
| `<SortableItem>` | An individual item within `<SortableList>`. Holds the data and content for each list item, as well as the `<Handle>` and `<Remove>` components when needed.               |
| `<Handle>`       | An element that limits the draggable area of a list item to itself. Including it inside a `<SortableItem>` will directly activate the handle functionality for that item. |
| `<Remove>`       | A `<button>` element that (when pressed) removes an item. Including it inside a `<SortableItem>` will directly allow it to dispatch the `remove` event for that item.     |
| `<IconHandle>`   | A **grip** icon. Since it doesn’t include any kind of interactivity, you can use your own icon instead.                                                                   |
| `<IconRemove>`   | An **x mark** icon. Since it doesn’t include any kind of interactivity, you can use your own icon instead.                                                                |

You can create your own `<Remove>` component if you require it that way. Do so by importing the `dispatch()` function from this package (or create your own dispatcher), and make sure to use the event name and detail included in the example:

```ts
<script lang="ts">
	import { dispatch } from '@rodrigodagostino/svelte-sortable-list';
	import { Button } from '$lib/components';

	function handleRemove(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (target) dispatch(target, 'removestart', { item: target.closest('.ssl-item') });
	};
</script>

<Button on:click={handleRemove}>Remove</Button>
```

### `<SortableList>` props

| Prop                 | Type    | Default      | Possible values                | Description                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------- | ------- | ------------ | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gap`                | Number  | `12`         | Number equal to or above `0`.  | Separation between items (in pixels).                                                                                                                                                                                                                                                                                                                                                                                      |
| `direction`          | String  | `'vertical'` | `'vertical'` or `'horizontal'` | Orientation in which items will be arranged.                                                                                                                                                                                                                                                                                                                                                                               |
| `swapThreshold`      | Number  | `1`          | Number between `0.5` and `2`.  | Portions of the dragged item and the target item that need to overlap for the items to switch positions. This value will be honored as long as there is only one item colliding with the dragged item. Otherwise, the item with the most covered area by the dragged item will be marked as the target. For example, `0.5` stands for half of the dragged and target item, `1` for the full size, `2` for double the size. |
| `transitionDuration` | Number  | `320`        | Number equal to or above `0`.  | Time the transitions for the ghost (dropping) and items (translation, addition, removal) take to complete (in milliseconds). Assign it a value of `0` to remove animations.                                                                                                                                                                                                                                                |
| `hasDropMarker`      | Boolean | `false`      | `true` or `false`              | If `true`, displays a position marker representing where the dragged item will be positioned when drag-and-dropping.                                                                                                                                                                                                                                                                                                       |
| `hasLockedAxis`      | Boolean | `false`      | `true` or `false`              | If `true`, prevents the dragged item from moving away from the main axis.                                                                                                                                                                                                                                                                                                                                                  |
| `hasBoundaries`      | Boolean | `false`      | `true` or `false`              | If `true`, items will only be draggable inside the list limits.                                                                                                                                                                                                                                                                                                                                                            |
| `hasRemoveOnDropOut` | Boolean | `false`      | `true` or `false`              | if `true`, items will be removed when dragged and dropped outside of the list boundaries. This needs to be coupled with the `on:remove` event handler for it to complete the removal process.                                                                                                                                                                                                                              |
| `isLocked`           | Boolean | `false`      | `true` or `false`              | If `true`, will allow every item in the list to be focused, but will prevent them from being dragged (both through pointer and keyboard). Interactive elements inside will operate normally.                                                                                                                                                                                                                               |
| `isDisabled`         | Boolean | `false`      | `true` or `false`              | If `true`, will allow every item in the list to be focused, but will prevent them from being dragged (both through pointer and keyboard) and change its appearance to be dimmed. Interactive elements inside will be disabled.                                                                                                                                                                                             |

### `<SortableList>` events

| Name        | Type                             | Trigger                    | Returns                                                                                                                                                                                                                                                             |
| ----------- | -------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `on:sort`   | `CustomEvent<SortEventDetail>`   | An item switches position. | <pre>event: {<br>&nbsp;&nbsp;detail: {<br>&nbsp;&nbsp;&nbsp;&nbsp;prevItemId: string,<br>&nbsp;&nbsp;&nbsp;&nbsp;prevItemIndex: number,<br>&nbsp;&nbsp;&nbsp;&nbsp;nextItemId: string,<br>&nbsp;&nbsp;&nbsp;&nbsp;nextItemIndex: number<br>&nbsp;&nbsp;}<br>}</pre> |
| `on:remove` | `CustomEvent<RemoveEventDetail>` | An item is removed.        | <pre>event: {<br>&nbsp;&nbsp;detail: {<br>&nbsp;&nbsp;&nbsp;&nbsp;itemId: string,<br>&nbsp;&nbsp;&nbsp;&nbsp;itemIndex: number<br>&nbsp;&nbsp;}<br>}</pre>                                                                                                          |

### `<SortableItem>` props

| Prop         | Type    | Default     | Possible values   | Description                                                                                 |
| ------------ | ------- | ----------- | ----------------- | ------------------------------------------------------------------------------------------- |
| `id`         | String  | `undefined` | Unique string.    | Unique identifier for each item.                                                            |
| `index`      | Number  | `undefined` | Unique number.    | Position of the item in the list.                                                           |
| `isLocked`   | Boolean | `false`     | `true` or `false` | If `true`, will prevent the item from being dragged.                                        |
| `isDisabled` | Boolean | `false`     | `true` or `false` | If `true`, will prevent the item from being dragged and change its appearance to be dimmed. |

## Utilities

| Function       | Description                                                                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `sortItems()`  | Provides an easy mechanism to reorder items (should be used in combination with the [`on:sort` event](#sortablelist-events)).                   |
| `removeItem()` | Provides an easy mechanism to remove an item from your list (should be used in combination with the [`on:remove` event](#sortablelist-events)). |

Example:

```ts
<script lang="ts">
	import {
		SortableList,
		SortableItem,
		Remove,
		IconRemove,
		removeItem,
		sortItems,
	} from '$lib/index.js';
	import type { SortableItemData } from '$lib/types/index.js';

	let items: SortableItemData[] = [
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

	function handleSort(event: CustomEvent<SortEventDetail>) {
		const { prevItemIndex, nextItemIndex } = event.detail;
		items = sortItems(items, prevItemIndex, nextItemIndex);
	}

	function handleRemove(event: CustomEvent<RemoveEventDetail>) {
		const { itemIndex } = event.detail;
		items = removeItem(items, itemIndex);
	}
</script>

<SortableList on:sort={handleSort} on:remove={handleRemove}>
	{#each items as item, index (item.id)}
		<SortableItem id={item.id} {index}>
			<div class="ssl-item__content">
				{item.text}
			</div>
			<Remove>
				<IconRemove />
			</Remove>
		</SortableItem>
	{/each}
</SortableList>
```

## Types

| Type               | Description                                  |
| ------------------ | -------------------------------------------- |
| `SortableItemData` | Provides definitions for your list of items. |

Example:

```ts
<script lang="ts">
	import type { SortableItemData } from '$lib/types/index.js';

	let items: SortableItemData[] = [
	{
		id: 'list-item-1',
		text: 'List item 1',
		isDisabled: false,
	},
	{
		id: 'list-item-2',
		text: 'List item 2',
		isDisabled: true,
	},
	{
		id: 'list-item-3',
		text: 'List item 3',
		isDisabled: true,
	},
	{
		id: 'list-item-4',
		text: 'List item 4',
		isDisabled: false,
	},
	{
		id: 'list-item-5',
		text: 'List item 5',
		isDisabled: false,
	},
];
</script>
```

## Styles

If you want to make use of the styles present in the demo pages, import them in your project like so:

```ts
import 'svelte-sortable-list/styles.css';
```

### Selectors

To customize the appearance of the list items and not cause any conflicts or interferences with the core styles and transitions, the usage of the `.ssl-item` selector must be avoided, pointing instead to `.ssl-item__inner`, which is the direct child of the aforementioned selector.

This is a list of the selectors you can use to style the list and the list items to your heart’s desire:

| Selector                           | Points to                                                                                               |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `.ssl-list`                        | The `<SortableList>` main container.                                                                    |
| `.ssl-list.has-drop-marker`        | The `<SortableList>` main container while `hasDropMarker` is enabled.                                   |
| `.ssl-list.has-remove-on-drop-out` | The `<SortableList>` main container while `hasRemoveOnDropOut` is enabled.                              |
| `.ssl-list.is-locked`              | The `<SortableList>` that is locked.                                                                    |
| `.ssl-list.is-disabled`            | The `<SortableList>` that is disabled.                                                                  |
| `.ssl-item`                        | Each `<SortableItem>` main container.                                                                   |
| `.ssl-item.is-pointer-dragging`    | The `<SortableItem>` that is being dragged by a pointing device.                                        |
| `.ssl-item.is-pointer-dropping`    | The `<SortableItem>` that is being dropped by a pointing device.                                        |
| `.ssl-item.is-keyboard-dragging`   | The `<SortableItem>` that is being dragged by the keyboard.                                             |
| `.ssl-item.is-keyboard-dropping`   | The `<SortableItem>` that is being dropped by the keyboard.                                             |
| `.ssl-item.is-locked`              | Each `<SortableItem>` that is locked.                                                                   |
| `.ssl-item.is-disabled`            | Each `<SortableItem>` that is disabled.                                                                 |
| `.ssl-item[aria-disabled="true"]`  | Each `<SortableItem>` that is disabled.                                                                 |
| `.ssl-item.is-removing`            | The `<SortableItem>` that is being removed by dropping it outside the list limits by a pointing device. |
| `.ssl-item__inner`                 | The content wrapper element inside each `<SortableItem>`.                                               |
| `.ssl-ghost`                       | The shadow element displayed under the pointer when dragging.                                           |
| `.ssl-ghost.is-dragging`           | The shadow element while it’s being dragged by a pointing device.                                       |
| `.ssl-ghost.is-dropping`           | The shadow element while it’s being dropped by a pointing device.                                       |
| `.ssl-ghost.is-between-bounds`     | The shadow element while it’s inside the list limits.                                                   |
| `.ssl-ghost.is-out-of-bounds`      | The shadow element while it’s outside the list limits.                                                  |
| `.ssl-handle`                      | The `<Handle>` main container.                                                                          |
| `.ssl-remove`                      | The `<Remove>` main container.                                                                          |

### Custom properties

| Custom property         | Description                                                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `--transition-duration` | Time the transitions for the ghost (dropping) and items (translation, addition, removal) take to complete (in milliseconds). |

## Motivation

While working on a SvelteKit project, I ran into the need of adding drag-and-drop capabilities to a couple of items lists, for which I decided to make use of [SortableJS](https://sortablejs.github.io/Sortable), which is certainly a popular option. I implemented it through a Svelte Action and it provided just what I needed, or so it seemed. After a while I realized I was not only missing touch screen support (since it was built with the HTML Drag and Drop API), but also accessibility was nowhere to be seen, and seems there are [no plans to work on it](https://github.com/SortableJS/Sortable/issues/1176).

I was not able to find any other suitable option, so this problem felt like a good opportunity to build my own package. And so while doing some research to try and understand the implications of such feature, I ran into a very [interesting article](https://baseweb.design/blog/drag-and-drop-list) and a very [interesting talk](https://youtu.be/y_XkQ2qMTSA) by Vojtech Miksu which really guided me through the different paths available, their advantages, pain points and limitations to create a drag-and-drop system, putting particular focus on accessibility and touch screen support.

Even though [React Movable](https://github.com/tajo/react-movable) was built for React, it served as my main inspiration when building this package. So thank you again, Vojtech :)
