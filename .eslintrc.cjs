/** @type { import("eslint").Linter.Config } */
module.exports = {
	root: true,
	/**
	 * In order to display Prettier errors through ESLint, 'plugin:prettier/recommended' is added in the property below.
	 * Switch it for 'prettier' and remove 'eslint-plugin-prettier' from 'plugins' if you do not wish this behavior
	 * (the 'eslint-plugin-prettier' dependency can be removed too).
	 */
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:svelte/prettier',
		'plugin:prettier/recommended',
	],
	parser: '@typescript-eslint/parser',
	plugins: ['eslint-plugin-prettier', '@typescript-eslint'],
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2020,
		extraFileExtensions: ['.svelte'],
	},
	env: {
		browser: true,
		es2017: true,
		node: true,
	},
	overrides: [
		{
			files: ['*.svelte'],
			parser: 'svelte-eslint-parser',
			parserOptions: {
				parser: '@typescript-eslint/parser',
			},
		},
	],
};
