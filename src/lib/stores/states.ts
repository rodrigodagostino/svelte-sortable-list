import { getWritableContext, setWritableContext, type Group } from './index.js';

export function setIsPointerDragging(group: Group, context: boolean) {
	return setWritableContext<boolean>('isPointerDragging', group, context);
}
export function getIsPointerDragging(group: Group) {
	return getWritableContext<boolean>('isPointerDragging', group);
}

export function setIsPointerDropping(group: Group, context: boolean) {
	return setWritableContext<boolean>('isPointerDropping', group, context);
}
export function getIsPointerDropping(group: Group) {
	return getWritableContext<boolean>('isPointerDropping', group);
}

export function setIsPointerCanceling(group: Group, context: boolean) {
	return setWritableContext<boolean>('isPointerCanceling', group, context);
}
export function getIsPointerCanceling(group: Group) {
	return getWritableContext<boolean>('isPointerCanceling', group);
}

export function setIsKeyboardDragging(group: Group, context: boolean) {
	return setWritableContext<boolean>('isKeyboardDragging', group, context);
}
export function getIsKeyboardDragging(group: Group) {
	return getWritableContext<boolean>('isKeyboardDragging', group);
}

export function setIsKeyboardDropping(group: Group, context: boolean) {
	return setWritableContext<boolean>('isKeyboardDropping', group, context);
}
export function getIsKeyboardDropping(group: Group) {
	return getWritableContext<boolean>('isKeyboardDropping', group);
}

export function setIsKeyboardCanceling(group: Group, context: boolean) {
	return setWritableContext<boolean>('isKeyboardCanceling', group, context);
}
export function getIsKeyboardCanceling(group: Group) {
	return getWritableContext<boolean>('isKeyboardCanceling', group);
}

export function setIsBetweenBounds(group: Group, context: boolean) {
	return setWritableContext<boolean>('isBetweenBounds', group, context);
}
export function getIsBetweenBounds(group: Group) {
	return getWritableContext<boolean>('isBetweenBounds', group);
}

export function setIsRTL(group: Group, context: boolean) {
	return setWritableContext<boolean>('isRTL', group, context);
}
export function getIsRTL(group: Group) {
	return getWritableContext<boolean>('isRTL', group);
}
