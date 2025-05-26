<script lang="ts">
	import { version } from '$app/environment';
	import { page } from '$app/stores';
	import { props } from './stores.js';
	import './styles.css';

	let isMenuExpanded = false;
	let isControlsExpanded = false;
</script>

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
			<span class="sr-only">Hide menu</span>
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
			<span class="sr-only">Show menu</span>
		{/if}
	</button>
	<nav id="app-nav" class="app-nav" aria-hidden={!isMenuExpanded} inert={!isMenuExpanded}>
		<div class="container">
			<a
				class="app-nav__link app-nav__link--github"
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
			<hr class="app-nav__separator" />
			<a
				class="app-nav__link"
				href="/"
				aria-current={$page.url.pathname === '/' ? 'page' : undefined}
			>
				Basic
			</a>
			<a
				class="app-nav__link"
				href="/unstyled"
				aria-current={$page.url.pathname === '/unstyled' ? 'page' : undefined}
				data-sveltekit-reload
			>
				Unstyled
			</a>
			<a
				class="app-nav__link"
				href="/no-animations"
				aria-current={$page.url.pathname === '/no-animations' ? 'page' : undefined}
			>
				No animations
			</a>
			<a
				class="app-nav__link"
				href="/direction-horizontal"
				aria-current={$page.url.pathname === '/direction-horizontal' ? 'page' : undefined}
			>
				Direction horizontal
			</a>
			<a
				class="app-nav__link"
				href="/varying-heights"
				aria-current={$page.url.pathname === '/varying-heights' ? 'page' : undefined}
			>
				Varying heights
			</a>
			<a
				class="app-nav__link"
				href="/with-handle"
				aria-current={$page.url.pathname === '/with-handle' ? 'page' : undefined}
			>
				With handle
			</a>
			<a
				class="app-nav__link"
				href="/with-drop-marker"
				aria-current={$page.url.pathname === '/with-drop-marker' ? 'page' : undefined}
			>
				With drop marker
			</a>
			<a
				class="app-nav__link"
				href="/with-boundaries"
				aria-current={$page.url.pathname === '/with-boundaries' ? 'page' : undefined}
			>
				With boundaries
			</a>
			<a
				class="app-nav__link"
				href="/with-locked-axis"
				aria-current={$page.url.pathname === '/with-locked-axis' ? 'page' : undefined}
			>
				With locked axis
			</a>
			<a
				class="app-nav__link"
				href="/dynamic-items"
				aria-current={$page.url.pathname === '/dynamic-items' ? 'page' : undefined}
			>
				Dynamic items
			</a>
			<a
				class="app-nav__link"
				href="/interactive-items"
				aria-current={$page.url.pathname === '/interactive-items' ? 'page' : undefined}
			>
				Interactive items
			</a>
			<a
				class="app-nav__link"
				href="/auto-scrolling"
				aria-current={$page.url.pathname === '/auto-scrolling' ? 'page' : undefined}
			>
				Auto scrolling
			</a>
			<a
				class="app-nav__link"
				href="/auto-scrolling-container"
				aria-current={$page.url.pathname === '/auto-scrolling-container' ? 'page' : undefined}
			>
				Auto scrolling container
			</a>
			<a
				class="app-nav__link"
				href="/auto-scrolling-dialog"
				aria-current={$page.url.pathname === '/auto-scrolling-dialog' ? 'page' : undefined}
			>
				Auto scrolling dialog
			</a>
			<a
				class="app-nav__link"
				href="/locked-list"
				aria-current={$page.url.pathname === '/locked-list' ? 'page' : undefined}
			>
				Locked list
			</a>
			<a
				class="app-nav__link"
				href="/locked-items"
				aria-current={$page.url.pathname === '/locked-items' ? 'page' : undefined}
			>
				Locked items
			</a>
			<a
				class="app-nav__link"
				href="/disabled-list"
				aria-current={$page.url.pathname === '/disabled-list' ? 'page' : undefined}
			>
				Disabled list
			</a>
			<a
				class="app-nav__link"
				href="/disabled-items"
				aria-current={$page.url.pathname === '/disabled-items' ? 'page' : undefined}
			>
				Disabled items
			</a>
			<a
				class="app-nav__link"
				href="/inside-dialog"
				aria-current={$page.url.pathname === '/inside-dialog' ? 'page' : undefined}
			>
				Inside dialog
			</a>
			<a
				class="app-nav__link"
				href="/inside-custom-dialog"
				aria-current={$page.url.pathname === '/inside-custom-dialog' ? 'page' : undefined}
			>
				Inside custom dialog
			</a>
			<a
				class="app-nav__link"
				href="/clear-target-on-drag-out"
				aria-current={$page.url.pathname === '/clear-target-on-drag-out' ? 'page' : undefined}
			>
				Clear target on drag out
			</a>
			<a
				class="app-nav__link"
				href="/remove-item-on-drop-out"
				aria-current={$page.url.pathname === '/remove-item-on-drop-out' ? 'page' : undefined}
			>
				Remove item on drop out
			</a>
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
			<span class="sr-only">Hide controls</span>
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
			<span class="sr-only">Show controls</span>
		{/if}
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
					<tr>
						<td></td>
						<td><label for="gap">gap</label></td>
						<td><input id="gap" type="number" min="0" bind:value={$props.gap} /></td>
						<td></td>
					</tr>
					<tr>
						<td></td>
						<td><label for="direction">direction</label></td>
						<td>
							<select id="direction" bind:value={$props.direction}>
								<option value="vertical">vertical</option>
								<option value="horizontal">horizontal</option>
							</select>
						</td>
						<td></td>
					</tr>
					<tr>
						<td></td>
						<td><label for="transition-duration">transitionDuration</label></td>
						<td>
							<input
								id="transition-duration"
								type="number"
								min="0"
								bind:value={$props.transitionDuration}
							/>
						</td>
						<td></td>
					</tr>
					<tr>
						<td></td>
						<td><label for="has-drop-marker">hasDropMarker</label></td>
						<td>
							<input id="has-drop-marker" type="checkbox" bind:checked={$props.hasDropMarker} />
						</td>
						<td></td>
					</tr>
					<tr>
						<td></td>
						<td><label for="has-locked-axis">hasLockedAxis</label></td>
						<td>
							<input id="has-locked-axis" type="checkbox" bind:checked={$props.hasLockedAxis} />
						</td>
						<td></td>
					</tr>
					<tr>
						<td></td>
						<td><label for="has-boundaries">hasBoundaries</label></td>
						<td>
							<input id="has-boundaries" type="checkbox" bind:checked={$props.hasBoundaries} />
						</td>
						<td></td>
					</tr>
					<tr>
						<td></td>
						<td><label for="can-clear-on-drag-out">canClearOnDragOut</label></td>
						<td>
							<input
								id="can-clear-on-drag-out"
								type="checkbox"
								bind:checked={$props.canClearOnDragOut}
							/>
						</td>
						<td></td>
					</tr>
					<tr>
						<td></td>
						<td><label for="can-remove-on-drop-out">canRemoveOnDropOut</label></td>
						<td>
							<input
								id="can-remove-on-drop-out"
								type="checkbox"
								bind:checked={$props.canRemoveOnDropOut}
							/>
						</td>
						<td></td>
					</tr>
					<tr>
						<td></td>
						<td><label for="is-locked">isLocked</label></td>
						<td>
							<input id="is-locked" type="checkbox" bind:checked={$props.isLocked} />
						</td>
						<td></td>
					</tr>
					<tr>
						<td></td>
						<td><label for="is-disabled">isDisabled</label></td>
						<td>
							<input id="is-disabled" type="checkbox" bind:checked={$props.isDisabled} />
						</td>
						<td></td>
					</tr>
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

<style lang="scss">
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
	}

	.app-nav {
		max-height: calc(100vh - 1.5rem);
		max-height: calc(100dvh - 1.5rem);
		padding: 3rem 2rem;
		background-color: var(--gray-500);
		box-shadow: var(--box-shadow-4);
		position: fixed;
		top: 0.75rem;
		right: 0.75rem;
		overflow: auto;
		z-index: 20;

		.container {
			gap: 0.75rem;
		}

		&[aria-hidden='true'] {
			transform: translate3d(110%, 0, 0);
		}

		&[aria-hidden='false'] {
			transform: translate3d(0, 0, 0);
		}

		&__link {
			color: var(--white);
			text-decoration: none;

			&[aria-current='page'] {
				font-weight: 700;
			}

			&--github {
				display: flex;
				align-items: center;
				gap: 0.5rem;
				font-size: 0.875rem;
			}
		}

		&__separator {
			width: 100%;
			border-style: solid;
			color: var(--gray-400);
		}
	}

	.app-controls-toggle {
		position: fixed;
		bottom: 1rem;
		right: 1rem;
		z-index: 11;
	}

	.app-controls {
		display: flex;
		flex-direction: column;
		max-width: calc(100% - 1.5rem);
		max-height: calc(100% - 1.5rem);
		background-color: var(--white);
		box-shadow: var(--box-shadow-4);
		position: fixed;
		right: 0.75rem;
		bottom: 0.75rem;
		z-index: 10;

		&[aria-hidden='true'] {
			transform: translate3d(0, 110%, 0);
		}

		&[aria-hidden='false'] {
			transform: translate3d(0, 0, 0);
		}

		.container {
			overflow: auto;
		}

		table {
			border-collapse: collapse;
			max-width: 100%;
			margin-block: 0.5rem;
		}

		tr:nth-child(odd) td {
			background-color: var(--gray-100);
		}

		th:not(:first-child):not(:last-child),
		td:not(:first-child):not(:last-child) {
			padding: 0.625rem 1.25rem;
		}

		th {
			border-bottom: 1px solid var(--gray-200);
			text-align: start;

			&:nth-child(3) {
				width: 44%;
			}

			&:first-child,
			&:last-child {
				width: 0;
			}
		}

		td {
			font-family: monospace;
		}

		input:not([type='checkbox']),
		select {
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

		.container {
			align-items: center;
		}
	}

	@media (min-width: 26em) {
		.app-controls {
			table {
				table-layout: auto;
			}

			th {
				&:first-child,
				&:last-child {
					width: 50%;
				}
			}
		}
	}

	@media (min-width: 48em) {
		.app-nav-toggle {
			top: 1.5rem;
			right: 1.5rem;
		}

		.app-nav {
			top: 1.25rem;
			right: 1.25rem;
		}

		.app-controls-toggle {
			bottom: 1.5rem;
			right: 1.5rem;
		}

		.app-controls {
			bottom: 1.25rem;
			right: 1.25rem;
		}
	}
</style>
