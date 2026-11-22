import type { CrossListModule } from '$lib/types/modules.js';

export function getDropAnimations(
	draggedItem: HTMLElement,
	list: HTMLUListElement,
	crossList: CrossListModule | undefined
) {
	const sourcePlaceholder = list?.querySelector<HTMLLIElement>(':scope > .ssl-placeholder');
	const targetPlaceholder = crossList?.targetList?.ref?.querySelector<HTMLLIElement>(
		':scope > .ssl-placeholder'
	);

	return [draggedItem, sourcePlaceholder, targetPlaceholder]
		.flatMap((element) => element?.getAnimations({ subtree: true }) ?? [])
		.filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity);
}
