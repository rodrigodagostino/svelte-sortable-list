<!--
@component
## <SortableListIcon>
Serves as an icon for the `<SortableList.Handle>` and `<SortableList.Remover>` components.

### Props
- `name`: name of the icon to display.

### Usage
```svelte
	<SortableListIcon name="grip-vertical" />
```
-->

<script lang="ts">
	import type { IconProps } from '$lib/types/props.js';

	let { name }: IconProps = $props();
</script>

<!-- Thank you, Lucide :) -->
<!-- https://lucide.dev -->
<svg
	xmlns="http://www.w3.org/2000/svg"
	class="ssl-icon-{name}"
	height="18"
	viewBox="{name === 'grip-vertical' ? 4 : 0} 0 {name === 'grip-vertical' ? 16 : 24} 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	pointer-events="none"
	aria-hidden="true"
>
	{#if name === 'grip-vertical'}
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
