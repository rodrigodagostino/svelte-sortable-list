import type { ItemRect } from '$lib/types/data-extraction.js';

export function isInSameRow(a: DOMRect | ItemRect, b: DOMRect | ItemRect) {
	return (
		(a.y >= b.y && a.y + a.height <= b.y + b.height) ||
		(a.y <= b.y && a.y + a.height >= b.y + b.height)
	);
}

// Thank you, Vojtech Miksu :)
// https://github.com/tajo/react-movable/blob/master/src/utils.ts
export function isOrResidesInInteractiveElement(target: HTMLElement, root: HTMLElement) {
	const INTERACTIVE_ELEMENTS = [
		'a',
		'audio',
		'button',
		'input',
		'optgroup',
		'option',
		'select',
		'textarea',
		'video',
	];
	const INTERACTIVE_ROLES = ['button', 'checkbox', 'link', 'tab'];

	while (target !== root) {
		if (target.dataset.role && target.dataset.role === 'handle') return false;
		if (INTERACTIVE_ELEMENTS.includes(target.tagName.toLowerCase())) return true;
		const role = target.getAttribute('role');
		if (role && INTERACTIVE_ROLES.includes(role.toLowerCase())) return true;
		if (target.tagName.toLowerCase() === 'label' && target.hasAttribute('for')) return true;

		if (target.tagName) target = target.parentElement!;
	}

	return false;
}
