# Svelte Sortable List

A package to create accessible sortable lists in Svelte.

[![NPM Version](https://img.shields.io/npm/v/@rodrigodagostino/svelte-sortable-list)](https://www.npmjs.com/package/@rodrigodagostino/svelte-sortable-list) [![Latest release](https://img.shields.io/github/release/rodrigodagostino/svelte-sortable-list.svg)](https://github.com/rodrigodagostino/svelte-sortable-list/releases/latest) [![License](https://img.shields.io/github/license/rodrigodagostino/svelte-sortable-list.svg)](LICENSE.md)

![Preview](https://raw.githubusercontent.com/rodrigodagostino/svelte-sortable-list/master/static/preview.gif?raw=true)

Live demos:

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

- Mouse, keyboard and touch support.
- Screen reader support (customizable).
- Vertical and horizontal directions.
- Varying heights.
- Drag handle.
- Wrapping.
- Auto scrolling.
- Customizable transitions.
- Lockable axis.
- Remove on drop outside.
- Nested interactive elements support.
- `<dialog>` support.
- RTL support.
- Un-opinionated styling.
- Custom classes support.
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

The following is a list of the accessibility features provided by the package:

### Keyboard navigation

These are the steps to navigate and operate the list:

1. Press `Tab` to focus the list.
2. Press `Arrow Up`, `Arrow Left`, `Arrow Down`, `Arrow Right`, `Home` or `End` to focus the first item in the list.
3. Press `Arrow Up` or `Arrow Left` to move the focus to the previous item.
4. Press `Arrow Down` or `Arrow Right` to move the focus to the next item.
5. Press `Home` to move the focus to the first item.
6. Press `End` to move the focus to the last item.
7. Press `Space` to start dragging an item. When dragging, press `Space` again to drop the dragged item.
8. Press `Arrow Up` or `Arrow Left` to move the dragged item to the previous position.
9. Press `Arrow Down` or `Arrow Right` to move the dragged item to the next position.
10. Press `Home` to move the dragged item to the first position.
11. Press `End` to move the dragged item to the last position.
12. Press `Escape` to cancel the drag and return the item to its initial position.

### Screen reader announcements customization

There are two main things that need to be considered to customize the screen reader announcements:

- The `aria-description` attribute: the keyboard navigation instructions (default: `Press the arrow keys to move through the list items. Press Space to start dragging an item. When dragging, use the arrow keys to move the item around. Press Space again to drop the item, or Escape to cancel.`).
- The `announcements` prop: the announcements to be read out by the screen reader during drag and drop operations.

In addition to those, you can also use the following too (accepted by both the `<SortableList.Root>` and `<SortableList.Item>` components):

- The `aria-label` attribute: the name of the list.
- The `aria-labelledby` attribute: the ID of the element that provides the name of the list.

The following example contains most of the code that you can find in the **“With custom announcements”** demo page, and it shows how we could translate the announcements to Spanish:

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

The following is a list of the available components inside the package:

| Component                   | Description                                                                                                                                                                                        |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<SortableList.Root>`       | The primary container. Provides the main structure, the drag-and-drop interactions and emits the available events.                                                                                 |
| `<SortableList.Item>`       | An individual item within `<SortableList.Root>`. Holds the data and content for each list item, as well as the `<SortableList.ItemHandle>` and `<SortableList.ItemRemove>` components when needed. |
| `<SortableList.ItemHandle>` | An element that limits the draggable area of a list item to itself. Including it inside a `<SortableList.Item>` will directly activate the handle functionality for that item.                     |
| `<SortableList.ItemRemove>` | A `<button>` element that (when pressed) removes an item. Including it inside a `<SortableList.Item>` will directly allow it to dispatch the `remove` event for that item.                         |

> [!WARNING]
> It is possible to avoid the `<SortableList.ItemRemove>` component and just go with a `<button>` element to trigger the removal of an item, but keep in mind that this component doesn’t just fire a click event, it will also focus the next item in the list if the user is using the keyboard to press the remove button. Otherwise, after the focused element is removed, the focus will fall back to the `<body>`.

### `<SortableList.Root>` props

| Prop                 | Type                    | Default                                                     | Possible values                                                         | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------- | ----------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gap`                | `number \| undefined`   | `12`                                                        | Number equal to or above `0`.                                           | Separation between items (in pixels).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `direction`          | `string \| undefined`   | `'vertical'`                                                | `'vertical'` or `'horizontal'`                                          | Orientation in which items will be arranged.                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `transition`         | `object \| undefined`   | `{ duration: 240, easing: 'cubic-bezier(0.2, 1, 0.1, 1)' }` | `duration`: number equal to or above `0`.<br>`easing`: easing function. | `duration`: time the transitions for the ghost (dropping) and items (translation, addition, removal) take to complete (in milliseconds). Assign it a value of `0` to remove animations.<br>`easing`: mathematical function that describes the rate at which the transitioning value changes. It receives any of the values accepted by the CSS (`transition-timing-function`)[https://developer.mozilla.org/en-US/docs/Web/CSS/transition-timing-function] property. Currently it only affects the ghost drop transition. |
| `hasWrapping`        | `boolean \| undefined`  | `false`                                                     | `true` or `false`                                                       | If `true`, items can wrap onto multiple lines.                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `hasLockedAxis`      | `boolean \| undefined`  | `false`                                                     | `true` or `false`                                                       | If `true`, prevents the dragged item from moving away from the main axis.                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `hasBoundaries`      | `boolean \| undefined`  | `false`                                                     | `true` or `false`                                                       | If `true`, items will only be draggable inside the list limits.                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `canClearOnDragOut`  | `boolean \| undefined`  | `false`                                                     | `true` or `false`                                                       | If `true`, the target item will be cleared when a the dragged item (by a pointing device) does not collide with any of the items in the list. This will cause the dragged item to return to its initial position when dropped. Otherwise, it will take the position of the last item it collided with.                                                                                                                                                                                                                    |
| `canRemoveOnDropOut` | `boolean \| undefined`  | `false`                                                     | `true` or `false`                                                       | If `true`, items will be removed when dragged and dropped outside of the list boundaries. This needs to be coupled with the `on:remove` event handler for it to complete the removal process.                                                                                                                                                                                                                                                                                                                             |
| `isLocked`           | `boolean \| undefined`  | `false`                                                     | `true` or `false`                                                       | If `true`, will allow every item in the list to be focused, but will prevent them from being dragged (both through pointer and keyboard). Interactive elements inside will operate normally.                                                                                                                                                                                                                                                                                                                              |
| `isDisabled`         | `boolean \| undefined`  | `false`                                                     | `true` or `false`                                                       | If `true`, will allow every item in the list to be focused, but will prevent them from being dragged (both through pointer and keyboard) and change its appearance to dimmed. Interactive elements inside will be disabled.                                                                                                                                                                                                                                                                                               |
| `announcements`      | `function \| undefined` | `undefined`                                                 | Object.                                                                 | Announcements to be read out by the screen reader during drag and drop operations.                                                                                                                                                                                                                                                                                                                                                                                                                                        |

> [!WARNING]
> For the time being, the support for wrapping is limited to lists that are horizontal and have items with the exact same width and height. Any other variation might not produce the expected results.

### `<SortableList.Root>` events

> [!NOTE]
> Events are fired in the order they are displayed below.

| Event       | Type                                   | Trigger                                                                                                  | Returns                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mounted`   | `SortableList.RootEvents['mounted']`   | The component is mounted.                                                                                | <pre>event: {<br>&nbsp;&nbsp;detail: null<br>}</pre>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `dragstart` | `SortableList.RootEvents['dragstart']` | An item starts to be dragged by a pointer device or a keyboard.                                          | <pre>event: {<br>&nbsp;&nbsp;detail: {<br>&nbsp;&nbsp;&nbsp;&nbsp;deviceType: 'pointer' \| 'keyboard',<br>&nbsp;&nbsp;&nbsp;&nbsp;draggedItem: HTMLLIElement,<br>&nbsp;&nbsp;&nbsp;&nbsp;draggedItemId: string,<br>&nbsp;&nbsp;&nbsp;&nbsp;draggedItemIndex: number,<br>&nbsp;&nbsp;&nbsp;&nbsp;isBetweenBounds: boolean,<br>&nbsp;&nbsp;&nbsp;&nbsp;canRemoveOnDropOut: boolean<br>&nbsp;&nbsp;}<br>}</pre>                                                                                                                                                                                                                                    |
| `drag`      | `SortableList.RootEvents['drag']`      | A dragged item is moved around by a pointer device or a keyboard (fires every few hundred milliseconds). | <pre>event: {<br>&nbsp;&nbsp;detail: {<br>&nbsp;&nbsp;&nbsp;&nbsp;deviceType: 'pointer' \| 'keyboard',<br>&nbsp;&nbsp;&nbsp;&nbsp;draggedItem: HTMLLIElement,<br>&nbsp;&nbsp;&nbsp;&nbsp;draggedItemId: string,<br>&nbsp;&nbsp;&nbsp;&nbsp;draggedItemIndex: number,<br>&nbsp;&nbsp;&nbsp;&nbsp;targetItem: HTMLLIElement \| null,<br>&nbsp;&nbsp;&nbsp;&nbsp;targetItemId: string \| null,<br>&nbsp;&nbsp;&nbsp;&nbsp;targetItemIndex: number \| null,<br>&nbsp;&nbsp;&nbsp;&nbsp;isBetweenBounds: boolean,<br>&nbsp;&nbsp;&nbsp;&nbsp;canRemoveOnDropOut: boolean<br>&nbsp;&nbsp;}<br>}</pre>                                                 |
| `drop`      | `SortableList.RootEvents['drop']`      | A dragged item is released by a pointer device or a keyboard.                                            | <pre>event: {<br>&nbsp;&nbsp;detail: {<br>&nbsp;&nbsp;&nbsp;&nbsp;deviceType: 'pointer' \| 'keyboard',<br>&nbsp;&nbsp;&nbsp;&nbsp;draggedItem: HTMLLIElement,<br>&nbsp;&nbsp;&nbsp;&nbsp;draggedItemId: string,<br>&nbsp;&nbsp;&nbsp;&nbsp;draggedItemIndex: number,<br>&nbsp;&nbsp;&nbsp;&nbsp;targetItem: HTMLLIElement \| null,<br>&nbsp;&nbsp;&nbsp;&nbsp;targetItemId: string \| null,<br>&nbsp;&nbsp;&nbsp;&nbsp;targetItemIndex: number \| null,<br>&nbsp;&nbsp;&nbsp;&nbsp;isBetweenBounds: boolean,<br>&nbsp;&nbsp;&nbsp;&nbsp;canRemoveOnDropOut: boolean<br>&nbsp;&nbsp;}<br>}</pre>                                                 |
| `dragend`   | `SortableList.RootEvents['dragend']`   | A dragged item reaches its destination after being released.                                             | <pre>event: {<br>&nbsp;&nbsp;detail: {<br>&nbsp;&nbsp;&nbsp;&nbsp;deviceType: 'pointer' \| 'keyboard',<br>&nbsp;&nbsp;&nbsp;&nbsp;draggedItem: HTMLLIElement,<br>&nbsp;&nbsp;&nbsp;&nbsp;draggedItemId: string,<br>&nbsp;&nbsp;&nbsp;&nbsp;draggedItemIndex: number,<br>&nbsp;&nbsp;&nbsp;&nbsp;targetItem: HTMLLIElement \| null,<br>&nbsp;&nbsp;&nbsp;&nbsp;targetItemId: string \| null,<br>&nbsp;&nbsp;&nbsp;&nbsp;targetItemIndex: number \| null,<br>&nbsp;&nbsp;&nbsp;&nbsp;isBetweenBounds: boolean,<br>&nbsp;&nbsp;&nbsp;&nbsp;canRemoveOnDropOut: boolean,<br>&nbsp;&nbsp;&nbsp;&nbsp;isCanceled: boolean<br>&nbsp;&nbsp;}<br>}</pre> |
| `destroyed` | `SortableList.RootEvents['destroyed']` | The component is destroyed.                                                                              | <pre>event: {<br>&nbsp;&nbsp;detail: null<br>}</pre>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

### `<SortableList.Item>` props

| Prop            | Type                                                    | Default     | Possible values   | Description                                                                              |
| --------------- | ------------------------------------------------------- | ----------- | ----------------- | ---------------------------------------------------------------------------------------- |
| `id`            | `string`                                                | `undefined` | Unique string.    | Unique identifier for each item.                                                         |
| `index`         | `number`                                                | `undefined` | Unique number.    | Position of the item in the list.                                                        |
| `isLocked`      | `boolean \| undefined`                                  | `false`     | `true` or `false` | If `true`, will prevent the item from being dragged.                                     |
| `isDisabled`    | `boolean \| undefined`                                  | `false`     | `true` or `false` | If `true`, will prevent the item from being dragged and change its appearance to dimmed. |
| `transitionIn`  | `(node: HTMLElement, params?: any) => TransitionConfig` | `scaleFly`  | Function          | Animation played when the item is added to the list.                                     |
| `transitionOut` | `(node: HTMLElement, params?: any) => TransitionConfig` | `scaleFly`  | Function          | Animation played when the item is removed from the list.                                 |

## Utilities

| Function                     | Description                                                                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `sortItems(items, from, to)` | Provides an easy mechanism to reorder items (should be used in combination with the [`dragend` event](#sortablelist-events)).              |
| `removeItem(items, index)`   | Provides an easy mechanism to remove an item from your list (should be used in combination with the [`drop` event](#sortablelist-events)). |

Example:

```svelte
<script lang="ts">
	import { ... removeItem, sortItems } from '@rodrigodagostino/svelte-sortable-list';
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

| Function   | Description                                   | Parameters                                                                                                                                                                                      |
| ---------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scaleFly` | The animated element scales and flies in/out. | <pre>{<br>&nbsp;&nbsp;delay: number<br>&nbsp;&nbsp;duration: number<br>&nbsp;&nbsp;easing: function<br>&nbsp;&nbsp;x: number<br>&nbsp;&nbsp;y: number<br>&nbsp;&nbsp;opacity: number<br>}</pre> |

Example:

```svelte
<script lang="ts">
	import { ... scaleFly } from '@rodrigodagostino/svelte-sortable-list';
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

| Type                                   | Description                                                                                              |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `SortableList.RootProps`               | Provides definitions for the [`<SortableList.Root>` component](#sortablelistroot-props).                 |
| `SortableList.ItemProps`               | Provides definitions for the [`<SortableList.Item>` component](#sortablelistitem-props).                 |
| `SortableList.ItemData`                | Provides definitions for your items list data.                                                           |
| `SortableList.RootEvents['mounted']`   | Provides definitions for the [`<SortableList.Root>` `mounted` custom event](#sortablelistroot-events).   |
| `SortableList.RootEvents['dragstart']` | Provides definitions for the [`<SortableList.Root>` `dragstart` custom event](#sortablelistroot-events). |
| `SortableList.RootEvents['drag']`      | Provides definitions for the [`<SortableList.Root>` `drag` custom event](#sortablelistroot-events).      |
| `SortableList.RootEvents['drop']`      | Provides definitions for the [`<SortableList.Root>` `drop` custom event](#sortablelistroot-events).      |
| `SortableList.RootEvents['dragend']`   | Provides definitions for the [`<SortableList.Root>` `dragend` custom event](#sortablelistroot-events).   |
| `SortableList.RootEvents['destroyed']` | Provides definitions for the [`<SortableList.Root>` `destroyed` custom event](#sortablelistroot-events). |

Example:

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

If you want to make use of the styles present in the demo pages, import them in your project like so:

```svelte
<script>
	import 'svelte-sortable-list/styles.css';
</script>
```

### Selectors

> [!IMPORTANT]
> To customize the appearance of the list items and ghost element (and not cause any conflicts or interferences with the core styles and transitions), the `.ssl-item` and `.ssl-ghost` selectors can be used as long as no transitions are applied directly to them. Another option is to create a wrapping element for the item’s content (like the element with the `.ssl-item-content` class included in one of the examples), which should be the direct child of the element with the `.ssl-item` class (the ghost element will simply mirror the list item’s content and appearance).

This is a list of the selectors you can use to style this library’s components to your heart’s desire:

| Selector                                          | Points to                                                                                            |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `.ssl-root`                                       | The list element, located inside the `<SortableList.Root>` component.                                |
| `.ssl-root[aria-orientation="vertical"]`          | A `<SortableList.Root>` displayed in vertical direction.                                             |
| `.ssl-root[aria-orientation="horizontal"]`        | A `<SortableList.Root>` displayed in horizontal direction.                                           |
| `.ssl-root[data-has-locked-axis="true"]`          | A `<SortableList.Root>` that only allows its items to move along its main axis.                      |
| `.ssl-root[data-has-boundaries="true"]`           | A `<SortableList.Root>` that only allows its items to move inside its limits.                        |
| `.ssl-root[data-can-clear-on-drag-out="true"]`    | A `<SortableList.Root>` that allows the target item to be cleared on drag out.                       |
| `.ssl-root[data-can-remove-on-drop-out="true"]`   | A `<SortableList.Root>` that allows the target item to be removed on drop out.                       |
| `.ssl-root[data-is-locked="true"]`                | A `<SortableList.Root>` that disallows dragging for its items.                                       |
| `.ssl-root[data-is-disabled="true"]`              | A `<SortableList.Root>` that disallows dragging and interactivity for its items.                     |
| `.ssl-root[aria-disabled="true"]`                 | A `<SortableList.Root>` that disallows dragging and interactivity for its items.                     |
| `.ssl-item`                                       | The list item element, located inside the `<SortableList.Item>` component.                           |
| `.ssl-item[data-drag-state="pointer-dragging"]`   | A `<SortableList.Item>` that is being dragged by a pointing device.                                  |
| `.ssl-item[data-drag-state="pointer-dropping"]`   | A `<SortableList.Item>` that is being dropped by a pointing device.                                  |
| `.ssl-item[data-drag-state="pointer-canceling"]`  | A `<SortableList.Item>` that is being canceled during a pointing-device drag.                        |
| `.ssl-item[data-drag-state="keyboard-dragging"]`  | A `<SortableList.Item>` that is being dragged by the keyboard.                                       |
| `.ssl-item[data-drag-state="keyboard-dropping"]`  | A `<SortableList.Item>` that is being dropped by the keyboard.                                       |
| `.ssl-item[data-drag-state="keyboard-canceling"]` | A `<SortableList.Item>` that is being canceled during a keyboard drag.                               |
| `.ssl-item[data-is-ghost="true"]`                 | A `<SortableList.Item>` that is displayed as a placeholder inside the shadow element while dragging. |
| `.ssl-item[data-is-between-bounds="true"]`        | A `<SortableList.Item>` that is between the list limits.                                             |
| `.ssl-item[data-is-locked="true"]`                | A `<SortableList.Item>` that can’t be dragged.                                                       |
| `.ssl-item[data-is-disabled="true"]`              | A `<SortableList.Item>` that can’t be dragged or interacted with.                                    |
| `.ssl-item[aria-disabled="true"]`                 | A `<SortableList.Item>` that can’t be dragged or interacted with.                                    |
| `.ssl-ghost`                                      | The shadow element that is displayed under the pointer when dragging.                                |
| `.ssl-ghost[data-can-clear-on-drop-out="true"]`   | The shadow element while `canClearOnDropOut` is enabled.                                             |
| `.ssl-ghost[data-can-remove-on-drop-out="true"]`  | The shadow element while `canRemoveOnDropOut` is enabled.                                            |
| `.ssl-item-handle`                                | The handle element, located inside the `<SortableList.ItemHandle>` component.                        |
| `.ssl-item-remove`                                | The remove button element, located inside the `<SortableList.ItemRemove>` component.                 |

> [!TIP]
> Combining the available selectors appropriately should be enough to style the list and the list items to your heart’s content.
> For example, the following would target an element with a custom selector inside of the `<SortableListGhost>` component when `canRemoveOnDropOut` is enabled and is being dragged outside of the list limits:
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

| Custom property             | Description                                                                                                                  |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `--ssl-gap`                 | Separation between items (in pixels).                                                                                        |
| `--ssl-wrap`                | Whether the list items are forced onto one line (`nowrap`) or can wrap onto multiple lines (`wrap`).                         |
| `--ssl-transition-duration` | Time the transitions for the ghost (dropping) and items (translation, addition, removal) take to complete (in milliseconds). |

## Motivation

While working on a SvelteKit project, I ran into the need of adding drag-and-drop capabilities to a couple of items lists, for which I decided to make use of [SortableJS](https://sortablejs.github.io/Sortable), which is certainly a popular option. I implemented it through a Svelte Action and it provided just what I needed, or so it seemed. After a while I realized I was not only missing touch screen support (since it was built with the HTML Drag and Drop API), but also accessibility was nowhere to be seen, and seems there are [no plans to work on it](https://github.com/SortableJS/Sortable/issues/1176).

I was not able to find any other suitable option, so this problem felt like a good opportunity to build my own package. And so while doing some research to try and understand the implications of such feature, I ran into a very [interesting article](https://baseweb.design/blog/drag-and-drop-list) and a very [interesting talk](https://youtu.be/y_XkQ2qMTSA) by Vojtech Miksu which really guided me through the different paths available, their advantages, pain points and limitations to create a drag-and-drop system, putting particular focus on accessibility and touch screen support.

Even though [React Movable](https://github.com/tajo/react-movable) was built for React, it served as my main inspiration when building this package. So thank you again, Vojtech :)
