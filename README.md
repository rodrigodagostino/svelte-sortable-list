# Svelte Sortable List

A package to create accessible sortable lists in Svelte.

[![NPM Version](https://img.shields.io/npm/v/@rodrigodagostino/svelte-sortable-list)](https://www.npmjs.com/package/@rodrigodagostino/svelte-sortable-list) [![Latest release](https://img.shields.io/github/release/rodrigodagostino/svelte-sortable-list.svg)](https://github.com/rodrigodagostino/svelte-sortable-list/releases/latest) [![License](https://img.shields.io/github/license/rodrigodagostino/svelte-sortable-list.svg)](LICENSE.md)

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
- Auto scroll.
- Lockable axis.
- Remove on drop outside.
- Touch screen support.
- RTL support.
- `<dialog>` support.
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
	import {
		SortableItem,
		SortableList,
		type SortableListProps,
	} from '@rodrigodagostino/svelte-sortable-list';
</script>
```

### Use it

```ts
<script lang="ts">
	import {
		SortableItem,
		SortableList,
		type SortableItemData,
		sortItems
	} from '@rodrigodagostino/svelte-sortable-list';

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

	function handleDragEnd(event: CustomEvent<DragEndEventDetail>) {
		const { draggedItemIndex, targetItemIndex, isCanceled } = event.detail;
		if (!isCanceled && typeof targetItemIndex === 'number' && draggedItemIndex !== targetItemIndex)
			items = sortItems(items, draggedItemIndex, targetItemIndex);
	}
</script>

<SortableList {...$props} on:dragend={handleDragEnd}>
	{#each items as item, index (item.id)}
		<SortableItem {...item} {index}>
			<div class="ssl-item__content">
				{item.text}
			</div>
		</SortableItem>
	{/each}
</SortableList>
```

## Keyboard navigation

The following is a list of steps to navigate and operate the Sortable List:

1. Press `Tab` to focus the list.
2. Press `Arrow Up`, `Arrow Left`, `Arrow Down` or `Arrow Right` to focus the first item in the list.
3. Press `Arrow Up` or `Arrow Left` to move the focus to the previous item.
4. Press `Arrow Down` or `Arrow Right` to move the focus to the next item.
5. Press `Home` to move the focus to the first item.
6. Press `End` to move the focus to the last item.
7. Press `Space` to drag or drop an item.
8. Press `Arrow Up` or `Arrow Left` to move the dragged item to the previous position.
9. Press `Arrow Down` or `Arrow Right` to move the dragged item to the next position.
10. Press `Home` to move the dragged item to the first position.
11. Press `End` to move the dragged item to the last position.
12. Press `Escape` to cancel the drag and return the item to its initial position.

## Components

The following is a list of the available components inside the package:

| Component        | Description                                                                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<SortableList>` | The primary container. Provides the main structure, drag-and-drop interactions and emits the available events.                                                            |
| `<SortableItem>` | An individual item within `<SortableList>`. Holds the data and content for each list item, as well as the `<Handle>` and `<Remove>` components when needed.               |
| `<Handle>`       | An element that limits the draggable area of a list item to itself. Including it inside a `<SortableItem>` will directly activate the handle functionality for that item. |
| `<Remove>`       | A `<button>` element that (when pressed) removes an item. Including it inside a `<SortableItem>` will directly allow it to dispatch the `remove` event for that item.     |

It would be possible to avoid the `<Remove>` component and just go with a `<button>` element to trigger the removal of an item, but keep in mind that this component doesn’t just fire a click event, it will also focus the next item in the list if the user is using the keyboard to press the remove button. Otherwise, after the focused element is removed, the focus will fall back to the `<body>`.

### `<SortableList>` props

| Prop                 | Type                   | Default      | Possible values                | Description                                                                                                                                                                                                                                                                                              |
| -------------------- | ---------------------- | ------------ | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gap`                | `number \| undefined`  | `12`         | Number equal to or above `0`.  | Separation between items (in pixels).                                                                                                                                                                                                                                                                    |
| `direction`          | `string \| undefined`  | `'vertical'` | `'vertical'` or `'horizontal'` | Orientation in which items will be arranged.                                                                                                                                                                                                                                                             |
| `transitionDuration` | `number \| undefined`  | `240`        | Number equal to or above `0`.  | Time the transitions for the ghost (dropping) and items (translation, addition, removal) take to complete (in milliseconds). Assign it a value of `0` to remove animations.                                                                                                                              |
| `hasDropMarker`      | `boolean \| undefined` | `false`      | `true` or `false`              | If `true`, displays a position marker representing where the dragged item will be positioned when drag-and-dropping.                                                                                                                                                                                     |
| `hasLockedAxis`      | `boolean \| undefined` | `false`      | `true` or `false`              | If `true`, prevents the dragged item from moving away from the main axis.                                                                                                                                                                                                                                |
| `hasBoundaries`      | `boolean \| undefined` | `false`      | `true` or `false`              | If `true`, items will only be draggable inside the list limits.                                                                                                                                                                                                                                          |
| `canClearOnDragOut`  | `boolean \| undefined` | `false`      | `true` or `false`              | If `true`, the target item will be cleared when an item is dragged by a pointing device while not colliding with any of the items in the list.. This will cause the dragged item to return to its initial position when dropped. Otherwise, it will take the position of the last item it collided with. |
| `canRemoveOnDropOut` | `boolean \| undefined` | `false`      | `true` or `false`              | If `true`, items will be removed when dragged and dropped outside of the list boundaries. This needs to be coupled with the `on:remove` event handler for it to complete the removal process.                                                                                                            |
| `isLocked`           | `boolean \| undefined` | `false`      | `true` or `false`              | If `true`, will allow every item in the list to be focused, but will prevent them from being dragged (both through pointer and keyboard). Interactive elements inside will operate normally.                                                                                                             |
| `isDisabled`         | `boolean \| undefined` | `false`      | `true` or `false`              | If `true`, will allow every item in the list to be focused, but will prevent them from being dragged (both through pointer and keyboard) and change its appearance to be dimmed. Interactive elements inside will be disabled.                                                                           |

### `<SortableList>` events

> [!Note]
> Events are fired in the order they are displayed below.

| Event          | Type                                | Trigger                                                                                                  | Returns                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `on:mounted`   | `CustomEvent<MountedEventDetail>`   | The component is mounted.                                                                                | <pre>event: {<br>&nbsp;&nbsp;detail: null<br>}</pre>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `on:dragstart` | `CustomEvent<DragStartEventDetail>` | An item starts to be dragged by a pointer device or a keyboard.                                          | <pre>event: {<br>&nbsp;&nbsp;detail: {<br>&nbsp;&nbsp;&nbsp;&nbsp;deviceType: 'pointer' \| 'keyboard',<br>&nbsp;&nbsp;&nbsp;&nbsp;draggedItem: HTMLLIElement,<br>&nbsp;&nbsp;&nbsp;&nbsp;draggedItemId: string,<br>&nbsp;&nbsp;&nbsp;&nbsp;draggedItemIndex: number,<br>&nbsp;&nbsp;&nbsp;&nbsp;isBetweenBounds: boolean,<br>&nbsp;&nbsp;&nbsp;&nbsp;canRemoveOnDropOut: boolean<br>&nbsp;&nbsp;}<br>}</pre>                                                                                                                                                                                                                                    |
| `on:drag`      | `CustomEvent<DragEventDetail>`      | A dragged item is moved around by a pointer device or a keyboard (fires every few hundred milliseconds). | <pre>event: {<br>&nbsp;&nbsp;detail: {<br>&nbsp;&nbsp;&nbsp;&nbsp;deviceType: 'pointer' \| 'keyboard',<br>&nbsp;&nbsp;&nbsp;&nbsp;draggedItem: HTMLLIElement,<br>&nbsp;&nbsp;&nbsp;&nbsp;draggedItemId: string,<br>&nbsp;&nbsp;&nbsp;&nbsp;draggedItemIndex: number,<br>&nbsp;&nbsp;&nbsp;&nbsp;targetItem: HTMLLIElement \| null,<br>&nbsp;&nbsp;&nbsp;&nbsp;targetItemId: string \| null,<br>&nbsp;&nbsp;&nbsp;&nbsp;targetItemIndex: number \| null,<br>&nbsp;&nbsp;&nbsp;&nbsp;isBetweenBounds: boolean,<br>&nbsp;&nbsp;&nbsp;&nbsp;canRemoveOnDropOut: boolean<br>&nbsp;&nbsp;}<br>}</pre>                                                 |
| `on:drop`      | `CustomEvent<DropEventDetail>`      | A dragged item is released by a pointer device or a keyboard.                                            | <pre>event: {<br>&nbsp;&nbsp;detail: {<br>&nbsp;&nbsp;&nbsp;&nbsp;deviceType: 'pointer' \| 'keyboard',<br>&nbsp;&nbsp;&nbsp;&nbsp;draggedItem: HTMLLIElement,<br>&nbsp;&nbsp;&nbsp;&nbsp;draggedItemId: string,<br>&nbsp;&nbsp;&nbsp;&nbsp;draggedItemIndex: number,<br>&nbsp;&nbsp;&nbsp;&nbsp;targetItem: HTMLLIElement \| null,<br>&nbsp;&nbsp;&nbsp;&nbsp;targetItemId: string \| null,<br>&nbsp;&nbsp;&nbsp;&nbsp;targetItemIndex: number \| null,<br>&nbsp;&nbsp;&nbsp;&nbsp;isBetweenBounds: boolean,<br>&nbsp;&nbsp;&nbsp;&nbsp;canRemoveOnDropOut: boolean<br>&nbsp;&nbsp;}<br>}</pre>                                                 |
| `on:dragend`   | `CustomEvent<DragEndEventDetail>`   | A dragged item reaches its destination after being released.                                             | <pre>event: {<br>&nbsp;&nbsp;detail: {<br>&nbsp;&nbsp;&nbsp;&nbsp;deviceType: 'pointer' \| 'keyboard',<br>&nbsp;&nbsp;&nbsp;&nbsp;draggedItem: HTMLLIElement,<br>&nbsp;&nbsp;&nbsp;&nbsp;draggedItemId: string,<br>&nbsp;&nbsp;&nbsp;&nbsp;draggedItemIndex: number,<br>&nbsp;&nbsp;&nbsp;&nbsp;targetItem: HTMLLIElement \| null,<br>&nbsp;&nbsp;&nbsp;&nbsp;targetItemId: string \| null,<br>&nbsp;&nbsp;&nbsp;&nbsp;targetItemIndex: number \| null,<br>&nbsp;&nbsp;&nbsp;&nbsp;isBetweenBounds: boolean,<br>&nbsp;&nbsp;&nbsp;&nbsp;canRemoveOnDropOut: boolean,<br>&nbsp;&nbsp;&nbsp;&nbsp;isCanceled: boolean<br>&nbsp;&nbsp;}<br>}</pre> |

### `<SortableItem>` props

| Prop         | Type                   | Default     | Possible values   | Description                                                                                 |
| ------------ | ---------------------- | ----------- | ----------------- | ------------------------------------------------------------------------------------------- |
| `id`         | `string`               | `undefined` | Unique string.    | Unique identifier for each item.                                                            |
| `index`      | `number`               | `undefined` | Unique number.    | Position of the item in the list.                                                           |
| `isLocked`   | `boolean \| undefined` | `false`     | `true` or `false` | If `true`, will prevent the item from being dragged.                                        |
| `isDisabled` | `boolean \| undefined` | `false`     | `true` or `false` | If `true`, will prevent the item from being dragged and change its appearance to be dimmed. |

## Utilities

| Function       | Description                                                                                                                                   |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `sortItems()`  | Provides an easy mechanism to reorder items (it’s recommended to be used in combination with the [`on:dragend` event](#sortablelist-events)). |
| `removeItem()` | Provides an easy mechanism to remove an item from your list (should be used in combination with the [`on:drop` event](#sortablelist-events)). |

Example:

```ts
<script lang="ts">
	import {
		SortableList,
		SortableItem,
		Remove,
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

	function handleDragEnd(event: CustomEvent<DragEndEventDetail>) {
		const { draggedItemIndex, targetItemIndex, isCanceled } = event.detail;
		if (!isCanceled && typeof targetItemIndex === 'number' && draggedItemIndex !== targetItemIndex)
			items = sortItems(items, draggedItemIndex, targetItemIndex);
	}

	function handleRemoveClick(event: MouseEvent) {
		const target = event.target as HTMLElement;
		const item: HTMLLIElement | null = target.closest('.ssl-item');
		const itemIndex = Number(item?.dataset.itemIndex);
		if (!item || itemIndex < 0) return;
		items = removeItem(items, itemIndex);
	}
</script>

<SortableList {...$props} on:dragend={handleDragEnd}>
	{#each items as item, index (item.id)}
		<SortableItem {...item} {index}>
			<div class="ssl-item__content">
				{item.text}
			</div>
			<Remove on:click={handleRemoveClick} />
		</SortableItem>
	{/each}
</SortableList>
```

## Types

| Type                   | Description                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------ |
| `SortableItemData`     | Provides definitions for your list of items.                                                           |
| `MountedEventDetail`   | Provides definitions for the [`<SortableList>` `mounted` custom event detail](#sortablelist-events).   |
| `DragStartEventDetail` | Provides definitions for the [`<SortableList>` `dragstart` custom event detail](#sortablelist-events). |
| `DragEventDetail`      | Provides definitions for the [`<SortableList>` `drag` custom event detail](#sortablelist-events).      |
| `DropEventDetail`      | Provides definitions for the [`<SortableList>` `drop` custom event detail](#sortablelist-events).      |
| `DragEndEventDetail`   | Provides definitions for the [`<SortableList>` `dragend` custom event detail](#sortablelist-events).   |

Example:

```ts
<script lang="ts">
	import type { DragEndEventDetail, DropEventDetail, SortableItemData } from '$lib/types/index.js';

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

	function handleDrop(event: CustomEvent<DropEventDetail>) {
		const { draggedItemIndex, isBetweenBounds, canRemoveOnDropOut } = event.detail;
		if (!isBetweenBounds && canRemoveOnDropOut) items = removeItem(items, draggedItemIndex);
	}

	function handleDragEnd(event: CustomEvent<DragEndEventDetail>) {
		const { draggedItemIndex, targetItemIndex, isCanceled } = event.detail;
		if (!isCanceled && typeof targetItemIndex === 'number' && draggedItemIndex !== targetItemIndex)
			items = sortItems(items, draggedItemIndex, targetItemIndex);
	}
</script>
```

## Styles

If you want to make use of the styles present in the demo pages, import them in your project like so:

```ts
import 'svelte-sortable-list/styles.css';
```

### Selectors

> [!IMPORTANT]
> To customize the appearance of the list items and not cause any conflicts or interferences with the core styles and transitions, the usage of the `.ssl-item` selector must be avoided, pointing instead to `.ssl-item__inner`, which is the direct child of the aforementioned selector.

This is a list of the selectors you can use to style the list and the list items to your heart’s desire:

| Selector                                         | Points to                                                                                               |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `.ssl-list`                                      | The `<SortableList>` main container.                                                                    |
| `.ssl-list[aria-orientation="vertical"]`         | The `<SortableList>` main container when `direction` is set to `vertical`.                              |
| `.ssl-list[aria-orientation="horizontal"]`       | The `<SortableList>` main container when `direction` is set to `horizontal`.                            |
| `.ssl-list[data-has-drop-marker="true"]`         | The `<SortableList>` main container while `hasDropMarker` is enabled.                                   |
| `.ssl-list[data-can-remove-on-drop-out="true"]`  | The `<SortableList>` main container while `canRemoveOnDropOut` is enabled.                              |
| `.ssl-list[data-is-locked="true"]`               | The `<SortableList>` that is locked.                                                                    |
| `.ssl-list[data-is-disabled="true"]`             | The `<SortableList>` that is disabled.                                                                  |
| `.ssl-item`                                      | Each `<SortableItem>` main container.                                                                   |
| `.ssl-item[data-is-pointer-dragging="true"]`     | The `<SortableItem>` that is being dragged by a pointing device.                                        |
| `.ssl-item[data-is-pointer-dropping="true"]`     | The `<SortableItem>` that is being dropped by a pointing device.                                        |
| `.ssl-item[data-is-keyboard-dragging="true"]`    | The `<SortableItem>` that is being dragged by the keyboard.                                             |
| `.ssl-item[data-is-keyboard-dropping="true"]`    | The `<SortableItem>` that is being dropped by the keyboard.                                             |
| `.ssl-item[data-is-locked="true"]`               | Each `<SortableItem>` that is locked.                                                                   |
| `.ssl-item[aria-disabled="true"]`                | Each `<SortableItem>` that is disabled.                                                                 |
| `.ssl-item[data-is-removing="true"]`             | The `<SortableItem>` that is being removed by dropping it outside the list limits by a pointing device. |
| `.ssl-item__inner`                               | The content wrapper element inside each `<SortableItem>`.                                               |
| `.ssl-ghost`                                     | The shadow element displayed under the pointer when dragging.                                           |
| `.ssl-ghost[data-is-pointer-dragging="true"]`    | The shadow element while it’s being dragged by a pointing device.                                       |
| `.ssl-ghost[data-is-pointer-dropping="true"]`    | The shadow element while it’s being dropped by a pointing device.                                       |
| `.ssl-ghost[data-is-between-bounds="true"]`      | The shadow element while it’s inside the list limits.                                                   |
| `.ssl-ghost[data-is-removing="true"]`            | The shadow element while a `<SortableItem>` is being removed.                                           |
| `.ssl-ghost[data-can-remove-on-drop-out="true"]` | The shadow element while `canRemoveOnDropOut` is enabled.                                               |
| `.ssl-handle`                                    | The `<Handle>` main container.                                                                          |
| `.ssl-remove`                                    | The `<Remove>` main container.                                                                          |

> [!TIP]
> Combining the available selectors appropriately should be enough to style the list and the list items to your heart’s content.
> For example, the following would target the direct child of the `<Ghost>` component when `canRemoveOnDropOut` is enabled and is being dragged outside of the list limits:
>
> ```css
> .ssl-ghost[data-can-remove-on-drop-out="true"][data-is-between-bounds="false"] .ssl-ghost__inner {
>   ...
> }
> ```
>
> If you find that your particular case is not covered, please, feel free to submit a request :)

### Custom properties

| Custom property         | Description                                                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `--gap`                 | Separation between items (in pixels).                                                                                        |
| `--transition-duration` | Time the transitions for the ghost (dropping) and items (translation, addition, removal) take to complete (in milliseconds). |

## Motivation

While working on a SvelteKit project, I ran into the need of adding drag-and-drop capabilities to a couple of items lists, for which I decided to make use of [SortableJS](https://sortablejs.github.io/Sortable), which is certainly a popular option. I implemented it through a Svelte Action and it provided just what I needed, or so it seemed. After a while I realized I was not only missing touch screen support (since it was built with the HTML Drag and Drop API), but also accessibility was nowhere to be seen, and seems there are [no plans to work on it](https://github.com/SortableJS/Sortable/issues/1176).

I was not able to find any other suitable option, so this problem felt like a good opportunity to build my own package. And so while doing some research to try and understand the implications of such feature, I ran into a very [interesting article](https://baseweb.design/blog/drag-and-drop-list) and a very [interesting talk](https://youtu.be/y_XkQ2qMTSA) by Vojtech Miksu which really guided me through the different paths available, their advantages, pain points and limitations to create a drag-and-drop system, putting particular focus on accessibility and touch screen support.

Even though [React Movable](https://github.com/tajo/react-movable) was built for React, it served as my main inspiration when building this package. So thank you again, Vojtech :)
