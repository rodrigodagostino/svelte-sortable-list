<!--
@component
## Icon
Serves as an icon for the `<SortableList.ItemHandle>` and `<SortableList.ItemRemove>` components.

### Props
- `name`: name of the icon to display.

### Usage
```svelte
	<Icon name="handle" />
```
-->

<script lang="ts">
	import type { IconProps } from '$lib/types/props.js';

	let { name }: IconProps = $props();

	// Thank you, Lucide :)
	// https://lucide.dev
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	class="ssl-icon-{name}"
	height="18"
	viewBox="{name === 'handle' ? 4 : 0} 0 {name === 'handle' ? 16 : 24} 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	pointer-events="none"
>
	{#if name === 'handle'}
		<circle cx="9" cy="12" r="1" />
		<circle cx="9" cy="5" r="1" />
		<circle cx="9" cy="19" r="1" />
		<circle cx="15" cy="12" r="1" />
		<circle cx="15" cy="5" r="1" />
		<circle cx="15" cy="19" r="1" />
	{:else}
		<path d="M18 6 6 18" />
		<path d="m6 6 12 12" />
	{/if}
</svg>
