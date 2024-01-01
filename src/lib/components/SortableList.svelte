<script lang="ts">
	export let items: Record<string, unknown>[];
	export let key: string = 'id';
</script>

<ul class="sortable-list">
	{#each items as item, index (item[key])}
		<li class="sortable-item" data-index={index}>
			<slot {item} {index} />
		</li>
	{/each}
</ul>

<style>
	.sortable-list {
		padding: 0;
	}

	.sortable-item {
		list-style: none;
	}
</style>
