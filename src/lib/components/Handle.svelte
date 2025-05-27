<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { getIsPointerDragging } from '$lib/stores/index.js';

	const isPointerDragging = getIsPointerDragging();

	const classes = ['ssl-handle', ...($$restProps.class ? [$$restProps.class] : [])].join(' ');
</script>

<span
	style:cursor={$isPointerDragging ? 'grabbing' : 'grab'}
	data-role="handle"
	aria-hidden="true"
	{...$$restProps}
	class={classes}
>
	<slot>
		<Icon name="handle" />
	</slot>
</span>

<style>
	.ssl-handle {
		touch-action: none;
	}
</style>
