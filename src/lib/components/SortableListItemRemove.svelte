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
		<SortableList.ItemRemove onclick={handleRemoveClick} />
	</SortableList.Item>
```
-->

<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { getFocusedItem, getRoot } from '$lib/stores/index.js';
	import type { SortableListItemRemoveProps } from '$lib/types/props.js';
	import { getIndex, joinCSSClasses } from '$lib/utils/index.js';

	let { children, onclick, ...restProps }: SortableListItemRemoveProps & { class?: string } =
		$props();

	const classes = $derived(joinCSSClasses('ssl-item-remove', restProps.class));

	const root = getRoot();
	const focusedItem = getFocusedItem();

	function handleClick(e: MouseEvent) {
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

		onclick?.(e);
	}
</script>

<button class={classes} data-role="remove" onclick={handleClick}>
	{#if children}
		{@render children()}
	{:else}
		<Icon name="remove" />
	{/if}
</button>
