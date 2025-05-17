<script lang="ts">
	import { getIsPointerDragging } from '$lib/stores/index.js';
	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	const isPointerDragging = getIsPointerDragging();
</script>

<span
	class="ssl-handle"
	style:cursor={$isPointerDragging ? 'grabbing' : 'grab'}
	data-role="handle"
	aria-hidden="true"
>
	{@render children?.()}
</span>

<style lang="scss">
	.ssl-handle {
		touch-action: none;
	}
</style>
