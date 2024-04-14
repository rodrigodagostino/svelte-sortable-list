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
								min="0"
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
						<td
							><input id="has-boundaries" type="checkbox" bind:checked={$props.hasBoundaries} /></td
						>
						<td></td>
					</tr>
					<tr>
						<td></td>
						<td><label for="has-remove-on-drag-out">hasRemoveOnDragOut</label></td>
						<td>
							<input
								id="has-remove-on-drag-out"
								type="checkbox"
								bind:checked={$props.hasRemoveOnDragOut}
							/>
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
				href="/disabled-items"
				aria-current={$page.url.pathname === '/disabled-items' ? 'page' : undefined}
			>
				Disabled items
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
				href="/direction-horizontal-has-locked-axis"
				aria-current={$page.url.pathname === '/direction-horizontal-has-locked-axis'
					? 'page'
					: undefined}
			>
				Direction horizontal (has locked axis)
			</a>
			<a
				class="app-nav__link"
				href="/has-remove-on-drag-out"
				aria-current={$page.url.pathname === '/has-remove-on-drag-out' ? 'page' : undefined}
			>
				Has remove on drag out
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
		justify-content: center;
		padding: 3rem;

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
			transition: transform 320ms;
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

		.container {
			align-items: center;
			justify-content: center;
			gap: 0.75rem;
		}

		&__link {
			text-decoration: none;

			&[aria-current='page'] {
				font-weight: 700;
			}
		}
	}

	.container {
		display: flex;
		flex-direction: column;
		align-items: center;
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
			left: auto;
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
				transform: translate(0, -100%);
			}
		}
	}
</style>
