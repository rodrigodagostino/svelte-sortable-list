/**
 * Provides an easy mechanism to reorder items in a list
 * (should be used in combination with the `dragend` event).
 *
 * @param items List of items from which the item will be moved.
 * @param from Start position of the item to be moved.
 * @param to End position of the item to be moved.
 * @returns List of items with the moved item.
 *
 * @example
 * ```ts
 * const sortedItems = sortItems(items, from, to);
 * ```
 */
export function sortItems<T>(items: T[], from: number, to: number) {
	if (from === to) return items;
	return items.toSpliced(from, 1).toSpliced(to < 0 ? items.length + to : to, 0, items[from]);
}

/**
 * Provides an easy mechanism to insert an item coming from a peer list into a list
 * (should be used in combination with the `drop` event).
 *
 * @param items List of items into which the item will be inserted.
 * @param item The item to insert.
 * @param index Position at which the item will be inserted.
 * @returns List of items with the inserted item.
 *
 * @example
 * ```ts
 * const itemsWithInsertedItem = insertItem(items, item, index);
 * ```
 */
export function insertItem<T>(items: T[], item: T, index: number) {
	return items.toSpliced(index, 0, item);
}

/**
 * Provides an easy mechanism to remove an item from a list
 * (should be used in combination with the `drop` event).
 *
 * @param items List of items from which the item will be removed.
 * @param index Position of the item to be removed.
 * @returns List of items without the removed item.
 *
 * @example
 * ```ts
 * const itemsWithoutRemovedItem = removeItem(items, index);
 * ```
 */
export function removeItem<T>(items: T[], index: number) {
	return items.toSpliced(index, 1);
}
