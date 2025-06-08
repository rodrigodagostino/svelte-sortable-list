import type { Announcements } from './accessibility.js';

export interface SortableListRootProps {
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

export interface SortableListItemProps {
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
