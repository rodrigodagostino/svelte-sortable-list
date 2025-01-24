<script lang="ts">
	// Thank you, @ThomasJuster, @power-f-GOD and @tsmigiel :)
	// https://github.com/sveltejs/svelte/issues/3088#issuecomment-505785516
	import { onMount, onDestroy } from 'svelte';

	let ref: HTMLElement;

	onMount(() => {
		document.body.appendChild(ref);
		ref.hidden = false;
	});

	onDestroy(() => {
		let _ref = ref;
		setTimeout(() => {
			if (_ref?.parentNode) _ref.parentNode?.removeChild(_ref);
		});
	});
</script>

<div bind:this={ref} data-role="portal" hidden>
	<slot />
</div>
