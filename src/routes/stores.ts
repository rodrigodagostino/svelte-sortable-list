import { writable } from 'svelte/store';
import type { SortableListRootProps } from '$lib/types/index.js';
import { defaultProps } from './fixtures.js';

export const props = writable<Omit<SortableListRootProps, 'items'>>(defaultProps);
