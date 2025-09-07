<script lang="ts">
	import { onMount } from 'svelte';
	import { SortableList, removeItem, sortItems } from '$lib/index.js';
	import { defaultRootProps, getInteractiveItems } from '../fixtures.js';
	import layoutState from '../states.svelte.js';
	import '$lib/styles.css';

	let items = $state(getInteractiveItems());

	onMount(() => {
		layoutState.props = { ...defaultRootProps };
	});

	function handleDrop(e: SortableList.RootEvents['ondrop']) {
		const { draggedItemIndex, isBetweenBounds, canRemoveOnDropOut } = e;
		if (!isBetweenBounds && canRemoveOnDropOut) items = removeItem(items, draggedItemIndex);
	}

	function handleDragEnd(e: SortableList.RootEvents['ondragend']) {
		const { draggedItemIndex, targetItemIndex, isCanceled } = e;
		if (!isCanceled && typeof targetItemIndex === 'number' && draggedItemIndex !== targetItemIndex)
			items = sortItems(items, draggedItemIndex, targetItemIndex);
	}
</script>

<svelte:head>
	<title>Interactive items — Svelte Sortable List</title>
</svelte:head>

<SortableList.Root {...layoutState.props} ondrop={handleDrop} ondragend={handleDragEnd}>
	{#each items as item, index (item.id)}
		<SortableList.Item {...item} {index}>
			<div class="ssl-item-content">
				{#if item.type === 'input'}
					<div class="form-field">
						<label for="form-field-{item.id}">{item.text}</label>
						<input id="form-field-{item.id}" type="text" value={item.value} />
					</div>
				{:else if item.type === 'textarea'}
					<div class="form-field">
						<label for="form-field-{item.id}">{item.text}</label>
						<textarea id="form-field-{item.id}">{item.value}</textarea>
					</div>
				{:else if item.type === 'select'}
					<div class="form-field">
						<label for="form-field-{item.id}">{item.text}</label>
						<select id="form-field-{item.id}" name="form-field-{item.id}" value="option-2">
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
							<input type="checkbox" id="option-1" name="option-1" checked />
							Option 1
						</label>
						<label for="option-2">
							<input type="checkbox" id="option-2" name="option-2" checked />
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
		background-color: var(--ssl-white-rich);
	}

	input[type='checkbox'] {
		margin: revert;
	}

	fieldset {
		display: flex;
		flex-direction: column;
		align-items: start;
		gap: 0.25rem;
		width: 200px;
		padding: 0.5rem 1rem 1rem 0.75rem;
		margin-inline: unset;
		border: 0.125rem groove var(--ssl-gray-100);
	}

	legend {
		padding-inline: 0.5rem;
	}

	button {
		margin-inline: auto;
		text-transform: inherit;
	}
</style>
