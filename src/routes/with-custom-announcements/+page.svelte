<script lang="ts">
	import { onMount } from 'svelte';
	import {
		SortableItem,
		SortableList,
		removeItem,
		sortItems,
		type DropEventDetail,
		type DragEndEventDetail,
		type SortableListProps,
	} from '$lib/index.js';
	import { defaultItems, defaultProps } from '../fixtures.js';
	import { props } from '../stores.js';
	import '$lib/styles.css';

	let items = [...defaultItems];

	onMount(() => {
		$props = { ...defaultProps };
	});

	const announcements: SortableListProps['announcements'] = {
		lifted: (_, draggedItemIndex) => {
			return `Ha levantado un item en la posición ${draggedItemIndex! + 1}.`;
		},
		dragged: (_, draggedItemIndex, __, targetItemIndex) => {
			const startPosition = draggedItemIndex + 1;
			const endPosition = targetItemIndex + 1;
			const result =
				startPosition !== endPosition
					? `desde la posición ${startPosition} a la posición ${endPosition}`
					: `de vuelta a su posición inicial de ${startPosition}`;
			return `Ha movido el item ${result}.`;
		},
		dropped: (_, draggedItemIndex, __, targetItemIndex) => {
			const startPosition = draggedItemIndex + 1;
			const endPosition = typeof targetItemIndex === 'number' ? targetItemIndex + 1 : null;
			const result =
				endPosition === null
					? `Se ha mantenido en su posición inicial de ${startPosition}`
					: startPosition !== endPosition
						? `Se ha movido desde la posición ${startPosition} a la posición ${endPosition}`
						: `Ha vuelto a su posición inicial de ${startPosition}`;
			return `Ha soltado el item. ${result}.`;
		},
		canceled: (_, draggedItemIndex) => {
			return `Ha cancelado el arrastre. El item ha vuelto a su posición inicial de ${draggedItemIndex + 1}.`;
		},
	};

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
	<title>With custom announcements | Svelte Sortable List</title>
</svelte:head>

<SortableList
	{...$props}
	aria-description="Presione las flechas para desplazarte por los elementos de la lista. Presione Espacio para empezar a arrastrar un elemento. Al arrastrar, use las flechas para moverlo. Presione Espacio de nuevo para soltar el elemento o Escape para cancelar."
	{announcements}
	on:drop={handleDrop}
	on:dragend={handleDragEnd}
>
	{#each items as item, index (item.id)}
		<SortableItem {...item} {index}>
			<div class="ssl-content">
				<span class="ssl-content__text">{item.text}</span>
			</div>
		</SortableItem>
	{/each}
</SortableList>
