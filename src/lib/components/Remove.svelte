<script lang="ts">
	import { dispatch } from '$lib/utils/index.js';

	function handleClick(event: Event) {
		const target = event.target as HTMLElement;
		dispatch(target, 'removestart', { item: target.closest('.ssl-item') });
	}
</script>

<button class="ssl-remove" data-role="remove" on:click={handleClick}>
	<slot />
</button>
