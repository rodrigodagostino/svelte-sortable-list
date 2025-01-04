<script lang="ts">
	import { getIsPointerDragging } from '$lib/stores/index.js';

	const isPointerDragging = getIsPointerDragging();
</script>

<span
	class="ssl-handle"
	style:cursor={$isPointerDragging ? 'grabbing' : 'grab'}
	data-role="handle"
	aria-hidden="true"
>
	<slot />
</span>

<style lang="scss">
	.ssl-handle {
		touch-action: none;
	}
</style>
