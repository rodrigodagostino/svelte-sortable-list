import { writable } from 'svelte/store';
import type { SortableListRootProps as RootProps } from '$lib/types/index.js';
import { defaultRootProps } from './fixtures.js';

export const rootProps = writable<Omit<RootProps, 'items'>>(defaultRootProps);
