/** @type {import("prettier").Config} */
const config = {
	bracketSpacing: true,
	printWidth: 100,
	singleQuote: true,
	trailingComma: 'es5',
	useTabs: true,
	plugins: ['prettier-plugin-svelte', 'prettier-plugin-tailwindcss'],
	overrides: [
		{ files: '*.svelte', options: { parser: 'svelte' } },
		{ files: ['*.json', '*.scss', '*.css'], options: { singleQuote: false } },
	],
};

export default config;
