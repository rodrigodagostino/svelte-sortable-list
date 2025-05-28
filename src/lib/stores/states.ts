import { getWritableContext, setWritableContext } from './index.js';

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

export function setIsPointerCanceling(context: boolean) {
	return setWritableContext<boolean>('isPointerCanceling', context);
}
export function getIsPointerCanceling() {
	return getWritableContext<boolean>('isPointerCanceling');
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

export function setIsKeyboardCanceling(context: boolean) {
	return setWritableContext<boolean>('isKeyboardCanceling', context);
}
export function getIsKeyboardCanceling() {
	return getWritableContext<boolean>('isKeyboardCanceling');
}

export function setIsBetweenBounds(context: boolean) {
	return setWritableContext<boolean>('isBetweenBounds', context);
}
export function getIsBetweenBounds() {
	return getWritableContext<boolean>('isBetweenBounds');
}

export function setIsRTL(context: boolean) {
	return setWritableContext<boolean>('isRTL', context);
}
export function getIsRTL() {
	return getWritableContext<boolean>('isRTL');
}
