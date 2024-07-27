<script lang="ts">
	import { getIsPointerDragging } from '$lib/stores/index.js';

	const isPointerDragging = getIsPointerDragging();
</script>

<div
	class="ssl-handle"
	style:cursor={$isPointerDragging ? 'grabbing' : 'grab'}
	data-role="handle"
	aria-hidden="true"
>
	<slot />
</div>
