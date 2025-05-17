<script lang="ts">
	import { getRootListContext } from '$lib/stores/index.js';

	interface Props {
		children?: import('svelte').Snippet;
		onRequestRemove?: (item: HTMLElement) => void;
	}

	let { children, onRequestRemove }: Props = $props();

	const rootContext = getRootListContext();

	function handleClick(event: MouseEvent) {
		const item = (event.target as HTMLElement)?.closest<HTMLLIElement>('.ssl-item');
		if (item != null) {
			onRequestRemove?.(item);
			$rootContext.handlers.requestRemove(item);
		}
	}
</script>

<button class="ssl-remove" data-role="remove" onclick={handleClick}>
	{@render children?.()}
</button>
