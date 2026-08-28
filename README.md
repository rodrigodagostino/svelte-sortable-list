<div align="center">

![Logo](https://raw.githubusercontent.com/rodrigodagostino/svelte-sortable-list/master/static/favicon.svg?raw=true)

# Svelte Sortable List

A comprehensive package for creating accessible, sortable lists in Svelte applications.

[![NPM Version](https://img.shields.io/npm/v/@rodrigodagostino/svelte-sortable-list)](https://www.npmjs.com/package/@rodrigodagostino/svelte-sortable-list) [![Latest release](https://img.shields.io/github/release/rodrigodagostino/svelte-sortable-list.svg)](https://github.com/rodrigodagostino/svelte-sortable-list/releases/latest) [![License](https://img.shields.io/github/license/rodrigodagostino/svelte-sortable-list.svg)](LICENSE.md) [![Netlify Status](https://api.netlify.com/api/v1/badges/0062eb00-7ea7-4886-82a4-576bf477e919/deploy-status)](https://app.netlify.com/projects/svelte-sortable-list/deploys)

</div>

> [!IMPORTANT]
> **Version Compatibility**
>
> - **v3.x.x** (current): Compatible with **Svelte 5**
> - **v2.x.x**: Compatible with **Svelte 5** (available on the [v2 branch](https://github.com/rodrigodagostino/svelte-sortable-list/tree/v2))
> - **v1.x.x**: Compatible with **Svelte 4** (available on the [v1 branch](https://github.com/rodrigodagostino/svelte-sortable-list/tree/v1))
>
> Make sure to use the appropriate version for your Svelte project.

<div align="center">

<img width="600" src="https://raw.githubusercontent.com/rodrigodagostino/svelte-sortable-list/master/static/preview.gif?raw=true)" alt="Svelte Sortable List preview" />

</div>

---

## Live demos

- [Netlify](https://svelte-sortable-list.netlify.app)
- [Cloudflare](https://svelte-sortable-list.pages.dev)

---

## Table of contents

- [Features](#features)
- [Limitations](#limitations)
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
  - [`<SortableList.ItemHandle>` props](#sortablelistitemhandle-props)
  - [`<SortableList.ItemRemove>` props](#sortablelistitemremove-props)
- [Utilities](#utilities)
- [Transitions](#transitions)
- [Types](#types)
- [Styles](#styles)
  - [Selectors](#selectors)
  - [Custom properties](#custom-properties)
  - [CSS frameworks](#css-frameworks)
- [Motivation](#motivation)

---

## Features

- **Multi-input support**: Mouse, keyboard, and touch interactions.
- **Accessibility-first**: Screen reader support with customizable announcements.
- **Flexible layouts**: Vertical and horizontal orientations with varying item heights.
- **Enhanced UX**: Drop indicators, drag handles, auto-scrolling, and customizable transitions.
- **Advanced options**: Axis locking, boundary constraints, and remove-on-drop-outside functionality.
- **Multiple lists**: Drag items between grouped lists.
- **Integration**: Support for nested interactive elements and the `<dialog>` element.
- **Internationalization**: RTL language support.
- **Developer-friendly**: TypeScript definitions, unopinionated styling, and zero dependencies.

---

## Limitations

- Nested lists are not supported.
- Wrapped lists can be keyboard-navigated across the main axis only.
- Wrapping (line breaks) is limited to horizontal lists with items of identical width and height.

---

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

[REPL](https://svelte.dev/playground/35d0e5a2c5c44ebbb2e03ffb2553a020)

```svelte
<script lang="ts">
	import { SortableList, sortItems } from '@rodrigodagostino/svelte-sortable-list';

	let items: SortableList.ItemData[] = $state([
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
	]);

	function handleDragEnd(e: SortableList.RootEvents['ondragend']) {
		const { draggedItemIndex, targetItemIndex, isCanceled } = e;
		if (!isCanceled && typeof targetItemIndex === 'number' && draggedItemIndex !== targetItemIndex)
			items = sortItems(items, draggedItemIndex, targetItemIndex);
	}
</script>

<SortableList.Root ondragend={handleDragEnd}>
	{#each items as item, index (item.id)}
		<SortableList.Item {...item} {index}>
			<div class="ssl-item-content">
				<span class="ssl-item-content__text">{item.text}</span>
			</div>
		</SortableList.Item>
	{/each}
</SortableList.Root>
```

---

## Accessibility

This package prioritizes accessibility with comprehensive keyboard navigation and screen reader support.

### Keyboard navigation

**Navigation and interaction steps:**

1. Press `Tab` to focus the list.
2. Use `Up Arrow`, `Down Arrow`, or `Home` to focus the first item, or `End` to focus the last item.
3. Navigate between items:
   - `Up Arrow`: Move to the previous item.
   - `Down Arrow`: Move to the next item.
   - `Home`: Jump to the first item.
   - `End`: Jump to the last item.
4. Navigate between lists:
   - `Left Arrow`: Move to the previous list.
   - `Right Arrow`: Move to the next list.
5. Press `Space` to start dragging the focused item.
6. While dragging:
   - Use `Up Arrow` and `Down Arrow` to move the item to different positions within a list.
   - Use `Left Arrow` and `Right Arrow` to move the item to different lists.
   - `Home`: Move to the first position.
   - `End`: Move to the last position.
   - `Space`: Drop the item at the current position.
   - `Escape`: Cancel drag and return item to the original position.

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
	import { SortableList } from '@rodrigodagostino/svelte-sortable-list';

	const announcements: SortableList.RootProps['announcements'] = {
		lifted: ({ draggedItemIndex }) => {
			return `Has levantado un ítem en la posición ${draggedItemIndex! + 1}.`;
		},

		dragged: ({
			sourceList,
			sourceListIndex,
			draggedItemIndex,
			targetList,
			targetListIndex,
			targetItemIndex,
		}) => {
			const startPosition = draggedItemIndex + 1;
			const endPosition = targetItemIndex + 1;
			const hasCrossedList = !!targetList && targetList !== sourceList;

			if (hasCrossedList)
				return `Has movido el ítem de la posición ${startPosition} en la lista ${sourceListIndex! + 1} a la posición ${endPosition} en la lista ${targetListIndex! + 1}.`;

			const result =
				startPosition !== endPosition
					? `desde la posición ${startPosition} a la posición ${endPosition}`
					: `de vuelta a su posición inicial de ${startPosition}`;
			return `Has movido el ítem ${result}.`;
		},

		dropped: ({
			sourceList,
			sourceListIndex,
			draggedItemIndex,
			targetList,
			targetListIndex,
			targetItemIndex,
		}) => {
			const startPosition = draggedItemIndex + 1;
			const endPosition = typeof targetItemIndex === 'number' ? targetItemIndex + 1 : null;
			const hasCrossedList = !!targetList && targetList !== sourceList;

			if (hasCrossedList)
				return `Has soltado el ítem. Se ha movido de la posición ${startPosition} en la lista ${sourceListIndex! + 1} a la posición ${endPosition} en la lista ${targetListIndex! + 1}.`;

			const result =
				endPosition === null
					? `Se ha mantenido en su posición inicial de ${startPosition}`
					: startPosition !== endPosition
						? `Se ha movido desde la posición ${startPosition} a la posición ${endPosition}`
						: `Ha vuelto a su posición inicial de ${startPosition}`;
			return `Has soltado el ítem. ${result}.`;
		},

		canceled: ({ draggedItemIndex }) => {
			return `Has cancelado el arrastre. El ítem ha vuelto a su posición inicial de ${draggedItemIndex + 1}.`;
		},
	};

	const ariaDescription = $derived.by(() => {
		const isVertical = layoutState.props.direction === 'vertical';
		const arrowKeys = isVertical
			? 'Flecha Arriba o Flecha Abajo'
			: 'Flecha Izquierda o Flecha Derecha';

		return `Presiona ${arrowKeys} para moverte por los ítems. Presiona Espacio para empezar a arrastrar un ítem. Al arrastrar, usa ${arrowKeys} para mover el ítem. Presiona Espacio de nuevo para soltar el ítem, o Escape para cancelar.`;
	});
</script>

<SortableList.Root aria-description={ariaDescription} {announcements}>
	{#each items as item, index (item.id)}
		<SortableList.Item {...item} {index}>
			<div class="ssl-item-content">
				<span class="ssl-item-content__text">{item.text}</span>
			</div>
		</SortableList.Item>
	{/each}
</SortableList.Root>
```

---

## Components

This package follows the [Compound Component Pattern](https://www.smashingmagazine.com/2021/08/compound-components-react/), inspired in the remarkable work of [Hunter Johnston](https://github.com/huntabyte) in [Bits UI](https://github.com/huntabyte/bits-ui). This pattern allows you to access modular components that work together seamlessly, all stemming from a single source.

| Component                   | Description                                                                                                                                                                 |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<SortableList.Root>`       | The primary container that provides the main structure, drag-and-drop interactions, and emits available events.                                                             |
| `<SortableList.Item>`       | An individual list item that holds data and content, and can contain `<SortableList.ItemHandle>` and `<SortableList.ItemRemove>` components.                                |
| `<SortableList.ItemHandle>` | An element that restricts the draggable area of a list item to itself. Including this inside a `<SortableList.Item>` directly activates handle functionality for that item. |
| `<SortableList.ItemRemove>` | A `<button>` element that removes an item when pressed. Including this inside a `<SortableList.Item>` enables it to dispatch the `remove` event for that item.              |

> [!WARNING]
> While you can use a standard `<button>` element instead of `<SortableList.ItemRemove>` to trigger item removal, the provided component offers additional benefits. It automatically focuses the next item in the list when a user removes an item via keyboard, preventing focus from falling back to the `<body>` element.

### `<SortableList.Root>` props

| Prop                 | Type                                    | Default                                                     | Possible values                                       | Description                                                                                                                                                                                                                                                                                                                                                          |
| -------------------- | --------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ref` `[$bindable]`  | `HTMLUListElement \| null \| undefined` | `null`                                                      | `HTMLUListElement \| null \| undefined`               | Reference to the list element.                                                                                                                                                                                                                                                                                                                                       |
| `group`              | `string \| undefined`                   | `undefined`                                                 | Any string                                            | Group this list belongs to. Lists sharing the same `group` value can have items dragged between them. When set, `id` and `index` become required.                                                                                                                                                                                                                    |
| `id`                 | `string \| undefined`                   | `undefined`                                                 | Unique string                                         | Unique identifier for the list. Required when `group` is set.                                                                                                                                                                                                                                                                                                        |
| `index`              | `number \| undefined`                   | `undefined`                                                 | Unique number                                         | Position of the list within its `group`. Required when `group` is set.                                                                                                                                                                                                                                                                                               |
| `gap`                | `number \| undefined`                   | `12`                                                        | Number ≥ `0`                                          | Separation between items in pixels.                                                                                                                                                                                                                                                                                                                                  |
| `direction`          | `string \| undefined`                   | `'vertical'`                                                | `'vertical'` \| `'horizontal'`                        | Items orientation.                                                                                                                                                                                                                                                                                                                                                   |
| `delay`              | `number \| undefined`                   | `undefined`                                                 | Number ≥ `0`                                          | Time before the drag operation starts (in milliseconds). Can help prevent accidental dragging.                                                                                                                                                                                                                                                                       |
| `transition`         | `object \| undefined`                   | `{ duration: 320, easing: 'cubic-bezier(0.2, 1, 0.1, 1)' }` | `duration`: number ≥ `0`<br>`easing`: easing function | `duration`: Time in milliseconds for item (translation, dropping, addition, removal) transitions. Set to `0` to disable animations.<br>`easing`: Mathematical function describing transition rate changes. Accepts any value valid for the CSS [`transition-timing-function`](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-timing-function) property. |
| `hasWrapping`        | `boolean \| undefined`                  | `false`                                                     | `true` \| `false`                                     | When `true`, allows items to wrap onto multiple lines.                                                                                                                                                                                                                                                                                                               |
| `hasLockedAxis`      | `boolean \| undefined`                  | `false`                                                     | `true` \| `false`                                     | When `true`, constrains dragged items to the main axis only.                                                                                                                                                                                                                                                                                                         |
| `hasBounds`          | `boolean \| undefined`                  | `false`                                                     | `true` \| `false`                                     | When `true`, restricts item dragging to within list boundaries.                                                                                                                                                                                                                                                                                                      |
| `canClearOnDragOut`  | `boolean \| undefined`                  | `false`                                                     | `true` \| `false`                                     | When `true`, clears the target item when a dragged item (via pointing device) doesn't collide with any list items. This causes the dragged item to return to its initial position when dropped, rather than taking the position of the last item it collided with.                                                                                                   |
| `canRemoveOnDropOut` | `boolean \| undefined`                  | `false`                                                     | `true` \| `false`                                     | When `true`, removes items that are dragged and dropped outside list boundaries. Must be used with the `on:remove` event handler to complete the removal process.                                                                                                                                                                                                    |
| `isLocked`           | `boolean \| undefined`                  | `false`                                                     | `true` \| `false`                                     | When `true`, allows list items to be focused but prevents dragging (both pointer and keyboard). Interactive elements within items continue to function normally.                                                                                                                                                                                                     |
| `isDisabled`         | `boolean \| undefined`                  | `false`                                                     | `true` \| `false`                                     | When `true`, allows list items to be focused but prevents dragging (both pointer and keyboard) and applies dimmed styling. Interactive elements within items are disabled.                                                                                                                                                                                           |
| `announcements`      | `function \| undefined`                 | `undefined`                                                 | Object                                                | Custom announcements for screen readers during drag-and-drop operations.                                                                                                                                                                                                                                                                                             |

> [!WARNING]
> **Wrapping limitations**: Currently, wrapping support is limited to horizontal lists with items of identical width and height. Other variations may produce unexpected results.

### `<SortableList.Root>` events

> [!NOTE]
> Events fire in the order listed below.

| Event         | Type                                     | Trigger                                                                                    | Returns                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onmounted`   | `SortableList.RootEvents['onmounted']`   | Component is mounted                                                                       | `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `ondragstart` | `SortableList.RootEvents['ondragstart']` | Item begins being dragged by pointer device or keyboard                                    | <pre>{<br>&nbsp;&nbsp;deviceType: 'pointer' \| 'keyboard',<br>&nbsp;&nbsp;sourceList: HTMLUListElement,<br>&nbsp;&nbsp;sourceListId?: string,<br>&nbsp;&nbsp;sourceListIndex?: number,<br>&nbsp;&nbsp;draggedItem: HTMLLIElement,<br>&nbsp;&nbsp;draggedItemId: string,<br>&nbsp;&nbsp;draggedItemIndex: number,<br>&nbsp;&nbsp;isWithinBounds: boolean,<br>&nbsp;&nbsp;canRemoveOnDropOut: boolean<br>}</pre>                                                                                                                                                                                                                                                                                                                                      |
| `ondrag`      | `SortableList.RootEvents['ondrag']`      | Dragged item is moved by pointer device or keyboard (fires every few hundred milliseconds) | <pre>{<br>&nbsp;&nbsp;deviceType: 'pointer' \| 'keyboard',<br>&nbsp;&nbsp;sourceList: HTMLUListElement,<br>&nbsp;&nbsp;sourceListId?: string,<br>&nbsp;&nbsp;sourceListIndex?: number,<br>&nbsp;&nbsp;draggedItem: HTMLLIElement,<br>&nbsp;&nbsp;draggedItemId: string,<br>&nbsp;&nbsp;draggedItemIndex: number,<br>&nbsp;&nbsp;targetList: HTMLUListElement \| null,<br>&nbsp;&nbsp;targetListId: string \| null,<br>&nbsp;&nbsp;targetListIndex: number \| null,<br>&nbsp;&nbsp;targetItem: HTMLLIElement \| null,<br>&nbsp;&nbsp;targetItemId: string \| null,<br>&nbsp;&nbsp;targetItemIndex: number \| null,<br>&nbsp;&nbsp;isWithinBounds: boolean,<br>&nbsp;&nbsp;canRemoveOnDropOut: boolean<br>}</pre>                                     |
| `ondrop`      | `SortableList.RootEvents['ondrop']`      | Dragged item is released by pointer device or keyboard                                     | <pre>{<br>&nbsp;&nbsp;deviceType: 'pointer' \| 'keyboard',<br>&nbsp;&nbsp;sourceList: HTMLUListElement,<br>&nbsp;&nbsp;sourceListId?: string,<br>&nbsp;&nbsp;sourceListIndex?: number,<br>&nbsp;&nbsp;draggedItem: HTMLLIElement,<br>&nbsp;&nbsp;draggedItemId: string,<br>&nbsp;&nbsp;draggedItemIndex: number,<br>&nbsp;&nbsp;targetList: HTMLUListElement \| null,<br>&nbsp;&nbsp;targetListId: string \| null,<br>&nbsp;&nbsp;targetListIndex: number \| null,<br>&nbsp;&nbsp;targetItem: HTMLLIElement \| null,<br>&nbsp;&nbsp;targetItemId: string \| null,<br>&nbsp;&nbsp;targetItemIndex: number \| null,<br>&nbsp;&nbsp;isWithinBounds: boolean,<br>&nbsp;&nbsp;canRemoveOnDropOut: boolean<br>}</pre>                                     |
| `ondragend`   | `SortableList.RootEvents['ondragend']`   | Dragged item reaches its final destination after being released                            | <pre>{<br>&nbsp;&nbsp;deviceType: 'pointer' \| 'keyboard',<br>&nbsp;&nbsp;sourceList: HTMLUListElement,<br>&nbsp;&nbsp;sourceListId?: string,<br>&nbsp;&nbsp;sourceListIndex?: number,<br>&nbsp;&nbsp;draggedItem: HTMLLIElement,<br>&nbsp;&nbsp;draggedItemId: string,<br>&nbsp;&nbsp;draggedItemIndex: number,<br>&nbsp;&nbsp;targetList: HTMLUListElement \| null,<br>&nbsp;&nbsp;targetListId: string \| null,<br>&nbsp;&nbsp;targetListIndex: number \| null,<br>&nbsp;&nbsp;targetItem: HTMLLIElement \| null,<br>&nbsp;&nbsp;targetItemId: string \| null,<br>&nbsp;&nbsp;targetItemIndex: number \| null,<br>&nbsp;&nbsp;isCanceled: boolean,<br>&nbsp;&nbsp;isWithinBounds: boolean,<br>&nbsp;&nbsp;canRemoveOnDropOut: boolean<br>}</pre> |
| `ondestroyed` | `SortableList.RootEvents['ondestroyed']` | Component is destroyed                                                                     | `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

### `<SortableList.Item>` props

| Prop                | Type                                                    | Default     | Possible values                      | Description                                                                   |
| ------------------- | ------------------------------------------------------- | ----------- | ------------------------------------ | ----------------------------------------------------------------------------- |
| `ref` `[$bindable]` | `HTMLLIElement \| null \| undefined`                    | `null`      | `HTMLLIElement \| null \| undefined` | Reference to the item element.                                                |
| `id`                | `string`                                                | `undefined` | Unique string                        | Unique identifier for each item.                                              |
| `index`             | `number`                                                | `undefined` | Unique number                        | Position of the item in the list.                                             |
| `isLocked`          | `boolean \| undefined`                                  | `false`     | `true` \| `false`                    | When `true`, prevents the item from being dragged.                            |
| `isDisabled`        | `boolean \| undefined`                                  | `false`     | `true` \| `false`                    | When `true`, prevents the item from being dragged and applies dimmed styling. |
| `transitionIn`      | `(node: HTMLElement, params?: any) => TransitionConfig` | `scaleFly`  | Function                             | Animation played when the item is added to the list.                          |
| `transitionOut`     | `(node: HTMLElement, params?: any) => TransitionConfig` | `scaleFly`  | Function                             | Animation played when the item is removed from the list.                      |

### `<SortableList.ItemHandle>` props

| Prop                | Type                                   | Default | Possible values                        | Description                      |
| ------------------- | -------------------------------------- | ------- | -------------------------------------- | -------------------------------- |
| `ref` `[$bindable]` | `HTMLSpanElement \| null \| undefined` | `null`  | `HTMLSpanElement \| null \| undefined` | Reference to the handle element. |

### `<SortableList.ItemRemove>` props

| Prop                | Type                                     | Default | Possible values                          | Description                      |
| ------------------- | ---------------------------------------- | ------- | ---------------------------------------- | -------------------------------- |
| `ref` `[$bindable]` | `HTMLButtonElement \| null \| undefined` | `null`  | `HTMLButtonElement \| null \| undefined` | Reference to the remove element. |

---

## Utilities

Utility functions to simplify common list operations:

| Function                         | Description                                                                                                                                                 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sortItems(items, from, to)`     | Reorders items in your list. Use in combination with the [`ondragend` event](#sortablelistroot-events).                                                     |
| `insertItem(items, item, index)` | Inserts an item coming from a peer list into your list. Use in combination with the [`ondragend` event](#sortablelistroot-events) when using grouped lists. |
| `removeItem(items, index)`       | Removes an item from your list. Use in combination with the [`ondrop`](#sortablelistroot-events) or [`ondragend` event](#sortablelistroot-events).          |

**Example:**

[REPL](https://svelte.dev/playground/04976cd9375447c497a2e809be5f80ef)

```svelte
<script lang="ts">
	import { SortableList, removeItem, sortItems } from '@rodrigodagostino/svelte-sortable-list';

	function handleDragEnd(event: SortableList.RootEvents['ondragend']) {
		const { draggedItemIndex, targetItemIndex, isCanceled } = event;
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

<SortableList.Root ondragend={handleDragEnd}>
	{#each items as item, index (item.id)}
		<SortableList.Item {...item} {index}>
			<div class="ssl-item-content">
				<span class="ssl-item-content__text">{item.text}</span>
			</div>
		</SortableList.Item>
	{/each}
</SortableList.Root>
```

**Multiple lists example:**

To drag items between lists, give each `<SortableList.Root>` the same `group` value, along with a unique `id` and its `index` within the group. Use `sourceListId`/`targetListId` from the `ondragend` event to figure out which lists were involved, and `insertItem`/`removeItem` to move the item across your data:

```svelte
<script lang="ts">
	import {
		SortableList,
		insertItem,
		removeItem,
		sortItems,
	} from '@rodrigodagostino/svelte-sortable-list';

	let lists = $state([
		{
			id: 'to-do',
			title: 'To Do',
			items: [
				{
					id: 'to-do-item-1',
					text: 'To Do Item 1',
				},
				{
					id: 'to-do-item-2',
					text: 'To Do Item 2',
				},
				{
					id: 'to-do-item-3',
					text: 'To Do Item 3',
				},
				{
					id: 'to-do-item-4',
					text: 'To Do Item 4',
				},
				{
					id: 'to-do-item-5',
					text: 'To Do Item 5',
				},
			],
		},
		{
			id: 'doing',
			title: 'Doing',
			items: [
				{
					id: 'doing-item-1',
					text: 'Doing Item 1',
				},
				{
					id: 'doing-item-2',
					text: 'Doing Item 2',
				},
				{
					id: 'doing-item-3',
					text: 'Doing Item 3',
				},
			],
		},
		{
			id: 'done',
			title: 'Done',
			items: [
				{
					id: 'done-item-1',
					text: 'Done Item 1',
				},
				{
					id: 'done-item-2',
					text: 'Done Item 2',
				},
				{
					id: 'done-item-3',
					text: 'Done Item 3',
				},
				{
					id: 'done-item-4',
					text: 'Done Item 4',
				},
			],
		},
	]);

	function handleDragEnd(e: SortableList.RootEvents['ondragend']) {
		const {
			sourceListId,
			targetListId,
			draggedItemId,
			draggedItemIndex,
			targetItemIndex,
			isCanceled,
		} = e;
		if (isCanceled || typeof targetItemIndex !== 'number') return;

		if (!targetListId || targetListId === sourceListId) {
			const list = lists.find((l) => l.id === sourceListId);
			if (!list) return;
			list.items = sortItems(list.items, draggedItemIndex, targetItemIndex);
		} else {
			const sourceList = lists.find((l) => l.id === sourceListId);
			const targetList = lists.find((l) => l.id === targetListId);
			const draggedItem = sourceList?.items.find((item) => item.id === draggedItemId);
			if (!sourceList || !targetList || !draggedItem) return;

			targetList.items = insertItem(targetList.items, draggedItem, targetItemIndex);
			sourceList.items = removeItem(sourceList.items, draggedItemIndex);
		}
	}
</script>

{#each lists as { id, items }, index (id)}
	<SortableList.Root group="my-group" {id} {index} ondragend={handleDragEnd}>
		{#each items as item, itemIndex (item.id)}
			<SortableList.Item {...item} index={itemIndex}>
				<div class="ssl-item-content">
					<span class="ssl-item-content__text">{item.text}</span>
				</div>
			</SortableList.Item>
		{/each}
	</SortableList.Root>
{/each}
```

See the [“Multiple lists” live demo](https://svelte-sortable-list.netlify.app/multiple-lists) for a complete, working example.

---

## Transitions

Built-in transition functions for smooth animations:

| Function   | Description                                   | Parameters                                                                                                                                                                                                                      |
| ---------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scaleFly` | Animates an element scaling and flying in/out | <pre>{<br>&nbsp;&nbsp;delay: number<br>&nbsp;&nbsp;duration: number<br>&nbsp;&nbsp;easing: function<br>&nbsp;&nbsp;axis: 'x' \| 'y'<br>&nbsp;&nbsp;x: number<br>&nbsp;&nbsp;y: number<br>&nbsp;&nbsp;opacity: number<br>}</pre> |

**Example:**

[REPL](https://svelte.dev/playground/af72849dee3f4c5bb5e7e25a723545ca)

```svelte
<script lang="ts">
	import { SortableList, scaleFly } from '@rodrigodagostino/svelte-sortable-list';
</script>

<SortableList.Root ondragend={handleDragEnd}>
	{#each items as item, index (item.id)}
		<SortableList.Item
			{...item}
			{index}
			transitionIn={(node) => scaleFly(node, { duration: 320, x: -200 })}
			transitionOut={(node) => scaleFly(node, { duration: 320, x: 200 })}
		>
			<div class="ssl-item-content">
				<span class="ssl-item-content__text">{item.text}</span>
			</div>
		</SortableList.Item>
	{/each}
</SortableList.Root>
```

---

## Types

TypeScript definitions for type-safe development:

| Type                                     | Description                                                                                     |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `SortableList.RootProps`                 | Type definitions for the [`<SortableList.Root>` component](#sortablelistroot-props).            |
| `SortableList.ItemProps`                 | Type definitions for the [`<SortableList.Item>` component](#sortablelistitem-props).            |
| `SortableList.ItemData`                  | Type definitions for your items list data.                                                      |
| `SortableList.RootEvents['onmounted']`   | Type definitions for the [`<SortableList.Root>` `onmounted` event](#sortablelistroot-events).   |
| `SortableList.RootEvents['ondragstart']` | Type definitions for the [`<SortableList.Root>` `ondragstart` event](#sortablelistroot-events). |
| `SortableList.RootEvents['ondrag']`      | Type definitions for the [`<SortableList.Root>` `ondrag` event](#sortablelistroot-events).      |
| `SortableList.RootEvents['ondrop']`      | Type definitions for the [`<SortableList.Root>` `ondrop` event](#sortablelistroot-events).      |
| `SortableList.RootEvents['ondragend']`   | Type definitions for the [`<SortableList.Root>` `ondragend` event](#sortablelistroot-events).   |
| `SortableList.RootEvents['ondestroyed']` | Type definitions for the [`<SortableList.Root>` `ondestroyed` event](#sortablelistroot-events). |

**Example:**

```svelte
<script lang="ts">
	import type { SortableList } from '@rodrigodagostino/svelte-sortable-list';

	function handleDrop(e: SortableList.RootEvents['ondrop']) {
		const { draggedItemIndex, isBetweenBounds, canRemoveOnDropOut } = e;
		if (!isBetweenBounds && canRemoveOnDropOut) items = removeItem(items, draggedItemIndex);
	}

	function handleDragEnd(e: SortableList.RootEvents['ondragend']) {
		const { draggedItemIndex, targetItemIndex, isCanceled } = e;
		if (!isCanceled && typeof targetItemIndex === 'number' && draggedItemIndex !== targetItemIndex)
			items = sortItems(items, draggedItemIndex, targetItemIndex);
	}
</script>
```

---

## Styles

### Importing default styles

To use the demo page styles in your project:

[REPL](https://svelte.dev/playground/7cbf814cdbb041e3ab81fa9e42c5398f)

```svelte
<script>
	import '@rodrigodagostino/svelte-sortable-list/styles.css';
</script>
```

### Selectors

Use these CSS selectors to customize the appearance of list components:

> [!IMPORTANT]
> **Styling best practices**: To prevent conflicts with core styles and transitions, avoid applying transitions directly through the `.ssl-item` and `.ssl-placeholder` selectors. Instead, create a content wrapper element (like `.ssl-item-content`) as a child of `.ssl-item`. The placeholder element will automatically mirror the list item’s content and appearance.

| Selector                                             | Description                                                                                                        |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `.ssl-root`                                          | List element inside `<SortableList.Root>`.                                                                         |
| `.ssl-root[aria-orientation="vertical"]`             | Vertically oriented list.                                                                                          |
| `.ssl-root[aria-orientation="horizontal"]`           | Horizontally oriented list.                                                                                        |
| `.ssl-root[data-has-locked-axis="true"]`             | List with movement restricted to main axis.                                                                        |
| `.ssl-root[data-has-bounds="true"]`                  | List with boundary-constrained movement.                                                                           |
| `.ssl-root[data-can-clear-on-drag-out="true"]`       | List that clears target item when dragged outside boundaries.                                                      |
| `.ssl-root[data-can-remove-on-drop-out="true"]`      | List that removes items when dropped outside boundaries.                                                           |
| `.ssl-root[data-is-target="true"]`                   | Grouped list currently being targeted by an item dragged from a peer list.                                         |
| `.ssl-root[data-is-locked="true"]`                   | List with dragging disabled for all items.                                                                         |
| `.ssl-root[data-is-disabled="true"]`                 | List with dragging and interactivity disabled for all items.                                                       |
| `.ssl-root[aria-disabled="true"]`                    | List with dragging and interactivity disabled for all items.                                                       |
| `.ssl-item`                                          | Individual list item inside `<SortableList.Item>`.                                                                 |
| `.ssl-item[data-drag-state="idle"]`                  | Item in default, inactive state.                                                                                   |
| `.ssl-item[data-drag-state="ptr-drag-start"]`        | Item starting pointer drag.                                                                                        |
| `.ssl-item[data-drag-state="ptr-drag"]`              | Item during pointer drag.                                                                                          |
| `.ssl-item[data-drag-state="ptr-drop"]`              | Item during pointer drop.                                                                                          |
| `.ssl-item[data-drag-state="ptr-cancel"]`            | Item during canceled pointer drag.                                                                                 |
| `.ssl-item[data-drag-state="ptr-remove"]`            | Item during pointer drop outside list boundaries (with `canRemoveOnDropOut` enabled).                              |
| `.ssl-item[data-drag-state="kbd-drag-start"]`        | Item starting keyboard drag.                                                                                       |
| `.ssl-item[data-drag-state="kbd-drag"]`              | Item during keyboard drag.                                                                                         |
| `.ssl-item[data-drag-state="kbd-drop"]`              | Item during keyboard drop.                                                                                         |
| `.ssl-item[data-drag-state="kbd-cancel"]`            | Item during keyboard canceled drag.                                                                                |
| `.ssl-item[data-is-within-bounds="true"]`            | Item positioned within list boundaries.                                                                            |
| `.ssl-item[data-is-locked="true"]`                   | Item that cannot be dragged.                                                                                       |
| `.ssl-item[data-is-disabled="true"]`                 | Item that cannot be dragged or interacted with.                                                                    |
| `.ssl-item[aria-disabled="true"]`                    | Item that cannot be dragged or interacted with.                                                                    |
| `.ssl-placeholder`                                   | Placeholder marking the dragged item's vacated slot during a pointer drag.                                         |
| `.ssl-placeholder[data-drag-state="ptr-drag-start"]` | Placeholder present as a pointer drag starts.                                                                      |
| `.ssl-placeholder[data-drag-state="ptr-drag"]`       | Placeholder present during a pointer drag.                                                                         |
| `.ssl-placeholder[data-drag-state="ptr-predrop"]`    | Placeholder present while the dragged item settles into its dropped position.                                      |
| `.ssl-placeholder[data-drag-state="ptr-drop"]`       | Placeholder present during a pointer drop.                                                                         |
| `.ssl-placeholder[data-drag-state="ptr-cancel"]`     | Placeholder present during a canceled pointer drag.                                                                |
| `.ssl-placeholder[data-drag-state="ptr-remove"]`     | Placeholder present while the dragged item is dropped outside list boundaries (with `canRemoveOnDropOut` enabled). |     | `.ssl-item-handle` | Handle element inside `<SortableList.ItemHandle>`. |
| `.ssl-item-remove`                                   | Remove button element inside `<SortableList.ItemRemove>`.                                                          |

> [!TIP]
> **Advanced selector combinations**: Combine the available selectors to target specific states.
> For example, to style the content of an item that is being dragged outside the list when `canRemoveOnDropOut` is enabled:
>
> ```css
> .ssl-root[data-can-remove-on-drop-out='true']
> 	.ssl-item[data-is-within-bounds='false']
> 	.ssl-item-content {
> 	background-color: var(--ssl-rose-300);
> 	box-shadow:
> 		inset 0 0 0 0.0625rem var(--ssl-rose-400),
> 		var(--ssl-box-shadow-1);
> }
> ```
>
> If you find that your particular case is not covered, please, feel free to submit a request :)

### Custom properties

CSS custom properties for global styling control:

| Custom property             | Description                                                                                                                                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--ssl-gap`                 | Separation between items (in pixels).                                                                                                                                                                               |
| `--ssl-wrap`                | Whether list items are forced onto one line (`nowrap`) or can wrap onto multiple lines (`wrap`).                                                                                                                    |
| `--ssl-transition-duration` | Time it takes for item (dropping, translation, addition, removal) transitions to complete (in milliseconds).                                                                                                        |
| `--ssl-transition-easing`   | Mathematical function describing transition rate changes. Accepts any value valid for the CSS [`transition-timing-function`](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-timing-function) property. |

### CSS frameworks

Use your favorite CSS framework to style the SSL components.

> [!IMPORTANT]
> **Styling best practices**: To prevent conflicts with core styles and transitions, avoid applying transitions directly to the `<SortableList.Root>` and `<SortableList.Item>` components.

**Example using Tailwind CSS:**

[REPL](https://svelte.dev/playground/55d51548e4804adc85064ee232f543ef#H4sIAAAAAAAAA5VW247bNhD9lVm1iLyFaGudddKqVtEgCdAAecr2zfIDLVIyG4oUyJHXhmEgH9Ev7JcUpCSvb3Ud-MHSXM4czo3aBopWPEiCpxWXyOFJG6QLyeGzsAirMfzz7W94wo3kDJ4FLuFPKuSzUAzePz0FUVAIyW2QzLYBbmqH4wRB1KO-q-uh9chBFCyo5ZfkuVbIFdogCaY2N6JGkFSVaRagzYLfMpWhqGptELZ7fo5eBFYb_IS8srCDwugKwt-NZkaUmtFSWxRKj9owxHaORAqL4a8HoDf6jKzLgh3m1np3laHkCMKFT454DR2lDxTpbA4p_GiRIh_MnEOG2_YvQ8ESCB0ucQjkIYx6DfI1JhD6Ajgk2Ot20XWQ8RWQ8a0gr6-AvL4V5PEKyOOtIJMrIJNjkPl9V5KiUTkKrWBJFZP8g6HlR8UG_KRCX7TGjyvXdLNQK2ZoyRUL5_fQccm1sq7dnKbkzIX8pBhfR4DUlBwPBMK-pyrnbkB2kAL3rZWhKGBwd6B79QrchOjiFAHSNIVQNdWCm9CZncaEuzQ9dbrfp8x3f_oyCQMvif6fuc8Y7jI1HbVD5wZNTc_S5KxySa1Ns8DoRjHOyCwevhlPDK_mUOi8sWQlrFhInugGpVCcjE_kpFfoorAcyfjuPxyFYqLU5Oc4vssCF3pfnXR7VNJdpvxm2P7Aab5sxxCo9Q8RCJ84n4uhYPe7Nl3Hh3OZ6NO4HQ6HzrgzzHDrEfavfQJKo5sa-jRUrDuF24xCnZ3-RNyf_bL27OSZr4gPP2Vi1T-_kCkkX7cHJzlXyA381VgUxaZ_PeC5KPsAkziGek3eQr0hYxDKUTJClQePB1wADVVWuJEiswXNv7oMKEZyLbWJFnpN7JIy_TwHnxpydLSXoG_iuDOYzRhFSlxRid-MP6Xh1wXzgnA-P_B5vNmnpUBk-X32XZxf4nj0dnzFtUbz3fQOfW6hd8H-Cj1hSbnUFtOwoNLycJ4s9Yqb-bWMn_lcZuEI6JrmAjck7hvxoBUznNqaKuibsNqQ8XACbkETd8GD5JS5HkJRLhEKrZBUnImmam2elwI5NHXNTU4t7-73_rf1E-sM96OX4XTkIr4Mw4iJVfc2HZ2NdLsVRm4r-OV2ttDaPedvc2-blFIvqBwsNNvsLwAmbC3pJoHSCNat9FrSnPurySbQjtiRpvuOOdE5AIK8qiVFZyObStkEKqEquh7EETwUpt3FGZa0TuBh6FdrJ1pyl8cEaIO6E1VCkV6cU5kPHuJ4tQQCj4ZXPdQlI3ZmVVPmipXA-CViRU0pVAJx9-5LWNBKyE0C74ygMoI_uFxxFDmNwFJlieVGFAcXSpfcIApcLYMETcN38yjA7uuxk_wLvZl0034KAAA)

```svelte
<SortableList.Root
	class="rounded-[0.625rem] focus-visible:outline-2 focus-visible:-outline-offset-2! focus-visible:outline-indigo-800! [&_.ssl-placeholder]:opacity-0"
>
	{#each items as item, index (item.id)}
		<SortableList.Item
			{...item}
			{index}
			class="group rounded-md focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-indigo-800!"
		>
			<div
				class="flex items-center justify-center rounded-md bg-indigo-500 px-7 py-2 inset-ring inset-ring-indigo-800 transition-[background-color,box-shadow] duration-(--ssl-transition-duration) group-focus-within:bg-indigo-600 group-data-[drag-state*='kbd-drag']:bg-indigo-400 group-data-[drag-state*='kbd-drag']:shadow-lg group-data-[drag-state*='kbd-drag']:shadow-indigo-900/72 group-data-[drag-state*='ptr-drag']:bg-indigo-400 group-data-[drag-state*='ptr-drag']:shadow-lg group-data-[drag-state*='ptr-drag']:shadow-indigo-900/72 group-data-[drag-state='idle']:hover:bg-indigo-600"
			>
				<span class="my-2.5 text-base leading-tight font-medium text-white uppercase">
					{item.text}
				</span>
			</div>
		</SortableList.Item>
	{/each}
</SortableList.Root>
```

---

## Motivation

While working on a SvelteKit project, I ran into the need of adding drag-and-drop capabilities to a couple of item lists, for which I decided to go with [SortableJS](https://sortablejs.github.io/Sortable) (a very popular option). I implemented it through a Svelte Action providing just what I needed, or so it seemed. After a while, I realized I was not only missing touch screen support (since it was built using the HTML Drag and Drop API), but also accessibility was nowhere to be seen, and seems there were [no plans to work on it](https://github.com/SortableJS/Sortable/issues/1176).

I was not able to find any other suitable option, so this problem felt like a good opportunity to build my own package. And so, while doing some research to try and understand the implications of such feature, I ran into a very [interesting article](https://baseweb.design/blog/drag-and-drop-list) and a very [interesting talk](https://youtu.be/y_XkQ2qMTSA) by Vojtech Miksu, which really guided me through the different paths available, their advantages, pain points and limitations to create a drag-and-drop system, putting particular focus on accessibility and touch screen support.

Even though [React Movable](https://github.com/tajo/react-movable) was built for React, it served as my main inspiration when building this package. So thank you again, Vojtech :)
