import type { Attachment } from 'svelte/attachments';

export const portal: Attachment<HTMLElement> = (element) => {
	const target = element?.closest<HTMLDialogElement>('dialog') || document.body;
	target.appendChild(element);
	element.hidden = false;

	return () => {
		if (element?.parentNode) element.parentNode?.removeChild(element);
	};
};
