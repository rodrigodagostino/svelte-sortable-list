<script lang="ts">
	import { version } from '$app/environment';
	import { page } from '$app/stores';
	import { rootProps } from './stores.js';
	import { toKebabCase } from './utils.js';
	import './styles.css';

	let isMenuExpanded = false;
	let isControlsExpanded = false;

	const links = [
		{ text: 'Basic', path: '/' },
		{ text: 'Unstyled', path: '/unstyled' },
		{ text: 'No animations', path: '/no-animations' },
		{ text: 'Direction horizontal', path: '/direction-horizontal' },
		{ text: 'Varying heights', path: '/varying-heights' },
		{ text: 'With handle', path: '/with-handle' },
		{ text: 'With drop marker', path: '/with-drop-marker' },
		{ text: 'With custom transitions', path: '/with-custom-transitions' },
		{ text: 'With wrapping', path: '/with-wrapping' },
		{ text: 'With boundaries', path: '/with-boundaries' },
		{ text: 'With locked axis', path: '/with-locked-axis' },
		{ text: 'With custom announcements', path: '/with-custom-announcements' },
		{ text: 'Dynamic items', path: '/dynamic-items' },
		{ text: 'Interactive items', path: '/interactive-items' },
		{ text: 'Auto scrolling', path: '/auto-scrolling' },
		{ text: 'Auto scrolling container', path: '/auto-scrolling-container' },
		{ text: 'Auto scrolling dialog', path: '/auto-scrolling-dialog' },
		{ text: 'Locked list', path: '/locked-list' },
		{ text: 'Locked items', path: '/locked-items' },
		{ text: 'Disabled list', path: '/disabled-list' },
		{ text: 'Disabled items', path: '/disabled-items' },
		{ text: 'Inside dialog', path: '/inside-dialog' },
		{ text: 'Inside custom dialog', path: '/inside-custom-dialog' },
		{ text: 'Clear target on drag out', path: '/clear-target-on-drag-out' },
		{ text: 'Remove item on drop out', path: '/remove-item-on-drop-out' },
		{ text: 'RTL', path: '/rtl' },
	];

	$: controls = Object.keys($rootProps).map((key) => ({
		label: key,
		type:
			key === 'gap'
				? 'number'
				: key === 'transition'
					? 'textarea'
					: key === 'direction'
						? 'select'
						: 'checkbox',
		id: toKebabCase(key),
		...(key === 'gap' || key === 'transitionDuration' ? { min: 0 } : {}),
		...(key === 'direction' ? { options: ['vertical', 'horizontal'] } : {}),
		value: $rootProps[key as never],
	}));

	function handleFieldChange(event: Event) {
		const target = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
		const { type, name, value } = target;
		$rootProps = {
			...$rootProps,
			[name]:
				type === 'checkbox'
					? (target as HTMLInputElement).checked
					: type === 'number'
						? Number(value)
						: type === 'textarea'
							? JSON.parse(value)
							: value,
		};
	}
</script>

<svelte:window
	on:keydown={(event) => {
		const { key } = event;
		if (key === 'Escape') {
			isMenuExpanded = false;
			isControlsExpanded = false;
		}
	}}
	on:resize={() => {
		isMenuExpanded = false;
		isControlsExpanded = false;
	}}
/>

<div id="app" class="app" data-page-pathname={$page.url.pathname.replace('/', '')}>
	<button
		class="app-nav-toggle button"
		aria-controls="app-nav"
		aria-expanded={isMenuExpanded}
		on:click={() => (isMenuExpanded = !isMenuExpanded)}
	>
		{#if isMenuExpanded}
			<svg
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M18 6 6 18" />
				<path d="m6 6 12 12" />
			</svg>
		{:else}
			<svg
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M4 12h16" />
				<path d="M4 18h16" />
				<path d="M4 6h16" />
			</svg>
		{/if}
		<span class="sr-only">{isMenuExpanded ? 'Hide menu' : 'Show menu'}</span>
	</button>
	<nav id="app-nav" class="app-nav" aria-hidden={!isMenuExpanded} inert={!isMenuExpanded}>
		<div class="container">
			<a
				class="link link--github"
				href="https://github.com/rodrigodagostino/svelte-sortable-list"
				target="_blank"
			>
				<span class="sr-only">Visit the GitHub repository</span>
				<svg
					width="24"
					height="24"
					fill="currentColor"
					aria-hidden="true"
					data-view-component="true"
					viewBox="0 0 24 24"
				>
					<path
						d="M12.5.75C6.146.75 1 5.896 1 12.25c0 5.089 3.292 9.387 7.863 10.91.575.101.79-.244.79-.546 0-.273-.014-1.178-.014-2.142-2.889.532-3.636-.704-3.866-1.35-.13-.331-.69-1.352-1.18-1.625-.402-.216-.977-.748-.014-.762.906-.014 1.553.834 1.769 1.179 1.035 1.74 2.688 1.25 3.349.948.1-.747.402-1.25.733-1.538-2.559-.287-5.232-1.279-5.232-5.678 0-1.25.445-2.285 1.178-3.09-.115-.288-.517-1.467.115-3.048 0 0 .963-.302 3.163 1.179.92-.259 1.897-.388 2.875-.388.977 0 1.955.13 2.875.388 2.2-1.495 3.162-1.179 3.162-1.179.633 1.581.23 2.76.115 3.048.733.805 1.179 1.825 1.179 3.09 0 4.413-2.688 5.39-5.247 5.678.417.36.776 1.05.776 2.128 0 1.538-.014 2.774-.014 3.162 0 .302.216.662.79.547C20.709 21.637 24 17.324 24 12.25 24 5.896 18.854.75 12.5.75Z"
					/>
				</svg>
				<span>v{version}</span>
			</a>
			<hr class="separator" />
			{#each links as { text, path }}
				<a class="link" href={path} aria-current={$page.url.pathname === path ? 'page' : undefined}>
					{text}
				</a>
			{/each}
		</div>
	</nav>
	<button
		class="app-controls-toggle button"
		aria-controls="app-controls"
		aria-expanded={isControlsExpanded}
		on:click={() => (isControlsExpanded = !isControlsExpanded)}
	>
		{#if isControlsExpanded}
			<svg
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M18 6 6 18" />
				<path d="m6 6 12 12" />
			</svg>
		{:else}
			<svg
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<line x1="21" x2="14" y1="4" y2="4" />
				<line x1="10" x2="3" y1="4" y2="4" />
				<line x1="21" x2="12" y1="12" y2="12" />
				<line x1="8" x2="3" y1="12" y2="12" />
				<line x1="21" x2="16" y1="20" y2="20" />
				<line x1="12" x2="3" y1="20" y2="20" />
				<line x1="14" x2="14" y1="2" y2="6" />
				<line x1="8" x2="8" y1="10" y2="14" />
				<line x1="16" x2="16" y1="18" y2="22" />
			</svg>
		{/if}
		<span class="sr-only">{isControlsExpanded ? 'Hide controls' : 'Show controls'}</span>
	</button>
	<aside
		id="app-controls"
		class="app-controls"
		aria-hidden={!isControlsExpanded}
		inert={!isControlsExpanded}
	>
		<div class="container">
			<table>
				<thead>
					<tr>
						<th></th>
						<th>Prop</th>
						<th>Value</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each controls as { id, type, label, min, options, value }}
						<tr>
							<td></td>
							<td><label for={id}>{label}</label></td>
							<td>
								{#if type === 'number'}
									<input
										{id}
										type="number"
										name={label}
										{min}
										{value}
										on:input={handleFieldChange}
									/>
								{:else if type === 'textarea'}
									<textarea
										{id}
										name={label}
										rows="4"
										style="white-space: nowrap"
										value={JSON.stringify(value, null, 2)}
										on:input={handleFieldChange}
									></textarea>
								{:else if type === 'select'}
									<select {id} name={label} {value} on:change={handleFieldChange}>
										{#if options}
											{#each options as option}
												<option value={option}>{option}</option>
											{/each}
										{/if}
									</select>
								{:else if type === 'checkbox'}
									<input
										{id}
										type="checkbox"
										name={label}
										checked={value}
										on:change={handleFieldChange}
									/>
								{/if}
							</td>
							<td></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</aside>
	<main class="app-main">
		<div class="container">
			<slot />
		</div>
	</main>
</div>

<style>
	.app {
		width: 100%;
		min-height: 100vh;
		min-height: 100svh;
	}

	.container {
		display: flex;
		flex-direction: column;
		max-width: 100%;
		margin: auto;
	}

	.app-nav-toggle {
		position: fixed;
		top: 1rem;
		right: 1rem;
		z-index: 21;

		@media (min-width: 48em) {
			top: 1.5rem;
			right: 1.5rem;
		}
	}

	.app-nav {
		display: flex;
		flex-direction: column;
		max-height: calc(100vh - 1.5rem);
		max-height: calc(100dvh - 1.5rem);
		background-color: var(--ssl-gray-500);
		box-shadow: var(--ssl-box-shadow-4);
		position: fixed;
		top: 0.75rem;
		right: 0.75rem;
		z-index: 20;

		@media (min-width: 48em) {
			max-height: calc(100vh - 2.5rem);
			max-height: calc(100dvh - 2.5rem);
			top: 1.25rem;
			right: 1.25rem;
		}

		& .container {
			align-items: start;
			gap: 0.75rem;
			padding: 3rem 2rem;
			overflow: auto;
			mask-image: linear-gradient(
				to bottom,
				transparent 0,
				black 3rem,
				black calc(100% - 3rem),
				transparent 100%
			);
		}

		&[aria-hidden='true'] {
			visibility: hidden;
			opacity: 0;
			transition:
				opacity 240ms,
				visibility 0s 240ms;
		}

		&[aria-hidden='false'] {
			visibility: visible;
			opacity: 1;
			transition: opacity 240ms;
		}
	}

	.link {
		color: var(--ssl-gray-100);
		text-decoration: none;

		&:focus,
		&:hover {
			color: var(--ssl-white-rich);
		}

		&[aria-current='page'] {
			font-weight: 700;
			color: var(--ssl-white-rich);
		}
	}

	.link--github {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
	}

	.separator {
		width: 100%;
		margin-block: 0.25rem;
		border-style: solid;
		color: var(--ssl-gray-400);
	}

	.app-controls-toggle {
		position: fixed;
		bottom: 1rem;
		right: 1rem;
		z-index: 11;

		@media (min-width: 48em) {
			bottom: 1.5rem;
			right: 1.5rem;
		}
	}

	.app-controls {
		display: flex;
		flex-direction: column;
		max-width: calc(100% - 1.5rem);
		max-height: calc(100% - 1.5rem);
		background-color: var(--ssl-white);
		box-shadow: var(--ssl-box-shadow-4);
		position: fixed;
		right: 0.75rem;
		bottom: 0.75rem;
		z-index: 10;

		@media (min-width: 48em) {
			bottom: 1.25rem;
			right: 1.25rem;
		}

		&[aria-hidden='true'] {
			visibility: hidden;
			opacity: 0;
			transition:
				opacity 240ms,
				visibility 0s 240ms;
		}

		&[aria-hidden='false'] {
			visibility: visible;
			opacity: 1;
			transition: opacity 240ms;
		}

		& .container {
			overflow: auto;
		}

		& table {
			border-collapse: collapse;
			max-width: 100%;
			margin-block: 0.5rem;

			@media (min-width: 26em) {
				table-layout: auto;
			}
		}

		& tr:nth-child(odd) td {
			background-color: var(--ssl-gray-100);
		}

		& th:not(:first-child):not(:last-child),
		& td:not(:first-child):not(:last-child) {
			padding: 0.625rem 1.25rem;
		}

		& th {
			border-bottom: 1px solid var(--ssl-gray-200);
			text-align: start;

			&:nth-child(3) {
				width: 44%;
			}

			&:first-child,
			&:last-child {
				width: 0;

				@media (min-width: 26em) {
					width: 50%;
				}
			}
		}

		& td {
			font-family: monospace;
		}

		& input:not([type='checkbox']),
		& select {
			width: 7.75rem;
			max-width: 100%;
			padding: 0.25rem 0.25rem 0.25rem 0.5rem;
			border-radius: 0.25rem;
		}
	}

	.app-main {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: 1fr;
		min-height: 100%;
		padding: 3rem;
		scrollbar-gutter: stable;

		& .container {
			align-items: center;
		}
	}
</style>
