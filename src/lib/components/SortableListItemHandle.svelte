<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { getIsPointerDragging } from '$lib/stores/index.js';

	const isPointerDragging = getIsPointerDragging();

	const classes = ['ssl-item-handle', ...($$restProps.class ? [$$restProps.class] : [])].join(' ');
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

<style>
	.ssl-item-handle {
		touch-action: none;
	}
</style>
