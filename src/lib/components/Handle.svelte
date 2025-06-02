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

<!--
@component
## Handle
Serves as an element that limits the draggable area of a list item to itself. Including it inside a `<SortableItem>` will directly activate the handle functionality for that item.

### Usage
```svelte
	<SortableItem id={item.id} {index}>
		<Handle />
		<div class="ssl-item__content">
			{item.text}
		</div>
	</SortableItem>
```
-->

<style>
	.ssl-handle {
		touch-action: none;
	}
</style>
