<script lang="ts">
	import { page } from '$app/stores';
	import './styles.css';
</script>

<main class="app-main">
	<div class="container">
		<slot />
	</div>
</main>
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
			href="/locked-axis"
			aria-current={$page.url.pathname === '/locked-axis' ? 'page' : undefined}
		>
			Locked axis
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
			href="/dynamic-items"
			aria-current={$page.url.pathname === '/dynamic-items' ? 'page' : undefined}
		>
			Dynamic items
		</a>
		<a
			class="app-nav__link"
			href="/disabled-items"
			aria-current={$page.url.pathname === '/disabled-items' ? 'page' : undefined}
		>
			Disabled items
		</a>
	</div>
</nav>

<style lang="scss">
	.app-main,
	.app-nav {
		display: flex;
		flex-direction: column;
	}

	.app-main {
		justify-content: center;
		padding: 3rem;

		.container {
			align-items: center;
		}
	}

	.app-nav {
		padding: 3rem 2rem;
		background-color: var(--gray-500);

		.container {
			align-items: center;
			justify-content: center;
			gap: 0.5rem;
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

	@media (min-width: 48em) {
		.app-nav {
			position: fixed;
			inset: 0;
			left: calc(100% - 20rem);

			.container {
				align-items: start;
				height: 100%;
			}
		}
	}
</style>
