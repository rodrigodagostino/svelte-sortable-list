<script lang="ts">
	import { onMount } from 'svelte';
	import { SortableList, removeItem, sortItems } from '$lib/index.js';
	import { defaultRootProps } from '../fixtures.js';
	import { rootProps } from '../stores.js';
	import '$lib/styles.css';

	let items = [
		{
			id: 'list-item-1',
			imgUrl:
				'https://images.pexels.com/photos/8488615/pexels-photo-8488615.jpeg?auto=compress&cs=tinysrgb&w=256&dpr=1',
		},
		{
			id: 'list-item-2',
			imgUrl:
				'https://images.pexels.com/photos/23452066/pexels-photo-23452066.jpeg?auto=compress&cs=tinysrgb&h=256&dpr=1',
		},
		{
			id: 'list-item-3',
			imgUrl:
				'https://images.pexels.com/photos/29758672/pexels-photo-29758672.jpeg?auto=compress&cs=tinysrgb&h=256&dpr=1',
		},
		{
			id: 'list-item-4',
			imgUrl:
				'https://images.pexels.com/photos/5492312/pexels-photo-5492312.jpeg?auto=compress&cs=tinysrgb&h=256&dpr=1',
		},
		{
			id: 'list-item-5',
			imgUrl:
				'https://images.pexels.com/photos/9952108/pexels-photo-9952108.jpeg?auto=compress&cs=tinysrgb&h=256&dpr=1',
		},
		{
			id: 'list-item-6',
			imgUrl:
				'https://images.pexels.com/photos/28989238/pexels-photo-28989238.jpeg?auto=compress&cs=tinysrgb&h=256&dpr=1',
		},
		{
			id: 'list-item-7',
			imgUrl:
				'https://images.pexels.com/photos/34201159/pexels-photo-34201159.jpeg?auto=compress&cs=tinysrgb&h=256&dpr=1',
		},
		{
			id: 'list-item-8',
			imgUrl:
				'https://images.pexels.com/photos/14278500/pexels-photo-14278500.jpeg?auto=compress&cs=tinysrgb&h=256&dpr=1',
		},
		{
			id: 'list-item-9',
			imgUrl:
				'https://images.pexels.com/photos/17685173/pexels-photo-17685173.jpeg?auto=compress&cs=tinysrgb&h=256&dpr=1',
		},
		{
			id: 'list-item-10',
			imgUrl:
				'https://images.pexels.com/photos/6900232/pexels-photo-6900232.jpeg?auto=compress&cs=tinysrgb&h=256&dpr=1',
		},
		{
			id: 'list-item-11',
			imgUrl:
				'https://images.pexels.com/photos/31665869/pexels-photo-31665869.jpeg?auto=compress&cs=tinysrgb&h=256&dpr=1',
		},
		{
			id: 'list-item-12',
			imgUrl:
				'https://images.pexels.com/photos/19281945/pexels-photo-19281945.jpeg?auto=compress&cs=tinysrgb&h=256&dpr=1',
		},
		{
			id: 'list-item-13',
			imgUrl:
				'https://images.pexels.com/photos/10686018/pexels-photo-10686018.jpeg?auto=compress&cs=tinysrgb&h=256&dpr=1',
		},
		{
			id: 'list-item-14',
			imgUrl:
				'https://images.pexels.com/photos/9709427/pexels-photo-9709427.jpeg?auto=compress&cs=tinysrgb&h=256&dpr=1',
		},
		{
			id: 'list-item-15',
			imgUrl:
				'https://images.pexels.com/photos/2247894/pexels-photo-2247894.png?auto=compress&cs=tinysrgb&h=256&dpr=1',
		},
		{
			id: 'list-item-16',
			imgUrl:
				'https://images.pexels.com/photos/7349943/pexels-photo-7349943.jpeg?auto=compress&cs=tinysrgb&h=256&dpr=1',
		},
		{
			id: 'list-item-17',
			imgUrl:
				'https://images.pexels.com/photos/32319724/pexels-photo-32319724.jpeg?auto=compress&cs=tinysrgb&h=256&dpr=1',
		},
		{
			id: 'list-item-18',
			imgUrl:
				'https://images.pexels.com/photos/7003379/pexels-photo-7003379.jpeg?auto=compress&cs=tinysrgb&h=256&dpr=1',
		},
		{
			id: 'list-item-19',
			imgUrl:
				'https://images.pexels.com/photos/11920066/pexels-photo-11920066.jpeg?auto=compress&cs=tinysrgb&h=256&dpr=1',
		},
		{
			id: 'list-item-20',
			imgUrl:
				'https://images.pexels.com/photos/29236962/pexels-photo-29236962.jpeg?auto=compress&cs=tinysrgb&h=256&dpr=1',
		},
		{
			id: 'list-item-21',
			imgUrl:
				'https://images.pexels.com/photos/2959714/pexels-photo-2959714.jpeg?auto=compress&cs=tinysrgb&h=256&dpr=1',
		},
	];

	onMount(() => {
		$rootProps = {
			...defaultRootProps,
			direction: 'horizontal',
			hasWrapping: true,
		};
	});

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
	<title>With handle — Svelte Sortable List</title>
</svelte:head>

<SortableList.Root {...$rootProps} on:drop={handleDrop} on:dragend={handleDragEnd}>
	{#each items as item, index (item.id)}
		<SortableList.Item {...item} {index}>
			<img class="ssl-item-image" src={item.imgUrl} alt="" />
		</SortableList.Item>
	{/each}
</SortableList.Root>

<style>
	:global([data-page-pathname='images']) {
		& .app-main .container {
			max-width: 60.5rem;
		}

		& .ssl-root {
			justify-content: center;
			align-items: center;
		}

		& .ssl-item[data-drag-state*='ptr-drag'] .ssl-item-image {
			opacity: 0.5;
		}
	}

	:global(.ssl-item[data-drag-state*='ptr-drag'][data-is-ghost='true'] .ssl-item-image),
	:global(.ssl-item[data-drag-state*='kbd-drag'] .ssl-item-image) {
		box-shadow: var(--ssl-box-shadow-2);
		transform: rotate3d(0, 0, 1, -10deg);
	}

	:global(.ssl-item-image) {
		width: 8rem;
		height: 8rem;
		border-radius: 0.25rem;
		object-fit: cover;
		transform: rotate3d(0, 0, 0, 0deg);
		transition:
			box-shadow var(--ssl-transition-duration),
			transform var(--ssl-transition-duration),
			opacity var(--ssl-transition-duration);
	}
</style>
