# Svelte Sortable List

A comprehensive package for creating accessible, sortable lists in Svelte applications.

[![NPM Version](https://img.shields.io/npm/v/@rodrigodagostino/svelte-sortable-list)](https://www.npmjs.com/package/@rodrigodagostino/svelte-sortable-list) [![Latest release](https://img.shields.io/github/release/rodrigodagostino/svelte-sortable-list.svg)](https://github.com/rodrigodagostino/svelte-sortable-list/releases/latest) [![License](https://img.shields.io/github/license/rodrigodagostino/svelte-sortable-list.svg)](LICENSE.md)

![Preview](https://raw.githubusercontent.com/rodrigodagostino/svelte-sortable-list/master/static/preview.gif?raw=true)

**Live demos:**

- [Netlify](https://svelte-sortable-list.netlify.app)
- [Vercel](https://svelte-sortable-list.vercel.app)

## Table of contents

- [Features](#features)
- [Get started](#get-started)
  - [Install it](#install-it)
  - [Import it](#import-it)
  - [Use it](#use-it)
- [Accessibility](#accessibility)
  - [Keyboard navigation](#keyboard-navigation)
  - [Screen reader announcements customization](#screen-reader-announcements-customization)
- [Components](#components)
  - [`<SortableList.Root>` props](#sortablelistroot-props)
  - [`<SortableList.Root>` events](#sortablelistroot-events)
  - [`<SortableList.Item>` props](#sortablelistitem-props)
- [Utilities](#utilities)
- [Transitions](#transitions)
- [Types](#types)
- [Styles](#styles)
  - [Selectors](#selectors)
  - [Custom properties](#custom-properties)
- [Motivation](#motivation)

## Features

- **Multi-input support**: Mouse, keyboard, and touch interactions.
- **Accessibility-first**: Screen reader support with customizable announcements.
- **Flexible layouts**: Vertical and horizontal orientations with varying item heights.
- **Enhanced UX**: Drag handles, auto-scrolling, and customizable transitions.
- **Advanced options**: Axis locking, boundary constraints, and remove-on-drop-outside functionality.
- **Integration**: Support for nested interactive elements and `<dialog>` components.
- **Internationalization**: RTL language support.
- **Developer-friendly**: TypeScript definitions, unopinionated styling, and zero dependencies.

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

```svelte
<script lang="ts">
	import { SortableList } from '@rodrigodagostino/svelte-sortable-list';
</script>
```

### Use it

```svelte
<script lang="ts">
	import { SortableList, sortItems } from '@rodrigodagostino/svelte-sortable-list';

	let items: SortableList.ItemData[] = [
		{
			id: 'list-item-1',
			text: 'List Item 1',
		},
		{
			id: 'list-item-2',
			text: 'List Item 2',
		},
		{
			id: 'list-item-3',
			text: 'List Item 3',
		},
		{
			id: 'list-item-4',
			text: 'List Item 4',
		},
		{
			id: 'list-item-5',
			text: 'List Item 5',
		},
	];

	function handleDragEnd(event: SortableList.RootEvents['dragend']) {
		const { draggedItemIndex, targetItemIndex, isCanceled } = event.detail;
		if (!isCanceled && typeof targetItemIndex === 'number' && draggedItemIndex !== targetItemIndex)
			items = sortItems(items, draggedItemIndex, targetItemIndex);
	}
</script>

<SortableList.Root on:dragend={handleDragEnd}>
	{#each items as item, index (item.id)}
		<SortableList.Item {...item} {index}>
			<div class="ssl-item-content">
				<span class="ssl-item-content__text">{item.text}</span>
			</div>
		</SortableList.Item>
	{/each}
</SortableList.Root>
```

## Accessibility

This package prioritizes accessibility with comprehensive keyboard navigation and screen reader support.

### Keyboard navigation

**Navigation and interaction steps:**

1. Press `Tab` to focus the list.
2. Use `Arrow Up`, `Arrow Left`, `Arrow Down`, `Arrow Right`, `Home`, or `End` to focus the first item.
3. Navigate between items:
   - `Arrow Up` or `Arrow Left`: Move to previous item.
   - `Arrow Down` or `Arrow Right`: Move to next item.
   - `Home`: Jump to first item.
   - `End`: Jump to last item.
4. Press `Space` to start dragging the focused item.
5. While dragging:
   - Use arrow keys to move the item to different positions.
   - `Home`: Move to first position.
   - `End`: Move to last position.
   - `Space`: Drop the item at current position.
   - `Escape`: Cancel drag and return item to original position.

### Screen reader announcements customization

Customize screen reader announcements using two main approaches:

**1. Navigation instructions** (`aria-description` attribute):
Default: `"Press the arrow keys to move through the list items. Press Space to start dragging an item. When dragging, use the arrow keys to move the item around. Press Space again to drop the item, or Escape to cancel."`

**2. Drag-and-drop announcements** (`announcements` prop):
Customize announcements for lift, drag, drop, and cancel operations.

**Additional customization options:**

- `aria-label`: Provide a name for the list
- `aria-labelledby`: Reference an element that names the list

**Example: Spanish translations**

The following example demonstrates how to translate announcements to Spanish (adapted from the “With custom announcements” demo):

```svelte
<script lang="ts">
	...

	const announcements: SortableList.RootProps['announcements'] = {
		lifted: (_, draggedItemIndex) => {
			return `Ha levantado un item en la posición ${draggedItemIndex + 1}.`;
		},
		dragged: (_, draggedItemIndex, __, targetItemIndex) => {
			const startPosition = draggedItemIndex + 1;
			const endPosition = targetItemIndex + 1;
			const result =
				startPosition !== endPosition
					? `desde la posición ${startPosition} a la posición ${endPosition}`
					: `de vuelta a su posición inicial de ${startPosition}`;
			return `Ha movido el item ${result}.`;
		},
		dropped: (_, draggedItemIndex, __, targetItemIndex) => {
			const startPosition = draggedItemIndex + 1;
			const endPosition = typeof targetItemIndex === 'number' ? targetItemIndex + 1 : null;
			const result =
				endPosition === null
					? `Se ha mantenido en su posición inicial de ${startPosition}`
					: startPosition !== endPosition
						? `Se ha movido desde la posición ${startPosition} a la posición ${endPosition}`
						: `Ha vuelto a su posición inicial de ${startPosition}`;
			return `Ha soltado el item. ${result}.`;
		},
		canceled: (_, draggedItemIndex) => {
			return `Ha cancelado el arrastre. El item ha vuelto a su posición inicial de ${draggedItemIndex + 1}.`;
		},
	};
</script>

<SortableList.Root
	...
	aria-description="Presione las flechas para desplazarte por los elementos de la lista. Presione Espacio para empezar a arrastrar un elemento. Al arrastrar, use las flechas para moverlo. Presione Espacio de nuevo para soltar el elemento o Escape para cancelar."
	{announcements}
>
	...
</SortableList.Root>
```

## Components

The package provides four main components for building sortable lists:

| Component                   | Description                                                                                                                                                                 |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<SortableList.Root>`       | The primary container that provides the main structure, drag-and-drop interactions, and emits available events.                                                             |
| `<SortableList.Item>`       | An individual list item that holds data and content, and can contain `<SortableList.ItemHandle>` and `<SortableList.ItemRemove>` components.                                |
| `<SortableList.ItemHandle>` | An element that restricts the draggable area of a list item to itself. Including this inside a `<SortableList.Item>` directly activates handle functionality for that item. |
| `<SortableList.ItemRemove>` | A `<button>` element that removes an item when pressed. Including this inside a `<SortableList.Item>` enables it to dispatch the `remove` event for that item.              |

> [!WARNING]
> While you can use a standard `<button>` element instead of `<SortableList.ItemRemove>` to trigger item removal, the provided component offers additional benefits. It automatically focuses the next item in the list when a user removes an item via keyboard, preventing focus from falling back to the `<body>` element.

### `<SortableList.Root>` props

| Prop                 | Type                    | Default                                                     | Possible values                                       | Description                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------- | ----------------------- | ----------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `gap`                | `number \| undefined`   | `12`                                                        | Number ≥ `0`                                          | Separation between items in pixels.                                                                                                                                                                                                                                                                                                                                                                                            |
| `direction`          | `string \| undefined`   | `'vertical'`                                                | `'vertical'` \| `'horizontal'`                        | Items orientation.                                                                                                                                                                                                                                                                                                                                                                                                             |
| `transition`         | `object \| undefined`   | `{ duration: 240, easing: 'cubic-bezier(0.2, 1, 0.1, 1)' }` | `duration`: number ≥ `0`<br>`easing`: easing function | `duration`: Time in milliseconds for ghost (dropping) and item (translation, addition, removal) transitions. Set to `0` to disable animations.<br>`easing`: Mathematical function describing transition rate changes. Accepts any value valid for the CSS [`transition-timing-function`](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-timing-function) property. Currently only affects ghost drop transitions. |
| `hasWrapping`        | `boolean \| undefined`  | `false`                                                     | `true` \| `false`                                     | When `true`, allows items to wrap onto multiple lines.                                                                                                                                                                                                                                                                                                                                                                         |
| `hasLockedAxis`      | `boolean \| undefined`  | `false`                                                     | `true` \| `false`                                     | When `true`, constrains dragged items to the main axis only.                                                                                                                                                                                                                                                                                                                                                                   |
| `hasBoundaries`      | `boolean \| undefined`  | `false`                                                     | `true` \| `false`                                     | When `true`, restricts item dragging to within list boundaries.                                                                                                                                                                                                                                                                                                                                                                |
| `canClearOnDragOut`  | `boolean \| undefined`  | `false`                                                     | `true` \| `false`                                     | When `true`, clears the target item when a dragged item (via pointing device) doesn't collide with any list items. This causes the dragged item to return to its initial position when dropped, rather than taking the position of the last item it collided with.                                                                                                                                                             |
| `canRemoveOnDropOut` | `boolean \| undefined`  | `false`                                                     | `true` \| `false`                                     | When `true`, removes items that are dragged and dropped outside list boundaries. Must be used with the `on:remove` event handler to complete the removal process.                                                                                                                                                                                                                                                              |
| `isLocked`           | `boolean \| undefined`  | `false`                                                     | `true` \| `false`                                     | When `true`, allows list items to be focused but prevents dragging (both pointer and keyboard). Interactive elements within items continue to function normally.                                                                                                                                                                                                                                                               |
| `isDisabled`         | `boolean \| undefined`  | `false`                                                     | `true` \| `false`                                     | When `true`, allows list items to be focused but prevents dragging (both pointer and keyboard) and applies dimmed styling. Interactive elements within items are disabled.                                                                                                                                                                                                                                                     |
| `announcements`      | `function \| undefined` | `undefined`                                                 | Object                                                | Custom announcements for screen readers during drag-and-drop operations.                                                                                                                                                                                                                                                                                                                                                       |

> [!WARNING]
> **Wrapping limitations**: Currently, wrapping support is limited to horizontal lists with items of identical width and height. Other variations may produce unexpected results.

### `<SortableList.Root>` events

> [!NOTE]
> Events fire in the order listed below.

| Event       | Type                                   | Trigger                                                                                    | Returns                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----------- | -------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mounted`   | `SortableList.RootEvents['mounted']`   | Component is mounted                                                                       | <pre>event: {<br>&nbsp;&nbsp;detail: null<br>}</pre>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `dragstart` | `SortableList.RootEvents['dragstart']` | Item begins being dragged by pointer device or keyboard                                    | <pre>event: {<br>&nbsp;&nbsp;detail: {<br>&nbsp;&nbsp;&nbsp;&nbsp;deviceType: 'pointer' \| 'keyboard',<br>&nbsp;&nbsp;&nbsp;&nbsp;draggedItem: HTMLLIElement,<br>&nbsp;&nbsp;&nbsp;&nbsp;draggedItemId: string,<br>&nbsp;&nbsp;&nbsp;&nbsp;draggedItemIndex: number,<br>&nbsp;&nbsp;&nbsp;&nbsp;isBetweenBounds: boolean,<br>&nbsp;&nbsp;&nbsp;&nbsp;canRemoveOnDropOut: boolean<br>&nbsp;&nbsp;}<br>}</pre>                                                                                                                                                                                                                                    |
| `drag`      | `SortableList.RootEvents['drag']`      | Dragged item is moved by pointer device or keyboard (fires every few hundred milliseconds) | <pre>event: {<br>&nbsp;&nbsp;detail: {<br>&nbsp;&nbsp;&nbsp;&nbsp;deviceType: 'pointer' \| 'keyboard',<br>&nbsp;&nbsp;&nbsp;&nbsp;draggedItem: HTMLLIElement,<br>&nbsp;&nbsp;&nbsp;&nbsp;draggedItemId: string,<br>&nbsp;&nbsp;&nbsp;&nbsp;draggedItemIndex: number,<br>&nbsp;&nbsp;&nbsp;&nbsp;targetItem: HTMLLIElement \| null,<br>&nbsp;&nbsp;&nbsp;&nbsp;targetItemId: string \| null,<br>&nbsp;&nbsp;&nbsp;&nbsp;targetItemIndex: number \| null,<br>&nbsp;&nbsp;&nbsp;&nbsp;isBetweenBounds: boolean,<br>&nbsp;&nbsp;&nbsp;&nbsp;canRemoveOnDropOut: boolean<br>&nbsp;&nbsp;}<br>}</pre>                                                 |
| `drop`      | `SortableList.RootEvents['drop']`      | Dragged item is released by pointer device or keyboard                                     | <pre>event: {<br>&nbsp;&nbsp;detail: {<br>&nbsp;&nbsp;&nbsp;&nbsp;deviceType: 'pointer' \| 'keyboard',<br>&nbsp;&nbsp;&nbsp;&nbsp;draggedItem: HTMLLIElement,<br>&nbsp;&nbsp;&nbsp;&nbsp;draggedItemId: string,<br>&nbsp;&nbsp;&nbsp;&nbsp;draggedItemIndex: number,<br>&nbsp;&nbsp;&nbsp;&nbsp;targetItem: HTMLLIElement \| null,<br>&nbsp;&nbsp;&nbsp;&nbsp;targetItemId: string \| null,<br>&nbsp;&nbsp;&nbsp;&nbsp;targetItemIndex: number \| null,<br>&nbsp;&nbsp;&nbsp;&nbsp;isBetweenBounds: boolean,<br>&nbsp;&nbsp;&nbsp;&nbsp;canRemoveOnDropOut: boolean<br>&nbsp;&nbsp;}<br>}</pre>                                                 |
| `dragend`   | `SortableList.RootEvents['dragend']`   | Dragged item reaches its final destination after being released                            | <pre>event: {<br>&nbsp;&nbsp;detail: {<br>&nbsp;&nbsp;&nbsp;&nbsp;deviceType: 'pointer' \| 'keyboard',<br>&nbsp;&nbsp;&nbsp;&nbsp;draggedItem: HTMLLIElement,<br>&nbsp;&nbsp;&nbsp;&nbsp;draggedItemId: string,<br>&nbsp;&nbsp;&nbsp;&nbsp;draggedItemIndex: number,<br>&nbsp;&nbsp;&nbsp;&nbsp;targetItem: HTMLLIElement \| null,<br>&nbsp;&nbsp;&nbsp;&nbsp;targetItemId: string \| null,<br>&nbsp;&nbsp;&nbsp;&nbsp;targetItemIndex: number \| null,<br>&nbsp;&nbsp;&nbsp;&nbsp;isBetweenBounds: boolean,<br>&nbsp;&nbsp;&nbsp;&nbsp;canRemoveOnDropOut: boolean,<br>&nbsp;&nbsp;&nbsp;&nbsp;isCanceled: boolean<br>&nbsp;&nbsp;}<br>}</pre> |
| `destroyed` | `SortableList.RootEvents['destroyed']` | Component is destroyed                                                                     | <pre>event: {<br>&nbsp;&nbsp;detail: null<br>}</pre>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

### `<SortableList.Item>` props

| Prop            | Type                                                    | Default     | Possible values   | Description                                                                   |
| --------------- | ------------------------------------------------------- | ----------- | ----------------- | ----------------------------------------------------------------------------- |
| `id`            | `string`                                                | `undefined` | Unique string     | Unique identifier for each item.                                              |
| `index`         | `number`                                                | `undefined` | Unique number     | Position of the item in the list.                                             |
| `isLocked`      | `boolean \| undefined`                                  | `false`     | `true` \| `false` | When `true`, prevents the item from being dragged.                            |
| `isDisabled`    | `boolean \| undefined`                                  | `false`     | `true` \| `false` | When `true`, prevents the item from being dragged and applies dimmed styling. |
| `transitionIn`  | `(node: HTMLElement, params?: any) => TransitionConfig` | `scaleFly`  | Function          | Animation played when the item is added to the list.                          |
| `transitionOut` | `(node: HTMLElement, params?: any) => TransitionConfig` | `scaleFly`  | Function          | Animation played when the item is removed from the list.                      |

## Utilities

Utility functions to simplify common list operations:

| Function                     | Description                                                                                           |
| ---------------------------- | ----------------------------------------------------------------------------------------------------- |
| `sortItems(items, from, to)` | Reorders items in your list. Use in combination with the [`dragend` event](#sortablelistroot-events). |
| `removeItem(items, index)`   | Removes an item from your list. Use in combination with the [`drop` event](#sortablelistroot-events). |

**Example:**

```svelte
<script lang="ts">
	import { SortableList, removeItem, sortItems } from '@rodrigodagostino/svelte-sortable-list';
	...

	function handleDragEnd(event: SortableList.RootEvents['dragend']) {
		const { draggedItemIndex, targetItemIndex, isCanceled } = event.detail;
		if (!isCanceled && typeof targetItemIndex === 'number' && draggedItemIndex !== targetItemIndex)
			items = sortItems(items, draggedItemIndex, targetItemIndex);
	}

	function handleRemoveClick(event: MouseEvent) {
		const target = event.target as HTMLElement;
		const item = target.closest<HTMLLIElement>('.ssl-item');
		const itemIndex = Number(item?.dataset.itemIndex);
		if (!item || itemIndex < 0) return;
		items = removeItem(items, itemIndex);
	}
</script>

<SortableList.Root on:dragend={handleDragEnd}>...</SortableList.Root>
```

## Transitions

Built-in transition functions for smooth animations:

| Function   | Description                                   | Parameters                                                                                                                                                                                                                      |
| ---------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scaleFly` | Animates an element scaling and flying in/out | <pre>{<br>&nbsp;&nbsp;delay: number<br>&nbsp;&nbsp;duration: number<br>&nbsp;&nbsp;easing: function<br>&nbsp;&nbsp;axis: 'x' \| 'y'<br>&nbsp;&nbsp;x: number<br>&nbsp;&nbsp;y: number<br>&nbsp;&nbsp;opacity: number<br>}</pre> |

**Example:**

```svelte
<script lang="ts">
	import { SortableList, scaleFly } from '@rodrigodagostino/svelte-sortable-list';
	...
</script>

<SortableList.Root>
	{#each items as item, index (item.id)}
		<SortableList.Item
			{...item}
			{index}
			transitionIn={(node) => scaleFly(node, { duration: 320, x: -200 })}
			transitionOut={(node) => scaleFly(node, { duration: 320, x: 200 })}
		>
			...
		</SortableList.Item>
	{/each}
</SortableList.Root>
```

## Types

TypeScript definitions for type-safe development:

| Type                                   | Description                                                                                          |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `SortableList.RootProps`               | Type definitions for the [`<SortableList.Root>` component](#sortablelistroot-props).                 |
| `SortableList.ItemProps`               | Type definitions for the [`<SortableList.Item>` component](#sortablelistitem-props).                 |
| `SortableList.ItemData`                | Type definitions for your items list data.                                                           |
| `SortableList.RootEvents['mounted']`   | Type definitions for the [`<SortableList.Root>` `mounted` custom event](#sortablelistroot-events).   |
| `SortableList.RootEvents['dragstart']` | Type definitions for the [`<SortableList.Root>` `dragstart` custom event](#sortablelistroot-events). |
| `SortableList.RootEvents['drag']`      | Type definitions for the [`<SortableList.Root>` `drag` custom event](#sortablelistroot-events).      |
| `SortableList.RootEvents['drop']`      | Type definitions for the [`<SortableList.Root>` `drop` custom event](#sortablelistroot-events).      |
| `SortableList.RootEvents['dragend']`   | Type definitions for the [`<SortableList.Root>` `dragend` custom event](#sortablelistroot-events).   |
| `SortableList.RootEvents['destroyed']` | Type definitions for the [`<SortableList.Root>` `destroyed` custom event](#sortablelistroot-events). |

**Example:**

```svelte
<script lang="ts">
	import type { SortableList } from '@rodrigodagostino/svelte-sortable-list';
	...

	function handleDrop(event: SortableList.RootEvents['drop']) {
		const { draggedItemIndex, isBetweenBounds, canRemoveOnDropOut } = event.detail;
		if (!isBetweenBounds && canRemoveOnDropOut) items = removeItem(items, draggedItemIndex);
	}

	function handleDragEnd(event: SortableList.RootEvents['dragend']) {
		const { draggedItemIndex, targetItemIndex, isCanceled } = event.detail;
		if (!isCanceled && typeof targetItemIndex === 'number' && draggedItemIndex !== targetItemIndex)
			items = sortItems(items, draggedItemIndex, targetItemIndex);
	}
</script>
```

## Styles

### Importing default styles

To use the demo page styles in your project:

```svelte
<script>
	import '@rodrigodagostino/svelte-sortable-list/styles.css';
</script>
```

### Selectors

Use these CSS selectors to customize the appearance of list components:

> [!IMPORTANT]
> **Styling best practices**: To prevent conflicts with core styles and transitions, avoid applying transitions directly through the `.ssl-item` and `.ssl-ghost` selectors. Instead, create a content wrapper element (like `.ssl-item-content`) as a child of `.ssl-item`. The ghost element will automatically mirror the list item’s content and appearance.

| Selector                                         | Description                                                                                     |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `.ssl-root`                                      | List element inside `<SortableList.Root>`.                                                      |
| `.ssl-root[aria-orientation="vertical"]`         | Vertically oriented list.                                                                       |
| `.ssl-root[aria-orientation="horizontal"]`       | Horizontally oriented list.                                                                     |
| `.ssl-root[data-has-locked-axis="true"]`         | List with movement restricted to main axis.                                                     |
| `.ssl-root[data-has-boundaries="true"]`          | List with boundary-constrained movement.                                                        |
| `.ssl-root[data-can-clear-on-drag-out="true"]`   | List that clears target item when dragged outside boundaries.                                   |
| `.ssl-root[data-can-remove-on-drop-out="true"]`  | List that removes items when dropped outside boundaries.                                        |
| `.ssl-root[data-is-locked="true"]`               | List with dragging disabled for all items.                                                      |
| `.ssl-root[data-is-disabled="true"]`             | List with dragging and interactivity disabled for all items.                                    |
| `.ssl-root[aria-disabled="true"]`                | List with dragging and interactivity disabled for all items.                                    |
| `.ssl-item`                                      | Individual list item inside `<SortableList.Item>`.                                              |
| `.ssl-item[data-drag-state="idle"]`              | Item in default, inactive state.                                                                |
| `.ssl-item[data-drag-state="ptr-drag-start"]`    | Item starting pointer drag.                                                                     |
| `.ssl-item[data-drag-state="ptr-drag"]`          | Item during pointer drag.                                                                       |
| `.ssl-item[data-drag-state="ptr-drop"]`          | Item during pointer drop.                                                                       |
| `.ssl-item[data-drag-state="ptr-cancel"]`        | Item during canceled pointer drag.                                                              |
| `.ssl-item[data-drag-state="kbd-drag-start"]`    | Item starting keyboard drag.                                                                    |
| `.ssl-item[data-drag-state="kbd-drag"]`          | Item during keyboard drag.                                                                      |
| `.ssl-item[data-drag-state="kbd-drop"]`          | Item during keyboard drop.                                                                      |
| `.ssl-item[data-drag-state="kbd-cancel"]`        | Item during keyboard canceled drag.                                                             |
| `.ssl-item[data-is-ghost="true"]`                | Item displayed as placeholder inside shadow element during drag.                                |
| `.ssl-item[data-is-between-bounds="true"]`       | Item positioned within list boundaries.                                                         |
| `.ssl-item[data-is-locked="true"]`               | Item that cannot be dragged.                                                                    |
| `.ssl-item[data-is-disabled="true"]`             | Item that cannot be dragged or interacted with.                                                 |
| `.ssl-item[aria-disabled="true"]`                | Item that cannot be dragged or interacted with.                                                 |
| `.ssl-ghost`                                     | Shadow element displayed under pointer during drag operations.                                  |
| `.ssl-ghost[data-ghost-state="idle"]`            | Shadow element in default, inactive state.                                                      |
| `.ssl-ghost[data-ghost-state="ptr-drag-start"]`  | Shadow element starting pointer drag.                                                           |
| `.ssl-ghost[data-ghost-state="ptr-drag"]`        | Shadow element during pointer drag.                                                             |
| `.ssl-ghost[data-ghost-state="ptr-predrop"]`     | Shadow element repositioned for pointer drop.                                                   |
| `.ssl-ghost[data-ghost-state="ptr-drop"]`        | Shadow element during pointer drop.                                                             |
| `.ssl-ghost[data-ghost-state="ptr-remove"]`      | Shadow element during pointer drop outside list boundaries (with `canRemoveOnDropOut` enabled). |
| `.ssl-ghost[data-can-clear-on-drop-out="true"]`  | Shadow element with `canClearOnDropOut` enabled.                                                |
| `.ssl-ghost[data-can-remove-on-drop-out="true"]` | Shadow element with `canRemoveOnDropOut` enabled.                                               |
| `.ssl-item-handle`                               | Handle element inside `<SortableList.ItemHandle>`.                                              |
| `.ssl-item-remove`                               | Remove button element inside `<SortableList.ItemRemove>`.                                       |

> [!TIP]
> **Advanced selector combinations**: Combine the available selectors to target specific states.
> For example, to style the content of an item that is being dragged outside the list when `canRemoveOnDropOut` is enabled:
>
> ```css
> .ssl-ghost[data-can-remove-on-drop-out='true']
> 	.ssl-item[data-is-between-bounds='false']
> 	.ssl-item-content {
> 	background-color: var(--ssl-rose-300);
> 	border-color: var(--ssl-rose-400);
> }
> ```
>
> If you find that your particular case is not covered, please, feel free to submit a request :)

### Custom properties

CSS custom properties for global styling control:

| Custom property             | Description                                                                                                                                                                                                                                                           |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--ssl-gap`                 | Separation between items (in pixels).                                                                                                                                                                                                                                 |
| `--ssl-wrap`                | Whether list items are forced onto one line (`nowrap`) or can wrap onto multiple lines (`wrap`).                                                                                                                                                                      |
| `--ssl-transition-duration` | Time it takes for ghost (dropping) and item (translation, addition, removal) transitions to complete (in milliseconds).                                                                                                                                               |
| `--ssl-transition-easing`   | Mathematical function describing transition rate changes. Accepts any value valid for the CSS [`transition-timing-function`](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-timing-function) property. Currently only affects the ghost drop transition. |

## Motivation

While working on a SvelteKit project, I ran into the need of adding drag-and-drop capabilities to a couple of item lists, for which I decided to go with [SortableJS](https://sortablejs.github.io/Sortable) (a very popular option). I implemented it through a Svelte Action providing just what I needed, or so it seemed. After a while, I realized I was not only missing touch screen support (since it was built using the HTML Drag and Drop API), but also accessibility was nowhere to be seen, and seems there were [no plans to work on it](https://github.com/SortableJS/Sortable/issues/1176).

I was not able to find any other suitable option, so this problem felt like a good opportunity to build my own package. And so, while doing some research to try and understand the implications of such feature, I ran into a very [interesting article](https://baseweb.design/blog/drag-and-drop-list) and a very [interesting talk](https://youtu.be/y_XkQ2qMTSA) by Vojtech Miksu, which really guided me through the different paths available, their advantages, pain points and limitations to create a drag-and-drop system, putting particular focus on accessibility and touch screen support.

Even though [React Movable](https://github.com/tajo/react-movable) was built for React, it served as my main inspiration when building this package. So thank you again, Vojtech :)
