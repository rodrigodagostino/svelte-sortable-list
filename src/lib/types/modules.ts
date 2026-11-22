export interface AutoScrollOptions {
	/** Multiplier applied to the scrolling speed (higher values scroll faster). */
	speed?: number;
	/** Fraction of the scroll container, from each edge, where dragging starts scrolling. */
	threshold?: number;
	/** Gap (in pixels) between the target item and the container edge when a keyboard drag scrolls it into view. */
	margin?: number;
}

export interface AutoScrollModule {
	kind: 'autoScroll';
	readonly margin: number;
	update(
		container: HTMLElement,
		clientX: number,
		clientY: number,
		isScrollingDocument: boolean
	): void;
	stop(): void;
}

export type SortableListModule = AutoScrollModule;
