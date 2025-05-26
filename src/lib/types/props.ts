export interface SortableListProps {
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
}

export interface SortableItemProps {
	id: string;
	index: number;
	isLocked?: boolean;
	isDisabled?: boolean;
}

export interface GhostProps {
	status: 'init' | 'preset' | 'set' | 'remove' | 'unset';
	listRef: HTMLUListElement | null;
}
