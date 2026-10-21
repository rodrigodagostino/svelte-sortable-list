<script lang="ts">
	import { onMount } from 'svelte';
	import { SortableList, removeItem, sortItems } from '$lib/index.js';
	import { defaultRootProps, getDefaultItems } from '../fixtures.js';
	import layoutState from '../states.svelte.js';
	import '$lib/styles.css';

	let items = $state(getDefaultItems(5));

	onMount(() => {
		layoutState.props = { ...defaultRootProps };
	});

	const announcements: SortableList.RootProps['announcements'] = {
		lifted: ({ draggedItemIndex, draggedItemType }) => {
			const subject = draggedItemType === 'list' ? 'una lista' : 'un ítem';
			return `Has levantado ${subject} en la posición ${draggedItemIndex + 1}.`;
		},

		dragged: ({
			sourceList,
			sourceListIndex,
			draggedItemIndex,
			draggedItemType,
			targetList,
			targetListIndex,
			targetItemIndex,
		}) => {
			const startPosition = draggedItemIndex + 1;
			const endPosition = targetItemIndex + 1;
			const hasCrossedList = !!targetList && targetList !== sourceList;
			const subject = draggedItemType === 'list' ? 'la lista' : 'el ítem';

			if (hasCrossedList)
				return `Has movido ${subject} de la posición ${startPosition} en la lista ${sourceListIndex! + 1} a la posición ${endPosition} en la lista ${targetListIndex! + 1}.`;

			const result =
				startPosition !== endPosition
					? `desde la posición ${startPosition} a la posición ${endPosition}`
					: `de vuelta a su posición inicial de ${startPosition}`;

			return `Has movido ${subject} ${result}.`;
		},

		dropped: ({
			sourceList,
			sourceListIndex,
			draggedItemIndex,
			draggedItemType,
			targetList,
			targetListIndex,
			targetItemIndex,
		}) => {
			const startPosition = draggedItemIndex + 1;
			const endPosition = typeof targetItemIndex === 'number' ? targetItemIndex + 1 : null;
			const hasCrossedList = !!targetList && targetList !== sourceList;
			const subject = draggedItemType === 'list' ? 'la lista' : 'el ítem';

			if (hasCrossedList)
				return `Has soltado ${subject}. Se ha movido de la posición ${startPosition} en la lista ${sourceListIndex! + 1} a la posición ${endPosition} en la lista ${targetListIndex! + 1}.`;

			const result =
				endPosition === null
					? `Se ha mantenido en su posición inicial de ${startPosition}`
					: startPosition !== endPosition
						? `Se ha movido desde la posición ${startPosition} a la posición ${endPosition}`
						: `Ha vuelto a su posición inicial de ${startPosition}`;

			return `Has soltado ${subject}. ${result}.`;
		},

		canceled: ({ draggedItemIndex, draggedItemType }) => {
			const subject = draggedItemType === 'list' ? 'La lista' : 'El ítem';

			return `Has cancelado el arrastre. ${subject} ha vuelto a su posición inicial de ${draggedItemIndex + 1}.`;
		},
	};

	const ariaDescription = $derived.by(() => {
		const isVertical = layoutState.props.direction === 'vertical';
		const arrowKeys = isVertical
			? 'Flecha Arriba o Flecha Abajo'
			: 'Flecha Izquierda o Flecha Derecha';

		return `Presiona ${arrowKeys} para moverte por los ítems. Presiona Espacio para empezar a arrastrar un ítem. Al arrastrar, usa ${arrowKeys} para mover el ítem. Presiona Espacio de nuevo para soltar el ítem, o Escape para cancelar.`;
	});

	function handleDrop(e: SortableList.RootEvents['ondrop']) {
		const { draggedItemIndex, isWithinBounds, canRemoveOnDropOut } = e;
		if (!isWithinBounds && canRemoveOnDropOut) items = removeItem(items, draggedItemIndex);
	}

	function handleDragEnd(e: SortableList.RootEvents['ondragend']) {
		const { draggedItemIndex, targetItemIndex, isCanceled } = e;
		if (!isCanceled && typeof targetItemIndex === 'number' && draggedItemIndex !== targetItemIndex)
			items = sortItems(items, draggedItemIndex, targetItemIndex);
	}
</script>

<svelte:head>
	<title>Custom announcements — Svelte Sortable List</title>
</svelte:head>

<SortableList.Root
	{...layoutState.props}
	aria-description={ariaDescription}
	{announcements}
	ondrop={handleDrop}
	ondragend={handleDragEnd}
>
	{#each items as item, index (item.id)}
		<SortableList.Item {...item} {index}>
			<div class="ssl-item-content">
				<span class="ssl-item-content__text">{item.text}</span>
			</div>
		</SortableList.Item>
	{/each}
</SortableList.Root>
