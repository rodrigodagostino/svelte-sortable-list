import { getContext, setContext } from 'svelte';
import { writable, type Writable } from 'svelte/store';
import type {
	SortableListCoordinates,
	SortableListElements,
	SortableListProps,
} from '$lib/types/index.js';

export function setWritableContext<T>(key: string, context: T): Writable<T> {
	const uniqueKey = Symbol.for(key);
	return setContext(uniqueKey, writable<T>(context));
}

export function getWritableContext<T>(key: string): Writable<T> {
	const uniqueKey = Symbol.for(key);
	return getContext<Writable<T>>(uniqueKey);
}

/**
 * Props
 */
export function setListProps(context: SortableListProps) {
	return setWritableContext<SortableListProps>('props', context);
}
export function getListProps() {
	return getWritableContext<SortableListProps>('props');
}

/**
 * Coordinates
 */
export function setPointer(context: SortableListCoordinates['pointer']) {
	return setWritableContext<SortableListCoordinates['pointer']>('pointer', context);
}
export function getPointer() {
	return getWritableContext<SortableListCoordinates['pointer']>('pointer');
}

export function setPointerOrigin(context: SortableListCoordinates['pointerOrigin']) {
	return setWritableContext<SortableListCoordinates['pointerOrigin']>('pointerOrigin', context);
}
export function getPointerOrigin() {
	return getWritableContext<SortableListCoordinates['pointerOrigin']>('pointerOrigin');
}

export function setItemsOrigin(context: SortableListCoordinates['itemsOrigin']) {
	return setWritableContext<SortableListCoordinates['itemsOrigin']>('itemsOrigin', context);
}
export function getItemsOrigin() {
	return getWritableContext<SortableListCoordinates['itemsOrigin']>('itemsOrigin');
}

/**
 * Elements
 */
export function setDraggedItem(context: SortableListElements['draggedItem']) {
	return setWritableContext<SortableListElements['draggedItem']>('draggedItem', context);
}
export function getDraggedItem() {
	return getWritableContext<SortableListElements['draggedItem']>('draggedItem');
}

export function setTargetItem(context: SortableListElements['targetItem']) {
	return setWritableContext<SortableListElements['targetItem']>('targetItem', context);
}
export function getTargetItem() {
	return getWritableContext<SortableListElements['targetItem']>('targetItem');
}

export function setFocusedItem(context: SortableListElements['focusedItem']) {
	return setWritableContext<SortableListElements['focusedItem']>('focusedItem', context);
}
export function getFocusedItem() {
	return getWritableContext<SortableListElements['focusedItem']>('focusedItem');
}

/**
 * States
 */
export function setIsPointerDragging(context: boolean) {
	return setWritableContext<boolean>('isPointerDragging', context);
}
export function getIsPointerDragging() {
	return getWritableContext<boolean>('isPointerDragging');
}

export function setIsPointerDropping(context: boolean) {
	return setWritableContext<boolean>('isPointerDropping', context);
}
export function getIsPointerDropping() {
	return getWritableContext<boolean>('isPointerDropping');
}

export function setIsKeyboardDragging(context: boolean) {
	return setWritableContext<boolean>('isKeyboardDragging', context);
}
export function getIsKeyboardDragging() {
	return getWritableContext<boolean>('isKeyboardDragging');
}

export function setIsKeyboardDropping(context: boolean) {
	return setWritableContext<boolean>('isKeyboardDropping', context);
}
export function getIsKeyboardDropping() {
	return getWritableContext<boolean>('isKeyboardDropping');
}

export function setIsCancelingKeyboardDragging(context: boolean) {
	return setWritableContext<boolean>('isCancelingKeyboardDragging', context);
}
export function getIsCancelingKeyboardDragging() {
	return getWritableContext<boolean>('isCancelingKeyboardDragging');
}

export function setIsRemoving(context: boolean) {
	return setWritableContext<boolean>('isRemoving', context);
}
export function getIsRemoving() {
	return getWritableContext<boolean>('isRemoving');
}

export function setIsGhostBetweenBounds(context: boolean) {
	return setWritableContext<boolean>('isGhostBetweenBounds', context);
}
export function getIsGhostBetweenBounds() {
	return getWritableContext<boolean>('isGhostBetweenBounds');
}
