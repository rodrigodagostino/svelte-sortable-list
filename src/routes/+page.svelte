<script lang="ts">
	import { SortableList, reorder } from '$lib/index.js';

	let items: { id: number; text: string }[] = [
		{
			id: 1,
			text: 'Item 1',
		},
		{
			id: 2,
			text: 'Item 2',
		},
		{
			id: 3,
			text: 'Item 3',
		},
		{
			id: 4,
			text: 'Item 4',
		},
	];

	function handleSort(event: CustomEvent) {
		const { oldIndex, newIndex } = event.detail;
		items = reorder(items, oldIndex, newIndex);
	}
</script>

<div class="container">
	<SortableList {items} key="id" let:item on:sort={handleSort}>
		{item.text}
	</SortableList>
</div>

<style lang="scss">
	.container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		min-height: 100vh;
	}

	:global(.sortable-list) {
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	:global(.sortable-item) {
		padding: 0.5rem 1rem;
		background-color: #eee;
		text-transform: uppercase;
		transition: background-color 0.24s;
	}

	:global(.sortable-item.is-target) {
		background-color: #bbb;
	}
</style>
