<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { getFocusedItem } from '$lib/stores/index.js';
	import { getIndex } from '$lib/utils/index.js';

	const focusedItem = getFocusedItem();

	function handleClick(event: Event) {
		const target = event.target as HTMLElement;
		const item = target.closest<HTMLLIElement>('.ssl-item');
		const list = item?.closest<HTMLUListElement>('.ssl-list');

		if ($focusedItem && list) {
			const items = list.querySelectorAll<HTMLLIElement>('.ssl-item');
			if (items.length > 1) {
				// Focus the next/previous item (if it exists) before removing.
				const step = getIndex($focusedItem) !== items.length - 1 ? 1 : -1;
				if (step === 1)
					($focusedItem.nextElementSibling as HTMLLIElement)?.focus({ preventScroll: true });
				else ($focusedItem.previousElementSibling as HTMLLIElement)?.focus({ preventScroll: true });
			} else {
				// Focus the list (if there are no items left) before removing.
				list.focus();
			}
		}
	}

	const classes = ['ssl-item-remove', ...($$restProps.class ? [$$restProps.class] : [])].join(' ');
</script>

<!--
@component
## Remove
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

<button data-role="remove" on:click={handleClick} on:click {...$$restProps} class={classes}>
	<slot>
		<Icon name="remove" />
	</slot>
</button>
