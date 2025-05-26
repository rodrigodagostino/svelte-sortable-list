export * from './props.js';
export * from './coordinates.js';
export * from './elements.js';
export * from './states.js';

import { getContext, setContext } from 'svelte';
import { writable, type Writable } from 'svelte/store';

export function setWritableContext<T>(key: string, context: T): Writable<T> {
	const uniqueKey = Symbol.for(key);
	return setContext(uniqueKey, writable<T>(context));
}

export function getWritableContext<T>(key: string): Writable<T> {
	const uniqueKey = Symbol.for(key);
	return getContext<Writable<T>>(uniqueKey);
}
