import type { RegistryList, SourceList, TargetList } from '$lib/types/states.js';
import type { SortableListRootState as RootState } from './sortable-list.svelte.ts';

export class SortableListRegistry {
	lists: RegistryList[] = $state.raw([]);
	sourceList: SourceList | null = $state.raw(null);
	targetList: TargetList | null = $state.raw(null);
	// Id of the item changing lists. The consumer takes it out of one list and puts it into the other
	// in the same update. While this is set, the item and its placeholder skip their out and in
	// transitions. The real item takes the placeholder’s place, and neither list resizes.
	crossingItemId: string | null = $state.raw(null);

	register(list: RegistryList) {
		this.lists = [...this.lists, list];
		return () => {
			this.lists = this.lists.filter((l) => l !== list);
		};
	}

	getPeers(group: string, exclude: RootState) {
		return this.lists.filter((l) => l.group === group && l.state !== exclude);
	}

	isSourceList(state: RootState) {
		return this.sourceList?.state === state;
	}

	isTargetList(state: RootState) {
		return this.targetList?.state === state;
	}
}

export const registry = new SortableListRegistry();
