// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

declare module 'svelte/elements' {
	export interface HTMLAttributes {
		onitemfocusout?: (event: CustomEvent<{ item: HTMLLIElement }>) => void;
	}

	export interface AriaAttributes {
		// `aria-description` is still in W3C Editor's Draft for ARIA 1.3,
		// but it is already correctly interpreted by screen readers.
		'aria-description'?: string | undefined | null;
	}
}

export {};
