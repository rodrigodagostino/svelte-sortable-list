import type { AriaAttributes } from 'svelte/elements';
import type { Announcements } from './accessibility.js';

export interface SortableListRootProps
	extends Pick<
		AriaAttributes,
		'aria-label' | 'aria-labelledby' | 'aria-description' | 'aria-describedby'
	> {
	gap?: number;
	direction?: 'vertical' | 'horizontal';
	transitionDuration?: number;
	hasDropMarker?: boolean;
	hasLockedAxis?: boolean;
	hasBoundaries?: boolean;
	canClearOnDragOut?: boolean;
	canRemoveOnDropOut?: boolean;
	isLocked?: boolean;
	isDisabled?: boolean;
	announcements?: Announcements;
}

export interface SortableListItemProps
	extends Pick<AriaAttributes, 'aria-label' | 'aria-labelledby'> {
	id: string;
	index: number;
	isLocked?: boolean;
	isDisabled?: boolean;
}

export interface SortableListGhostProps {
	ghostRef: HTMLDivElement;
	status: 'init' | 'preset' | 'set' | 'remove' | 'unset';
	listRef: HTMLUListElement | null;
}
