import type { Snippet } from 'svelte';
import type { AriaAttributes, HTMLButtonAttributes } from 'svelte/elements';
import type { TransitionConfig } from 'svelte/transition';
import type { SortableListAnnouncements as Announcements } from './accessibility.js';
import type {
	MountedEvent,
	DragStartEvent,
	DragEvent,
	DropEvent,
	DragEndEvent,
	DestroyedEvent,
} from './events.js';

export interface SortableListRootProps extends Pick<
	AriaAttributes & {
		// `aria-description` is still in W3C Editor's Draft for ARIA 1.3,
		// but it is already correctly interpreted by screen readers.
		'aria-description'?: string | undefined | null;
	},
	'aria-label' | 'aria-labelledby' | 'aria-description' | 'aria-describedby'
> {
	/** Reference to the list element. `[$bindable]` */
	ref?: HTMLUListElement | null;
	/** Separation between items (in pixels). */
	gap?: number;
	/** Orientation in which items will be arranged. */
	direction?: 'vertical' | 'horizontal';
	/** Time before the drag operation starts (in milliseconds). Can help prevent accidental dragging. */
	delay?: number;
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
	/** Content to be rendered inside the list. */
	children?: Snippet;
	/** Callback fired when the component is mounted. */
	onmounted?: (event: MountedEvent) => void;
	/** Callback fired when an item starts to be dragged by a pointer device or a keyboard. */
	ondragstart?: (event: DragStartEvent) => void;
	/** Callback fired when a dragged item is moved around by a pointer device or a keyboard (fires every few hundred milliseconds). */
	ondrag?: (event: DragEvent) => void;
	/** Callback fired when a dragged item is released by a pointer device or a keyboard. */
	ondrop?: (event: DropEvent) => void;
	/** Callback fired when a dragged item reaches its destination after being released. */
	ondragend?: (event: DragEndEvent) => void;
	/** Callback fired when the component is destroyed. */
	ondestroyed?: (event: DestroyedEvent) => void;
}

export interface SortableListItemProps extends Pick<
	AriaAttributes,
	'aria-label' | 'aria-labelledby'
> {
	/** Reference to the item element. `[$bindable]` */
	ref?: HTMLLIElement | null;
	/** Unique identifier for each item. */
	id: string;
	/** Position of the item in the list. */
	index: number;
	/** If `true`, will prevent the item from being dragged. */
	isLocked?: boolean;
	/** If `true`, will prevent the item from being dragged and change its appearance to dimmed. */
	isDisabled?: boolean;
	/** Animation played when the item is added to the list. */
	transitionIn?: (
		node: HTMLElement,
		params?: Record<string, unknown> | undefined
	) => TransitionConfig;
	/** Animation played when the item is removed from the list. */
	transitionOut?: (
		node: HTMLElement,
		params?: Record<string, unknown> | undefined
	) => TransitionConfig;
	/** Content to be rendered inside the item. */
	children?: Snippet;
}

export interface SortableListGhostProps {
	/** Reference to the ghost element. `[$bindable]` */
	ref: HTMLDivElement | null;
}

export interface SortableListItemHandleProps {
	/** Reference to the handle element. `[$bindable]` */
	ref?: HTMLSpanElement | null;
	/** Content to be rendered inside the handle. */
	children?: Snippet;
}

export interface SortableListItemRemoveProps extends HTMLButtonAttributes {
	/** Reference to the remove element. `[$bindable]` */
	ref?: HTMLButtonElement | null;
	/** Content to be rendered inside the remove button. */
	children?: Snippet;
}

export interface IconProps {
	/** Name of the icon to display. */
	name: 'handle' | 'remove';
}
