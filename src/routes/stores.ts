import { writable } from 'svelte/store';
import type { SortableListProps } from '$lib/types/index.js';
import { defaultProps } from './fixtures.js';

export const props = writable<Omit<SortableListProps, 'items'>>(defaultProps);
