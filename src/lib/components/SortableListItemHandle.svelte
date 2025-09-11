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
	import { joinCSSClasses } from '$lib/utils/styles.js';

	$: classes = joinCSSClasses('ssl-item-handle', $$restProps.class);
</script>

<span class={classes} aria-hidden="true">
	<slot>
		<Icon name="handle" />
	</slot>
</span>

<style>
	.ssl-item-handle {
		touch-action: none;
	}
</style>
