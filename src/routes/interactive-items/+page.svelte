<script lang="ts">
	import { onMount } from 'svelte';
	import { SortableList, removeItem, sortItems } from '$lib/index.js';
	import { interactiveItems, defaultProps } from '../fixtures.js';
	import { props } from '../stores.js';
	import '$lib/styles.css';

	let items = [...interactiveItems];

	onMount(() => {
		$props = { ...defaultProps };
	});

	function handleDrop(event: SortableList.RootEvents['drop']) {
		const { draggedItemIndex, isBetweenBounds, canRemoveOnDropOut } = event.detail;
		if (!isBetweenBounds && canRemoveOnDropOut) items = removeItem(items, draggedItemIndex);
	}

	function handleDragEnd(event: SortableList.RootEvents['dragend']) {
		const { draggedItemIndex, targetItemIndex, isCanceled } = event.detail;
		if (!isCanceled && typeof targetItemIndex === 'number' && draggedItemIndex !== targetItemIndex)
			items = sortItems(items, draggedItemIndex, targetItemIndex);
	}
</script>

<svelte:head>
	<title>Interactive items | Svelte Sortable List</title>
</svelte:head>

<SortableList.Root {...$props} on:drop={handleDrop} on:dragend={handleDragEnd}>
	{#each items as item, index (item.id)}
		<SortableList.Item {...item} {index}>
			<div class="ssl-item-content">
				{#if item.type === 'input'}
					<div class="form-field">
						<label for={item.id}>{item.text}</label>
						<input id={item.id} type="text" />
					</div>
				{:else if item.type === 'textarea'}
					<div class="form-field">
						<label for={item.id}>{item.text}</label>
						<textarea id={item.id} />
					</div>
				{:else if item.type === 'select'}
					<div class="form-field">
						<label for={item.id}>{item.text}</label>
						<select id={item.id} name={item.id}>
							<option value="">--Choose an option--</option>
							<option value="option-1">Option 1</option>
							<option value="option-2">Option 2</option>
							<option value="option-3">Option 3</option>
						</select>
					</div>
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
					<div class="form-field">
						<button class="button">{item.text}</button>
					</div>
				{:else if item.type === 'a'}
					<a
						class="ssl-item-content__text"
						href="https://github.com/rodrigodagostino/svelte-sortable-list">{item.text}</a
					>
				{/if}
			</div>
		</SortableList.Item>
	{/each}
</SortableList.Root>

<style>
	.form-field,
	fieldset {
		width: 100%;
		margin-block: 0.625rem;
	}

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
		margin-inline: auto;
		text-transform: inherit;
	}
</style>
