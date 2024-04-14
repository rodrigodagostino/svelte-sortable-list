# CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.8.2] (2024-04-14)

### Docs

- Make **Controls** collapsible.

## [0.8.1] (2024-04-09)

### Add

- Expose stylesheets to allow them to be imported from outside the package.

### Changed

- Rename `getFocusedItemElement()` function to `getItemElement()`.
- Rename `oldIndex`/`newIndex` to `prevIndex`/`nextIndex` in `dispatch('sort')` function.
- Rename `id` to `itemId` in `dispatch('remove')` function.
- Rename `reorderItems()` function to `sortItems()`.

### Docs

- Write proper README.

## [0.8.0] (2024-04-01)

### Docs

- Extract `items` to fixtures file.
- Add a reset button to demo pages with removable items.
- Add controls to demo pages.

## [0.7.4] (2024-04-01)

### Added

- Add remove on drag out feature.

### Changed

- Optimize `styleTransform` reactive declaration.
- Encapsulate collision detection logic into the `areColliding()` function.
- Rename `checkIfInteractive()` function to `hasInteractiveElements()`.

### Docs

- Add **“Has remove on drag out”** demo page.

## [0.7.3] (2024-03-26)

### Added

- Add boundaries feature.

### Changed

- Rename `ghostOrigin` state to `pointerOrigin`.

### Docs

- Rename **“With drop marker”** demo page to **“Has drop marker”**.
- Rename **“Locked axis”** demo page to **“Has locked axis”**.
- Rename **“Direction horizontal (locked axis)”** demo page to **“Direction horizontal (has locked axis)”**.

## [0.7.2] (2024-03-25)

### Added

- Add locked axis feature.
- Add direction feature.

### Fixed

- Repair ghost, items and marker translations when dropping.
- Prevent mutation of the source array in `reorderItems()`.
- Add consistency to the handling of items focus loss.

### Docs

- Add **“Locked axis”** demo page.
- Add **“Direction horizontal”** demo page.
- Add **“Direction horizontal (locked axis)”** demo page.

## [0.7.1] (2024-03-17)

### Added

- Add drop marker feature.

### Fixed

- Polish shaky ghost animation when dropping with pointer.

### Docs

- Add **“With drop marker”** demo page.

## [0.7.0] (2024-03-16)

### Added

- Add support for disabled items.
- Extract components styles to importable CSS stylesheet (allows reuse of demo styles in a project using this package).

### Changed

- Avoid data preload on link hover.
- Add `label` to list of elements to be checked in `checkIfInteractive()`.

## Fixed

- Correct slots forwarding structure.
- Prevent item focus when a pointer down event is triggered.
- Correct validations in `dispatchSort()`.

### Docs

- Add **“Disabled items”** demo page.
- Add **“Unstyled items”** demo page.

## [0.6.2] (2024-03-14)

### Added

- Create and implement **SortableListProps** and **SortableItemProps** interfaces.

### Changed

- Remove `key` prop.
- Rename **IItemData** interface to **ItemData**.

### Docs

- Rename most demo pages and routes containing “With”.

## [0.6.1] (2024-03-14)

### Changed

- Avoid unnecessary code repetition through `getFocusedItemElement()` and `dispatchSort()`.
- Rename `sortThreshold` prop to `swapThreshold`.

### Fixed

- Handle interruption of keyboard navigation caused by pointer interaction.
- Trigger swap consistently when ghost hovers over the adjacent items of the dragged item (by including the dragged item in the list of colliding items).
- Pass down `gap` and `transitionDuration` props to the **SortableItem** component to actually make use of the values assigned to the **SortableList** component.

## [0.6.0] (2024-03-04)

### Added

- Add item removal feature.
- Add **Handle** icon component.
- Add **Remove** icon component.
- Add `canceled` live text.

### Changed

- Extract **SortableItem** component.
- Extract **Ghost** component.
- Render **SortableList** only if `items` prop is provided.
- Add default value to `key` prop.
- Ensure `id` prop consistency.

### Fixed

- Prevent focus loss after removing a **SortableItem**.
- Allow interactive elements (like buttons) in an item to be tabbable and operate normally only when that item is focused.
- Prevent dragging with pointer while dragging with keyboard is occurring.
- Prevent screen reading of an item’s content after dropping it.

### Docs

- Add page titles

## [0.5.2] (2024-02-15)

### Added

- Reset list back to its latest state when Escape is pressed.

### Fixed

- Transition items position out when focus is lost (by tabbing or clicking).
- Handle item focus consistently.

## [0.5.1] (2024-02-12)

### Added

- Add support for screen readers.

### Changed

- Refactor keyboard navigation by implementing the **[Listbox Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/)** to support screen readers.

## [0.5.0] (2024-02-04)

### Added

- Add support for keyboard navigation.

## [0.4.1] (2024-01-27)

### Changed

- Reduce the number of event listeners through event delegation.

### Fixed

- Display the correct cursor while dragging.

## [0.4.0] (2024-01-27)

### Added

- Add support for mobile devices.

### Fixed

- Prevent conflicts with events outside the package.

## [0.3.3] (2024-01-23)

### Changed

- Keep the demos navigation vertically centered when the page’s height increases.

### Fixed

- Display `grabbing` cursor when dragging from a handle.
- Prevent CSS transitions flickering in Firefox.

## [0.3.2] (2024-01-22)

### Added

- Add support for items with varying height.
- Add **“With varying heights”** demo page.

## [0.3.1] (2024-01-21)

### Added

- Add gap feature: control the spacing between items through the new `gap` prop.
- Create `scaleFly` custom transition.
- Animate dynamically added/removed items.
- Add **“With dynamic items”** demo page.

### Changed

- Improve overall demos layout.

## [0.3.0] (2024-01-20)

### Added

- Translate the items based on the ghost position as it is being dragged (instead of waiting for it to be dropped to trigger the items translation).

### Changed

- Simplify and increase the flexibility of the data structure.

## [0.2.4] (2024-01-15)

### Changed

- Prevent drag and drop if the target is an interactive element.

## [0.2.3] (2024-01-14)

### Added

- Add sort threshold feature: control the interaction threshold between ghost and items on dragging through the new `sortThreshold` prop.

### Changed

- Improve the collision detection logic to target the item with the largest intersecting area.
- Increase the default `sortThreshold` value to `1`.

## [0.2.2] (2024-01-14)

### Added

- Add `transitionDuration` prop to the **SortableList** component.

### Fixed

- Prevent crash when an item is dropped in the exact same position it was dragged from.

## [0.2.1] (2024-01-13)

### Changed

- Improve overall demos layout.

## [0.2.0] (2024-01-13)

### Added

- Add handle feature: drag and drop items using a handle element.

### Changed

- Improve transitions handling.

## [0.1.1] (2024-01-11)

### Changed

- Move sort handling outside of the **SortableList** component.

## [0.1.0] (2024-01-08)

### Added

- Create base structure.
- Add custom collision detection logic to be used instead of **Drag and Drop API** and `mouseenter` and `mouseleave` **Mouse Events**. This enabled the following:
  - Setting an overlap threshold.
  - Customizing the mouse cursor at each stage of the drag-and-drop process.
- Add a ghost element to represent the item being dragged and dropped.
- Add base animations.

[unreleased]: https://github.com/rodrigodagostino/svelte-sortable-list/compare/v0.8.2...HEAD
[0.8.2]: https://github.com/rodrigodagostino/svelte-sortable-list/compare/v0.8.1...v0.8.2
[0.8.1]: https://github.com/rodrigodagostino/svelte-sortable-list/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/rodrigodagostino/svelte-sortable-list/compare/v0.7.4...v0.8.0
[0.7.4]: https://github.com/rodrigodagostino/svelte-sortable-list/compare/v0.7.3...v0.7.4
[0.7.3]: https://github.com/rodrigodagostino/svelte-sortable-list/compare/v0.7.2...v0.7.3
[0.7.2]: https://github.com/rodrigodagostino/svelte-sortable-list/compare/v0.7.1...v0.7.2
[0.7.1]: https://github.com/rodrigodagostino/svelte-sortable-list/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/rodrigodagostino/svelte-sortable-list/compare/v0.6.2...v0.7.0
[0.6.2]: https://github.com/rodrigodagostino/svelte-sortable-list/compare/v0.6.1...v0.6.2
[0.6.1]: https://github.com/rodrigodagostino/svelte-sortable-list/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/rodrigodagostino/svelte-sortable-list/compare/v0.5.2...v0.6.0
[0.5.2]: https://github.com/rodrigodagostino/svelte-sortable-list/compare/v0.5.1...v0.5.2
[0.5.1]: https://github.com/rodrigodagostino/svelte-sortable-list/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/rodrigodagostino/svelte-sortable-list/compare/v0.4.1...v0.5.0
[0.4.1]: https://github.com/rodrigodagostino/svelte-sortable-list/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/rodrigodagostino/svelte-sortable-list/compare/v0.3.3...v0.4.0
[0.3.3]: https://github.com/rodrigodagostino/svelte-sortable-list/compare/v0.3.2...v0.3.3
[0.3.2]: https://github.com/rodrigodagostino/svelte-sortable-list/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/rodrigodagostino/svelte-sortable-list/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/rodrigodagostino/svelte-sortable-list/compare/v0.2.4...v0.3.0
[0.2.4]: https://github.com/rodrigodagostino/svelte-sortable-list/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/rodrigodagostino/svelte-sortable-list/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/rodrigodagostino/svelte-sortable-list/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/rodrigodagostino/svelte-sortable-list/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/rodrigodagostino/svelte-sortable-list/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/rodrigodagostino/svelte-sortable-list/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/rodrigodagostino/svelte-sortable-list/releases/tag/v0.1.0
