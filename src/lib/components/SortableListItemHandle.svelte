<!--
@component
## <SortableList.ItemHandle>
Serves as an element that limits the draggable area of a list item to itself. Including it inside a `<SortableList.Item>` will directly activate the handle functionality for that item.

### Props
- `ref`: reference to the handle element (HTMLSpanElement). `[bindable]`

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
	import { joinCSSClasses } from '$lib/utils/styles.js';

	type $$Props = ItemHandleProps & { class?: string };

	export let ref: $$Props['ref'] = null;

	$: classes = joinCSSClasses('ssl-item-handle', $$restProps.class);
</script>

<span bind:this={ref} class={classes} aria-hidden="true">
	<slot>
		<Icon name="handle" />
	</slot>
</span>

<style>
	.ssl-item-handle {
		touch-action: none;
	}
</style>
