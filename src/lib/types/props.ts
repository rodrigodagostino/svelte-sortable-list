import type { AriaAttributes } from 'svelte/elements';
import type { TransitionConfig } from 'svelte/transition';
import type { SortableListAnnouncements as Announcements } from './accessibility.js';

export interface SortableListRootProps
	extends Pick<
		AriaAttributes & {
			// `aria-description` is still in W3C Editor's Draft for ARIA 1.3,
			// but it is already correctly interpreted by screen readers.
			'aria-description'?: string | undefined | null;
		},
		'aria-label' | 'aria-labelledby' | 'aria-description' | 'aria-describedby'
	> {
	/** Separation between items (in pixels). */
	gap?: number;
	/** Orientation in which items will be arranged. */
	direction?: 'vertical' | 'horizontal';
	/** Object containing `transition` and `duration` properties. */
	transition?: {
		/** Time the transitions for the ghost (dropping) and items (translation, addition, removal) take to complete (in milliseconds). Assign it a value of `0` to remove animations. */
		duration?: number;
		/** Mathematical function that describes the rate at which the transitioning value changes. It receives any of the values accepted by the CSS `transition-timing-function` property. Currently it only affects the ghost drop transition. */
		easing?:
			| 'ease'
			| 'ease-in'
			| 'ease-out'
			| 'ease-in-out'
			| 'linear'
			| 'step-start'
			| 'step-end'
			| string;
	};
	/** If `true`, items can wrap onto multiple lines. */
	hasWrapping?: boolean;
	/** Prevents the dragged item from moving away from the main axis. */
	hasLockedAxis?: boolean;
	/** Items will only be draggable inside the list limits. */
	hasBoundaries?: boolean;
	/** The target item will be cleared when a the dragged item (by a pointing device) does not collide with any of the items in the list. */
	canClearOnDragOut?: boolean;
	/** Items will be removed when dragged and dropped outside of the list boundaries. */
	canRemoveOnDropOut?: boolean;
	/** Allows items to be focused, but prevents them from being dragged. Interactive elements inside will operate normally. */
	isLocked?: boolean;
	/** Allows items to be focused, but prevents them from being dragged and change its appearance to dimmed. Interactive elements inside will be disabled. */
	isDisabled?: boolean;
	/** The announcements to be read out by the screen reader during drag and drop operations. */
	announcements?: Announcements;
}

export interface SortableListItemProps
	extends Pick<AriaAttributes, 'aria-label' | 'aria-labelledby'> {
	/** Unique identifier for each item. */
	id: string;
	/** Position of the item in the list. */
	index: number;
	/** If `true`, will prevent the item from being dragged. */
	isLocked?: boolean;
	/** If `true`, will prevent the item from being dragged and change its appearance to dimmed. */
	isDisabled?: boolean;
	/** Animation played when the item is added to the list. */
	transitionIn?: (node: HTMLElement, params?: any) => TransitionConfig;
	/** Animation played when the item is removed from the list. */
	transitionOut?: (node: HTMLElement, params?: any) => TransitionConfig;
}

export interface SortableListGhostProps {
	/** Reference to the Ghost used in its parent component. */
	ghostRef: HTMLDivElement;
	/** State in which the Ghost is in. */
	state: 'idle' | 'ptr-drag' | 'ptr-predrop' | 'ptr-drop' | 'ptr-remove';
}
