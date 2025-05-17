<script lang="ts">
	import { dispatch } from '$lib/utils/index.js';
	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	function handleClick(event: Event) {
		const target = event.target as HTMLElement;
		dispatch(target, 'requestremove', { item: target.closest('.ssl-item') });
	}
</script>

<button class="ssl-remove" data-role="remove" onclick={handleClick}>
	{@render children?.()}
</button>
