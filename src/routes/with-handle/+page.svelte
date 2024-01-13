<script lang="ts">
	import { SortableList, reorder } from '$lib/index.js';

	let items: { id: number; text: string }[] = [
		{
			id: 1,
			text: 'List item 1',
		},
		{
			id: 2,
			text: 'List item 2',
		},
		{
			id: 3,
			text: 'List item 3',
		},
		{
			id: 4,
			text: 'List item 4',
		},
		{
			id: 5,
			text: 'List item 5',
		},
	];

	function handleSort(event: CustomEvent) {
		const { oldIndex, newIndex } = event.detail;
		items = reorder(items, oldIndex, newIndex);
	}
</script>

<SortableList {items} key="id" let:item on:sort={handleSort}>
	<svg slot="handle" height="0.875rem" viewBox="0 0 320 512">
		<circle fill="currentColor" cx="80" cy="96" r="48" />
		<circle fill="currentColor" cx="240" cy="96" r="48" />
		<circle fill="currentColor" cx="80" cy="256" r="48" />
		<circle fill="currentColor" cx="240" cy="256" r="48" />
		<circle fill="currentColor" cx="80" cy="416" r="48" />
		<circle fill="currentColor" cx="240" cy="416" r="48" />
	</svg>
	<span>{item.text}</span>
</SortableList>
