<script lang="ts">
	import { onMount } from 'svelte';
	import { SortableList, removeItem, sortItems } from '$lib/index.js';
	import { defaultRootProps, getDefaultItems } from '../fixtures.js';
	import { rootProps } from '../stores.js';
	import '$lib/styles.css';

	let items = getDefaultItems(5);

	onMount(() => {
		$rootProps = { ...defaultRootProps };
	});

	const announcements: SortableList.RootProps['announcements'] = {
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

	function handleDrop(e: SortableList.RootEvents['drop']) {
		const { draggedItemIndex, isBetweenBounds, canRemoveOnDropOut } = e.detail;
		if (!isBetweenBounds && canRemoveOnDropOut) items = removeItem(items, draggedItemIndex);
	}

	function handleDragEnd(e: SortableList.RootEvents['dragend']) {
		const { draggedItemIndex, targetItemIndex, isCanceled } = e.detail;
		if (!isCanceled && typeof targetItemIndex === 'number' && draggedItemIndex !== targetItemIndex)
			items = sortItems(items, draggedItemIndex, targetItemIndex);
	}
</script>

<svelte:head>
	<title>With custom announcements — Svelte Sortable List</title>
</svelte:head>

<SortableList.Root
	{...$rootProps}
	aria-description="Presione las flechas para desplazarte por los elementos de la lista. Presione Espacio para empezar a arrastrar un elemento. Al arrastrar, use las flechas para moverlo. Presione Espacio de nuevo para soltar el elemento o Escape para cancelar."
	{announcements}
	on:drop={handleDrop}
	on:dragend={handleDragEnd}
>
	{#each items as item, index (item.id)}
		<SortableList.Item {...item} {index}>
			<div class="ssl-item-content">
				<span class="ssl-item-content__text">{item.text}</span>
			</div>
		</SortableList.Item>
	{/each}
</SortableList.Root>
