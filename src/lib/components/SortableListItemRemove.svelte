<!--
@component
## <SortableList.ItemRemove>
Serves as a `<button>` element that (when pressed) removes an item. Including it inside a `<SortableList.Item>` will directly allow it to dispatch the `remove` event for that item.

### Props
- `ref`: reference to the remove element (HTMLButtonElement). `[$bindable]`

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
	import { getSortableListRootState } from '$lib/states/index.js';
	import type { SortableListItemRemoveProps as ItemRemoveProps } from '$lib/types/index.js';
	import { getIndex } from '$lib/utils/index.js';

	let { ref = $bindable(null), children, ...restProps }: ItemRemoveProps = $props();

	const rootState = getSortableListRootState();

	const classes = $derived(['ssl-item-remove', restProps.class]);

	function handleClick(e: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		if (rootState.focusedItem && rootState.ref) {
			const items = rootState.ref.querySelectorAll<HTMLLIElement>('.ssl-item');
			if (items.length > 1) {
				// Focus the next/previous item (if it exists) before removing.
				const step = getIndex(rootState.focusedItem) !== items.length - 1 ? 1 : -1;
				if (step === 1)
					(rootState.focusedItem.nextElementSibling as HTMLLIElement)?.focus({
						preventScroll: true,
					});
				else
					(rootState.focusedItem.previousElementSibling as HTMLLIElement)?.focus({
						preventScroll: true,
					});
			} else {
				// Focus the root element (if there are no items left) before removing.
				rootState.ref.focus();
			}
		}

		restProps.onclick?.(e);
	}
</script>

<button bind:this={ref} {...restProps} class={classes} onclick={handleClick}>
	{#if children}
		{@render children()}
	{:else}
		<Icon name="remove" />
	{/if}
</button>
