import { writable } from 'svelte/store';
import type { SortableListRootProps } from '$lib/types/index.js';
import { defaultRootProps } from './fixtures.js';

export const rootProps = writable<Omit<SortableListRootProps, 'items'>>(defaultRootProps);
