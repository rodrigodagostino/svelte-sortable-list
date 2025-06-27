import type { ItemRect } from '$lib/types/data-extraction.js';

export function isInSameRow(a: DOMRect | ItemRect, b: DOMRect | ItemRect) {
	return (
		(a.y >= b.y && a.y + a.height <= b.y + b.height) ||
		(a.y <= b.y && a.y + a.height >= b.y + b.height)
	);
}

const INTERACTIVE_ELEMENTS = new Set([
	'a',
	'audio',
	'button',
	'input',
	'optgroup',
	'option',
	'select',
	'textarea',
	'video',
]);
const INTERACTIVE_ROLES = new Set(['button', 'checkbox', 'link', 'tab']);

// Thank you, Vojtech Miksu :)
// https://github.com/tajo/react-movable/blob/master/src/utils.ts
export function isOrResidesInInteractiveElement(target: HTMLElement, root: HTMLElement) {
	while (target !== root) {
		if (target.dataset.role && target.dataset.role === 'handle') return false;

		const tagName = target.tagName.toLowerCase();
		if (INTERACTIVE_ELEMENTS.has(tagName)) return true;

		const role = target.getAttribute('role')?.toLowerCase();
		if (role && INTERACTIVE_ROLES.has(role)) return true;

		if (tagName === 'label' && target.hasAttribute('for')) return true;

		if (tagName) target = target.parentElement!;
	}

	return false;
}
