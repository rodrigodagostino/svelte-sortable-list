<script lang="ts">
	let removeRef: HTMLButtonElement;

	function dispatch(name: string, detail: object) {
		const event = new CustomEvent(name, { bubbles: true, detail });
		removeRef.dispatchEvent(event);
	}
</script>

<button
	bind:this={removeRef}
	class="ssl-remove"
	data-role="remove"
	on:click={() => dispatch('removestart', { item: removeRef.closest('.ssl-item') })}
>
	<slot />
</button>
