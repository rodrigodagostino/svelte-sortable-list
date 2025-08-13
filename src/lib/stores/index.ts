export * from './props.js';
export * from './coordinates.js';
export * from './elements.js';
export * from './states.js';

import { getContext, setContext } from 'svelte';
import { writable, type Writable } from 'svelte/store';

export type Group = string | number | undefined;

type LocalRegistry = {
	[key: string]: Symbol;
};

const localRegistry: LocalRegistry = {};

function getSymbol(key: string, group: Group): Symbol {
	if (group !== undefined) {
		key = `${key}-${group}`;
	}
	let symbol = localRegistry[key];
	if (symbol === undefined) {
		symbol = Symbol(key);
		localRegistry[key] = symbol;
	}
	return symbol;
}

export function setWritableContext<T>(key: string, group: Group, context: T): Writable<T> {
	const uniqueKey = getSymbol(key, group);
	return setContext(uniqueKey, writable<T>(context));
}

export function getWritableContext<T>(key: string, group: Group): Writable<T> {
	const uniqueKey = getSymbol(key, group);
	return getContext<Writable<T>>(uniqueKey);
}
