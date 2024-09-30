<script lang="ts">
	import { page } from '$app/stores';
	import { props } from './stores.js';
	import './styles.css';

	let isControlsExpanded = true;
</script>

<div id="app" class="app" class:is-controls-expanded={isControlsExpanded}>
	<main class="app-main">
		<div class="container">
			<slot />
		</div>
	</main>
	<aside id="app-controls" class="app-controls">
		<button
			class="app-controls__toggle button"
			aria-expanded={isControlsExpanded}
			aria-controls="app-controls"
			on:click={() => (isControlsExpanded = !isControlsExpanded)}
		>
			{isControlsExpanded ? 'Hide controls' : 'Show controls'}
		</button>
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
						<td><label for="swap-threshold">swapThreshold</label></td>
						<td>
							<input
								id="swap-threshold"
								type="number"
								min="0.5"
								max="2"
								step="0.1"
								bind:value={$props.swapThreshold}
							/>
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
						<td><label for="has-remove-on-drop-out">hasRemoveOnDropOut</label></td>
						<td>
							<input
								id="has-remove-on-drop-out"
								type="checkbox"
								bind:checked={$props.hasRemoveOnDropOut}
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
	<nav class="app-nav">
		<div class="container">
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
				href="/interactive-items"
				aria-current={$page.url.pathname === '/interactive-items' ? 'page' : undefined}
			>
				Interactive items
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
				href="/has-boundaries"
				aria-current={$page.url.pathname === '/has-boundaries' ? 'page' : undefined}
			>
				Has boundaries
			</a>
			<a
				class="app-nav__link"
				href="/has-drop-marker"
				aria-current={$page.url.pathname === '/has-drop-marker' ? 'page' : undefined}
			>
				Has drop marker
			</a>
			<a
				class="app-nav__link"
				href="/has-locked-axis"
				aria-current={$page.url.pathname === '/has-locked-axis' ? 'page' : undefined}
			>
				Has locked axis
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
				href="/has-remove-on-drop-out"
				aria-current={$page.url.pathname === '/has-remove-on-drop-out' ? 'page' : undefined}
			>
				Has remove on drop out
			</a>
			<hr class="app-nav__separator" />
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
			</a>
		</div>
	</nav>
</div>

<style lang="scss">
	.app {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: auto 0fr auto;
		width: 100%;
		min-height: 100vh;
		min-height: 100svh;
		transition: grid-template-rows 320ms;

		&.is-controls-expanded {
			grid-template-rows: repeat(3, auto);

			.app-controls {
				grid-template-rows: 1fr;
			}
		}
	}

	.app-main,
	.app-nav {
		display: flex;
		flex-direction: column;
	}

	.app-main {
		padding: 3rem;
		scrollbar-gutter: stable;

		.container {
			& > :global(.button) {
				margin-top: 2rem;
			}
		}
	}

	.app-controls {
		display: grid;
		grid-template-rows: 0fr;
		background-color: var(--white);
		position: relative;
		transition: grid-template-rows 320ms;
		z-index: 1;

		&__toggle {
			position: absolute;
			top: 0;
			right: 0;
			transform: translateY(-50%);
			height: 2.25rem;
			font-size: 0.875rem;
			transition:
				background-color 240ms,
				transform 320ms;
		}

		.container {
			overflow: hidden;
		}

		table {
			border-collapse: collapse;
			margin-block: 1.25rem;
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

	.app-nav {
		padding: 3rem 2rem;
		background-color: var(--gray-500);
		position: relative;

		.container {
			align-items: center;
			justify-content: center;
			gap: 0.75rem;
		}

		&__link {
			color: var(--white);
			text-decoration: none;

			&[aria-current='page'] {
				font-weight: 700;
			}
		}

		&__separator {
			width: 4rem;
			border-style: solid;
			color: var(--gray-400);
		}
	}

	.container {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-block: auto;
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
		.app {
			grid-template-columns: 1fr 20.25rem;
			grid-template-rows: 1fr 0;
			height: 100vh;
			height: 100svh;
			overflow: hidden;

			&.is-controls-expanded {
				grid-template-rows: 1fr 18rem;
			}
		}

		.app-main {
			overflow-y: auto;
		}

		.app-nav {
			position: fixed;
			inset: 0;
			margin-inline-start: auto;
			width: 20.25rem;

			.container {
				align-items: start;
				height: 100%;
			}
		}

		.app-controls {
			grid-row: span 1;
			grid-column: 1/2;

			.container {
				height: 100%;
				overflow-y: auto;
			}

			&__toggle {
				right: 1.25rem;
				transform: translate(0, -100%);
			}
		}
	}
</style>
