import type { SortableListRegistry as Registry } from '$lib/states/index.js';

export function getDropAnimations(
	draggedItem: HTMLElement,
	list: HTMLUListElement,
	registry: Registry
) {
	const sourcePlaceholder = list?.querySelector<HTMLLIElement>(':scope > .ssl-placeholder');
	const targetPlaceholder = registry.targetList?.ref?.querySelector<HTMLLIElement>(
		':scope > .ssl-placeholder'
	);

	return [draggedItem, sourcePlaceholder, targetPlaceholder]
		.flatMap((element) => element?.getAnimations({ subtree: true }) ?? [])
		.filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity);
}
