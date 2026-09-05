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
	import { getSortableListItemState, getSortableListRootState } from '$lib/states/index.js';
	import type { SortableListItemRemoveProps as ItemRemoveProps } from '$lib/types/index.js';

	let { ref = $bindable(null), children, ...restProps }: ItemRemoveProps = $props();

	const rootState = getSortableListRootState();
	const itemState = getSortableListItemState();

	const classes = $derived(['ssl-item-remove', restProps.class]);
	const ariaLabel = $derived(
		typeof itemState.props.index === 'number'
			? `Remove item at position ${itemState.props.index + 1}`
			: 'Remove item'
	);

	function handleClick(e: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		const { ref: itemRef, index } = itemState.props;
		if (rootState.focusedItem && itemRef && typeof index === 'number' && rootState.props.ref) {
			const items = rootState.props.ref.querySelectorAll<HTMLLIElement>('.ssl-item');
			if (items.length > 1) {
				// Focus the next/previous item (if it exists) before removing the current one.
				const step = index !== items.length - 1 ? 1 : -1;
				if (step === 1)
					(itemRef.nextElementSibling as HTMLLIElement)?.focus({ preventScroll: true });
				else (itemRef.previousElementSibling as HTMLLIElement)?.focus({ preventScroll: true });
			} else {
				// Focus the root element (if there are no items left) before removing the current item.
				rootState.props.ref.focus();
			}
		}

		restProps.onclick?.(e);
	}
</script>

<button bind:this={ref} aria-label={ariaLabel} {...restProps} class={classes} onclick={handleClick}>
	{#if children}
		{@render children()}
	{:else}
		<Icon name="remove" />
	{/if}
</button>
