import { writable } from 'svelte/store';
import type { SortableListProps } from '$lib/types/index.js';
import { defaultProps } from './fixtures.js';

export const rootProps = writable<Omit<SortableListProps, 'items'>>(defaultProps);
