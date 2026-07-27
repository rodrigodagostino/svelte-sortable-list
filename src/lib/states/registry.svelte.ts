import type { RegistryEntry } from '$lib/types/states.js';
import type { SortableListRootState as RootState } from './sortable-list.svelte.ts';

class SortableListRegistry {
	entries: RegistryEntry[] = $state.raw([]);

	register(entry: RegistryEntry) {
		this.entries = [...this.entries, entry];
		return () => {
			this.entries = this.entries.filter((e) => e !== entry);
		};
	}

	getPeers(group: string, exclude: RootState) {
		return this.entries.filter((e) => e.group === group && e.rootState !== exclude);
	}
}

export const registry = new SortableListRegistry();
