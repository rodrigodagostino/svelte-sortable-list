<!--
@component
## <SortableList.ItemHandle>
Serves as an element that limits the draggable area of a list item to itself. Including it inside a `<SortableList.Item>` will directly activate the handle functionality for that item.

### Usage
```svelte
	<SortableList.Item id={item.id} {index}>
		<SortableList.ItemHandle />
		<div class="ssl-item-content">
			{item.text}
		</div>
	</SortableList.Item>
```
-->

<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { SortableListItemHandleProps as ItemHandleProps } from '$lib/types/props.js';

	let { children, ...restProps }: ItemHandleProps & { class?: string } = $props();

	const classes = $derived(['ssl-item-handle', restProps.class]);
</script>

<span class={classes} aria-hidden="true">
	{#if children}
		{@render children()}
	{:else}
		<Icon name="handle" />
	{/if}
</span>

<style>
	.ssl-item-handle {
		touch-action: none;
	}
</style>
