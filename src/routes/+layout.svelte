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
	<a class="app-nav__link" href="/" aria-current={$page.url.pathname === '/' ? 'page' : undefined}>
		Basic
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
		href="/with-dynamic-items"
		aria-current={$page.url.pathname === '/with-dynamic-items' ? 'page' : undefined}
	>
		With dynamic items
	</a>
</nav>

<style lang="scss">
	.app-main,
	.app-nav {
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.app-main {
		padding: 3rem;
	}

	.app-nav {
		align-items: center;
		gap: 0.5rem;
		padding: 3rem 2rem;
		background-color: var(--gray-500);

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
			align-items: start;
		}
	}
</style>
