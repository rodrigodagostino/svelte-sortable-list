import type { Action } from 'svelte/action';

export const portal: Action<HTMLDivElement> = (node) => {
	function update() {
		const target = node?.closest('dialog') || document.body;
		target.appendChild(node);
		node.hidden = false;
	}

	function destroy() {
		if (node?.parentNode) node.parentNode?.removeChild(node);
	}

	update();

	return {
		update,
		destroy,
	};
};
