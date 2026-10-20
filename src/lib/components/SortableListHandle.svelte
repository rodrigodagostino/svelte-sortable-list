<!--
@component
## <SortableList.Handle>
Serves as an element that limits the draggable area of a list item to itself. Including it inside a `<SortableList.Item>` will directly activate the handle functionality for that item.

### Props
- `ref`: reference to the handle element (HTMLSpanElement). `[$bindable]`

### Usage
```svelte
	<SortableList.Item id={item.id} {index}>
		<SortableList.Handle />
		<div class="ssl-item-content">
			{item.text}
		</div>
	</SortableList.Item>
```
-->

<script lang="ts">
	import SortableListIcon from '$lib/components/SortableListIcon.svelte';
	import type { SortableListHandleProps as HandleProps } from '$lib/types/props.js';

	let {
		ref = $bindable(null),
		children,
		...restProps
	}: HandleProps & { class?: string } = $props();

	const classes = $derived(['ssl-handle', restProps.class]);
</script>

<span bind:this={ref} class={classes} aria-hidden="true">
	{#if children}
		{@render children()}
	{:else}
		<SortableListIcon name="handle" />
	{/if}
</span>
