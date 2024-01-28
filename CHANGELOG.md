# CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[unreleased]: https://github.com/rodrigodagostino/svelte-sortable-list/compare/v0.4.1...HEAD
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
