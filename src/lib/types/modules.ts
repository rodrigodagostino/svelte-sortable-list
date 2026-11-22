import type { SortableListRootState as RootState } from '$lib/states/index.js';
import type { RegistryList, SourceList, TargetList } from './states.js';

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

export interface CrossListOptions {
	/** Group this list belongs to. Items can be moved between lists of the same group. */
	group: string;
}

export interface CrossListModule {
	kind: 'crossList';
	readonly group: string;
	readonly sourceList: SourceList | null;
	targetList: TargetList | null;
	readonly crossingItemId: string | null;
	register(state: RootState): () => void;
	start(state: RootState, item: HTMLLIElement): void;
	updateTarget(state: RootState, draggedRect: DOMRect): void;
	focusPeer(state: RootState, step: 1 | -1): void;
	moveTarget(state: RootState, step: 1 | -1): boolean;
	end(state: RootState, isCanceled: boolean): void;
	getPeerLists(state: RootState): RegistryList[];
	isOtherDragActive(state: RootState): boolean;
}

export type SortableListModule = AutoScrollModule | CrossListModule;
