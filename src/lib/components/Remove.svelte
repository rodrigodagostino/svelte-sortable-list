<script lang="ts">
	import type { SortableItemProps } from '$lib/types/index.js';

	let removeRef: HTMLButtonElement;

	export let itemId: SortableItemProps['id'];

	function dispatch(name: string, detail: object) {
		const event = new CustomEvent(name, { bubbles: true, detail });
		removeRef.dispatchEvent(event);
	}
</script>

<button
	bind:this={removeRef}
	class="ssl-remove"
	data-role="remove"
	on:click|self={() => dispatch('removestart', { itemId })}
>
	<slot />
</button>
