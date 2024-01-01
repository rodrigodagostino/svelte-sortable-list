<script lang="ts">
	import { SortableItem, SortableList } from '$lib/index.js';

	let items = [
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
</script>

<SortableList>
	{#each items as item (item.id)}
		<SortableItem>
			{item.text}
		</SortableItem>
	{/each}
</SortableList>
