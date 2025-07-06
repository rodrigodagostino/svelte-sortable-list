import type { Group } from '$lib/stores/index.js';
import type { ItemRect, TextDirection } from '$lib/types/index.js';
import { getTranslateValues } from './index.js';

export function getId(element: HTMLLIElement): string {
	return String(element.dataset.itemId);
}

export function getIndex(element: HTMLLIElement): number {
	return Number(element.dataset.itemIndex);
}

export function getItemRect(item: HTMLLIElement): ItemRect {
	const { x, y, width, height, top, right, bottom, left } = item.getBoundingClientRect();
	const itemTranslate = getTranslateValues(item);
	return {
		// Translate values are removed to create a reliable reference to the item’s position in the list
		// without the risk of catching in-between values while an item is translating.
		x: x - (itemTranslate?.x || 0),
		y: y - (itemTranslate?.y || 0),
		width,
		height,
		top: top - (itemTranslate?.y || 0),
		right: right - (itemTranslate?.x || 0),
		bottom: bottom - (itemTranslate?.y || 0),
		left: left - (itemTranslate?.x || 0),
		id: item.dataset.itemId!,
		index: Number(item.dataset.itemIndex),
	};
}

export function getGroupSelector(group: Group): string {
	if (group === undefined) {
		return ':not([data-group])';
	}
	return `[data-group=${group}]`;
}

export function getItemRects(group: Group, list: HTMLUListElement): ItemRect[] {
	return Array.from(
		list.querySelectorAll<HTMLLIElement>('.ssl-item' + getGroupSelector(group))
	).map((item) => getItemRect(item));
}

export const getTextDirection = (element: HTMLElement): TextDirection => {
	if (!element) return 'auto';

	let parent = element.parentElement;
	while (parent) {
		if (parent.getAttribute('dir')) return parent.getAttribute('dir') as TextDirection;
		parent = parent.parentElement;
	}

	return 'auto';
};

function preserveInputValue(source: HTMLInputElement, clone: HTMLInputElement): void {
	const type = source.type;
	const value = source.value;

	if (type === 'checkbox' || type === 'radio') {
		clone.checked = source.checked;
		if (source.checked) clone.setAttribute('checked', 'checked');
		else clone.removeAttribute('checked');

		return;
	}

	if (type === 'file') return;

	clone.value = value;
	if (value) clone.setAttribute('value', value);
}

function preserveSelectValue(source: HTMLSelectElement, clone: HTMLSelectElement): void {
	clone.value = source.value;

	const clonedOptions = clone.options;
	const originalOptions = source.options;
	const length = Math.min(clonedOptions.length, originalOptions.length);

	for (let i = 0; i < length; i++) {
		const clonedOption = clonedOptions[i];
		const originalOption = originalOptions[i];

		if (originalOption.selected) clonedOption.setAttribute('selected', 'selected');
		else clonedOption.removeAttribute('selected');
	}
}

function preserveTextareaValue(source: HTMLTextAreaElement, clone: HTMLTextAreaElement): void {
	const value = source.value;
	clone.value = value;
	clone.textContent = value;
}

export function preserveFormFieldValues(source: HTMLElement, clone: HTMLElement): void {
	const inputs = source.querySelectorAll<HTMLInputElement>('input');
	const selects = source.querySelectorAll<HTMLSelectElement>('select');
	const textareas = source.querySelectorAll<HTMLTextAreaElement>('textarea');

	if (!inputs.length && !selects.length && !textareas.length) return;

	const clonedInputs = clone.querySelectorAll<HTMLInputElement>('input');
	const clonedSelects = clone.querySelectorAll<HTMLSelectElement>('select');
	const clonedTextareas = clone.querySelectorAll<HTMLTextAreaElement>('textarea');

	for (let i = 0; i < inputs.length; i++) {
		const clonedInput = clonedInputs[i];
		if (clonedInput) preserveInputValue(inputs[i], clonedInput);
	}

	for (let i = 0; i < selects.length; i++) {
		const clonedSelect = clonedSelects[i];
		if (clonedSelect) preserveSelectValue(selects[i], clonedSelect);
	}

	for (let i = 0; i < textareas.length; i++) {
		const clonedTextarea = clonedTextareas[i];
		if (clonedTextarea) preserveTextareaValue(textareas[i], clonedTextarea);
	}
}
