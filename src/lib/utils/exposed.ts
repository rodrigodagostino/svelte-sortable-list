import type { SortableList } from '$lib/index.js';

export function sortItems<T>(items: T[], from: number, to: number) {
	if (from === to) return items;
	return items.toSpliced(from, 1).toSpliced(to < 0 ? items.length + to : to, 0, items[from]);
}

export function removeItem<T>(items: T[], index: SortableList.ItemProps['index']) {
	return items.toSpliced(index, 1);
}
