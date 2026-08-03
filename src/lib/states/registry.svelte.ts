import type { RegistryEntry, SourceRoot, TargetRoot } from '$lib/types/states.js';
import type { SortableListRootState as RootState } from './sortable-list.svelte.ts';

class SortableListRegistry {
	entries: RegistryEntry[] = $state.raw([]);
	sourceRoot: SourceRoot | null = $state.raw(null);
	targetRoot: TargetRoot | null = $state.raw(null);

	register(entry: RegistryEntry) {
		this.entries = [...this.entries, entry];
		return () => {
			this.entries = this.entries.filter((e) => e !== entry);
		};
	}

	getPeers(group: string, exclude: RootState) {
		return this.entries.filter((e) => e.group === group && e.rootState !== exclude);
	}

	isSourceRootState(state: RootState) {
		return this.sourceRoot?.state === state;
	}

	isTargetRootState(state: RootState) {
		return this.targetRoot?.state === state;
	}
}

export const registry = new SortableListRegistry();
