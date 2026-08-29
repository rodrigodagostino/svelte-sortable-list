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
		.flatMap((element) => element?.getAnimations() ?? [])
		.filter(isDropAnimation);
}

const DROP_TRANSITION_PROPERTIES = ['transform', 'width', 'height', 'margin'];

function isDropAnimation(animation: Animation) {
	const { animationName, transitionProperty } = animation as Animation & {
		animationName?: string;
		transitionProperty?: string;
	};

	if (animation.effect?.getComputedTiming().iterations === Infinity) return false;
	if (animationName) return false;
	if (transitionProperty)
		return DROP_TRANSITION_PROPERTIES.some((property) => transitionProperty.startsWith(property));

	return true;
}
