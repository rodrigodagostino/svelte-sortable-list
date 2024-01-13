# CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] (2024-01-13)

### Added

- Handle feature: drag items using a handle element.

### Changed

- Improve transitions handling.

## [0.1.1] (2024-01-11)

### Changed

- Move items sorting outside of the **SortableList** component.

## [0.1.0] (2024-01-08)

### Added

- Base structure.
- Custom collision detection logic to be used instead of **Drag and Drop API** and `mouseenter` and `mouseleave` **Mouse Events**. Enabled the following:
  - Setting an overlap threshold.
  - Customizing the mouse cursor at each stage of the drag-and-drop process.
- Ghost element to represent the item being dragged and dropped.
- Base animations.

[unreleased]: https://github.com/rodrigodagostino/svelte-sortable-list/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/rodrigodagostino/svelte-sortable-list/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/rodrigodagostino/svelte-sortable-list/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/rodrigodagostino/svelte-sortable-list/releases/tag/v0.1.0
