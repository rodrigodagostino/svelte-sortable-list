<!--
@component
## <SortableList.ItemRemove>
Serves as a `<button>` element that (when pressed) removes an item. Including it inside a `<SortableList.Item>` will directly allow it to dispatch the `remove` event for that item.

### Usage
```svelte
	<SortableList.Item id={item.id} {index}>
		<div class="ssl-item-content">
			{item.text}
		</div>
		<SortableList.ItemRemove on:click={handleRemoveClick} />
	</SortableList.Item>
```
-->

<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { getFocusedItem, getRoot } from '$lib/stores/index.js';
	import { getIndex, joinCSSClasses } from '$lib/utils/index.js';

	$: classes = joinCSSClasses('ssl-item-remove', $$restProps.class);

	const root = getRoot();
	const focusedItem = getFocusedItem();

	function handleClick() {
		if ($focusedItem && $root) {
			const items = $root.querySelectorAll<HTMLLIElement>('.ssl-item');
			if (items.length > 1) {
				// Focus the next/previous item (if it exists) before removing.
				const step = getIndex($focusedItem) !== items.length - 1 ? 1 : -1;
				if (step === 1)
					($focusedItem.nextElementSibling as HTMLLIElement)?.focus({ preventScroll: true });
				else ($focusedItem.previousElementSibling as HTMLLIElement)?.focus({ preventScroll: true });
			} else {
				// Focus the root element (if there are no items left) before removing.
				$root.focus();
			}
		}
	}
</script>

<button {...$$restProps} class={classes} on:click={handleClick} on:click>
	<slot>
		<Icon name="remove" />
	</slot>
</button>
