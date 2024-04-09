# Svelte Sortable List

A package to create accessible reorderable lists in Svelte.

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
- [Props](#props)
- [Slot props](#slot-props)
- [Events](#events)
- [Utilities](#utilities)
- [Slots](#slots)
- [Types](#types)
- [Styles](#styles)
  - [Selectors](#selectors)
- [Motivation](#motivation)

## Features

- Drag and drop.
- Handle.
- Drop marker.
- Varying heights.
- Vertical and horizontal disposition.
- Lockable axis.
- Remove item by dragging out.
- Touch screen support.
- Accessible (keyboard navigation and screen reader support).
- Customizable transition animations.
- Un-opinionated styling.
- Typescript definitions.
- No dependencies.

## Get started

### Install it

```bash
npm install @rodrigodagostino/svelte-sortable-list
```

```bash
yarn install @rodrigodagostino/svelte-sortable-list
```

```bash
pnpm install @rodrigodagostino/svelte-sortable-list
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
	import { SortableList, sortItems, type SortableListProps } from 'svelte-sortable-list';
	import 'svelte-sortable-list/styles.css';

	let items: SortableListProps['items'] = [
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

	function handleSort(event: CustomEvent) {
		const { prevIndex, nextIndex } = event.detail;
		items = sortItems(items, prevIndex, nextIndex);
	}
</script>

<SortableList {items} {...$props} let:item on:sort={handleSort}>
	{item.text}
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

## Props

| Prop                 | Type         | Default      | Possible values                                                                                                             | Description                                                                                                                                                                                                                                                                     |
| -------------------- | ------------ | ------------ | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `items`              | Object array | `undefined`  | Array of objects containing a mandatory `id`, an optional `isDisabled` and any other property to be used in the list items. | List of items data. Each item must contain an `id` property and can contain an `isDisabled` property to make use of the disabled items feature.                                                                                                                                 |
| `gap`                | Number       | `12`         | Number equal to or above `0`.                                                                                               | Separation between items (in pixels).                                                                                                                                                                                                                                           |
| `direction`          | String       | `'vertical'` | `'vertical'` or `'horizontal'`                                                                                              | Orientation in which items will be arranged.                                                                                                                                                                                                                                    |
| `swapThreshold`      | Number       | `1`          | Number above `0`.                                                                                                           | Percentage of the target that the dragged item must cover to trigger the items swap. This value will be honored as long as there is only one item colliding with the dragged item. Otherwise, the item with most covered area by the dragged item will be marked as the target. |
| `transitionDuration` | Number       | `320`        | Number equal to or above `0`.                                                                                               | Time the swap transition takes to complete (milliseconds). Assign a value of `0` the remove animations.                                                                                                                                                                         |
| `hasDropMarker`      | Boolean      | `false`      | `true` or `false`                                                                                                           | If `true`, displays a position marker representing where the dragged item will be positioned when drag-and-dropping.                                                                                                                                                            |
| `hasLockedAxis`      | Boolean      | `false`      | `true` or `false`                                                                                                           | If `true`, prevents the dragged item from moving away from the main axis.                                                                                                                                                                                                       |
| `hasBoundaries`      | Boolean      | `false`      | `true` or `false`                                                                                                           | If `true`, items will only be draggable inside the list limits.                                                                                                                                                                                                                 |
| `hasRemoveOnDragOut` | Boolean      | `false`      | `true` or `false`                                                                                                           | if `true`, items will be removed when dragged outside of the list boundaries. This needs to be accompanied by the `on:remove` event handler for it to work as expected.                                                                                                         |

## Slot props

Slot props will give you access to the individual item data.

| Prop    | Provides access to                      |
| ------- | --------------------------------------- |
| `item`  | Item data coming from the `items` prop. |
| `index` | Item index.                             |

Example:

```ts
<SortableList let:item let:index>
	{index} - {item.text}
</SortableList>
```

## Events

| Name        | Type          | Trigger                    | Returns                                                         |
| ----------- | ------------- | -------------------------- | --------------------------------------------------------------- |
| `on:sort`   | `CustomEvent` | An item switches position. | `event: { detail: { prevIndex: number, nextIndex: number } } }` |
| `on:remove` | `CustomEvent` | An item is removed.        | `event: { detail: { itemId: number } } }`                       |

## Utilities

| Function      | Description                                                                            |
| ------------- | -------------------------------------------------------------------------------------- |
| `sortItems()` | Provides an easy mechanism to reorder items (in combination with the `on:sort` event). |

Example:

```ts
<script lang="ts">
	import { sortItems } from 'svelte-sortable-list';

	function handleSort(event: CustomEvent) {
		const { prevIndex, nextIndex } = event.detail;
		items = sortItems(items, prevIndex, nextIndex);
	}
</script>

<SortableList {items} let:item on:sort={handleSort}>
	{item.text}
</SortableList>
```

## Slots

| Name     | Description                                                                                                                                                                             |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `handle` | Activates the **Handle** feature. To do so, assign an element or component to the `slot="handle"`.                                                                                      |
| `remove` | Activates the **Remove** feature. To do so, assign an element or component to the `slot="remove"`. Make sure to include the `on:remove` event handler to properly run the item removal. |

Example:

```ts
<SortableList {items} let:item on:remove={handleRemove}>
	<IconHandle slot="handle" />
	{item.text}
	<IconRemove slot="remove" />
</SortableList>
```

## Icons

If you want to avoid bringing in your own icons, you can use the ones provided in the package:

| Name     | Description         |
| -------- | ------------------- |
| `Handle` | Handle icon.        |
| `Remove` | Remove button icon. |

Example:

```ts
<script lang="ts">
	import { IconHandle, IconRemove } from 'svelte-sortable-list';
</script>

<SortableList {items} let:item on:remove={handleRemove}>
	<IconHandle slot="handle" />
	{item.text}
	<IconRemove slot="remove" />
</SortableList>
```

## Types

| Type                | Description                                 |
| ------------------- | ------------------------------------------- |
| `SortableListProps` | Provides definitions for your `items` prop. |

Example:

```ts
<script lang="ts">
	import { type SortableListProps } from 'svelte-sortable-list';

	let items: SortableListProps['items'] = [
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
</script>
```

## Styles

If you want to make use of the styles present in the demo pages, import them in your app like so:

```ts
import 'svelte-sortable-list/styles.css';
```

### Selectors

To customize the appearance of the list items and not cause any conflicts or interferences with the base styles and transitions, the usage of the `.sortable-item` selector must be avoided, pointing instead to `.sortable-item__inner`, which is the direct child of the aforementioned selector.

This is a list of the selectors you can use to style the list and the list items to your heart’s desire:

| Selector                               | Points to                                                           |
| -------------------------------------- | ------------------------------------------------------------------- |
| `.sortable-list`                       | The main container element.                                         |
| `.sortable-item`                       | Each of the list items.                                             |
| `.sortable-item.is-dragging`           | The item that is being dragged through a pointer.                   |
| `.sortable-item.is-dropping`           | The item that is being dropped through a pointer.                   |
| `.sortable-item.is-selecting`          | The item that is selected/lifted through keyboard.                  |
| `.sortable-item.is-deselecting`        | The item that is being dropped through keyboard.                    |
| `.sortable-item[aria-disabled="true"]` | Each item that is disabled.                                         |
| `.sortable-item__inner`                | The item content wrapper element.                                   |
| `.sortable-item__handle`               | The **Handle Slot** container element.                              |
| `.sortable-item__content`              | The **Default Slot** container element.                             |
| `.sortable-item__remove`               | The **Remove Slot** container element.                              |
| `.ghost`                               | The shadow element displayed under the pointer when dragging.       |
| `.ghost.is-dragging`                   | The shadow element while is being dragged.                          |
| `.ghost.is-dropping`                   | The shadow element while is being dropped.                          |
| `.ghost.is-between-bounds`             | The shadow element while is inside the list limits.                 |
| `.ghost.is-out-of-bounds`              | The shadow element while is outside the list limits.                |
| `.ghost.is-removing`                   | The shadow element while the dragged item is being removed.         |
| `.ghost.has-remove-on-drag-out`        | The shadow element while the remove on drag out feature is enabled. |

In order to simplify its styles assignment, the Ghost element also receives the `.sortable-item` class. This way, you can point to the `.sortable-item` class and set the appearance of the Sortable Items and the Ghost at the same time.

## Motivation

While working on a SvelteKit app, I ran into the need of adding drag-and-drop capabilities to a couple of items lists, for which I decided to make use of [SortableJS](https://sortablejs.github.io/Sortable), which is certainly a popular option. I implemented it through a Svelte Action and it provided just what I needed, or so it seemed. After a while I realized I was not only missing touch screen support (since it was built with the HTML Drag and Drop API), but also accessibility was nowhere to be seen, and seems there are [no plans to work on it](https://github.com/SortableJS/Sortable/issues/1176).

I was not able to find any other suitable option, so this problem felt like a good opportunity to build my own package. And so while doing some research to try and understand the implications of such feature, I ran into a very [interesting article](https://baseweb.design/blog/drag-and-drop-list) and a very [interesting talk](https://youtu.be/y_XkQ2qMTSA) by Vojtech Miksu which really guided me through the different paths available, their advantages, pain points and limitations to create a drag-and-drop system, putting particular focus on accessibility and touch screen support.

Even though [React Movable](https://github.com/tajo/react-movable) was built for React, it served as my main inspiration when building this package. So thank you again, Vojtech :)
