import type { RegistryEntry, SourceRoot, TargetRoot } from '$lib/types/states.js';
import type { SortableListRootState as RootState } from './sortable-list.svelte.ts';

export class SortableListRegistry {
	entries: RegistryEntry[] = $state.raw([]);
	sourceRoot: SourceRoot | null = $state.raw(null);
	targetRoot: TargetRoot | null = $state.raw(null);
	// Id of the item changing lists. The consumer takes it out of one list and puts it into the other
	// in the same update. While this is set, the item and its placeholder skip their out and in
	// transitions. The real item takes the placeholder’s place, and neither list resizes.
	crossingItemId: string | null = $state.raw(null);

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
