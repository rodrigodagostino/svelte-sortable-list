<script lang="ts">
	import { onMount } from 'svelte';
	import {
		SortableItem,
		SortableList,
		removeItem,
		sortItems,
		type DropEventDetail,
		type DragEndEventDetail,
	} from '$lib/index.js';
	import { interactiveItems, defaultProps } from '../fixtures.js';
	import { props } from '../stores.js';
	import '$lib/styles.css';

	let items = [...interactiveItems];

	onMount(() => {
		$props = { ...defaultProps };
	});

	function handleDrop(event: CustomEvent<DropEventDetail>) {
		const { draggedItemIndex, isBetweenBounds, canRemoveOnDropOut } = event.detail;
		if (!isBetweenBounds && canRemoveOnDropOut) items = removeItem(items, draggedItemIndex);
	}

	function handleDragEnd(event: CustomEvent<DragEndEventDetail>) {
		const { draggedItemIndex, targetItemIndex, isCanceled } = event.detail;
		if (!isCanceled && typeof targetItemIndex === 'number' && draggedItemIndex !== targetItemIndex)
			items = sortItems(items, draggedItemIndex, targetItemIndex);
	}
</script>

<svelte:head>
	<title>Interactive items | Svelte Sortable List</title>
</svelte:head>

<SortableList {...$props} on:drop={handleDrop} on:dragend={handleDragEnd}>
	{#each items as item, index (item.id)}
		<SortableItem {...item} {index}>
			<div class="ssl-item__content">
				{#if item.type === 'input'}
					<label for={item.id}>{item.text}</label>
					<input id={item.id} type="text" />
				{:else if item.type === 'textarea'}
					<label for={item.id}>{item.text}</label>
					<textarea id={item.id} />
				{:else if item.type === 'select'}
					<label for={item.id}>{item.text}</label>
					<select id={item.id} name={item.id}>
						<option value="">--Choose an option--</option>
						<option value="option-1">Option 1</option>
						<option value="option-2">Option 2</option>
						<option value="option-3">Option 3</option>
					</select>
				{:else if item.type === 'checkbox'}
					<fieldset>
						<legend>{item.text}</legend>
						<label for="option-1">
							<input type="checkbox" id="option-1" name="option-1" />
							Option 1
						</label>
						<label for="option-2">
							<input type="checkbox" id="option-2" name="option-2" />
							Option 2
						</label>
						<label for="option-3">
							<input type="checkbox" id="option-3" name="option-3" />
							Option 3
						</label>
					</fieldset>
				{:else if item.type === 'button'}
					<button class="button">{item.text}</button>
				{:else if item.type === 'a'}
					<a href="https://github.com/rodrigodagostino/svelte-sortable-list">{item.text}</a>
				{/if}
			</div>
		</SortableItem>
	{/each}
</SortableList>

<style lang="scss">
	label:not(:has(input[type='checkbox'])) {
		display: flex;
		flex-direction: column;
	}

	input[type='text'],
	textarea,
	select {
		width: 200px;
		padding: 0.25rem;
		margin-top: 0.25rem;
	}

	fieldset {
		display: flex;
		flex-direction: column;
		align-items: start;
		gap: 0.25rem;
		width: 200px;
		padding: 0.5rem 1rem 1rem 0.75rem;
		margin-inline: unset;
	}

	legend {
		padding-inline: 0.5rem;
	}

	button {
		text-transform: inherit;
	}
</style>
