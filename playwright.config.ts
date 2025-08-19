import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	projects: [
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
			},
		},
		{
			name: 'Mobile Chrome',
			use: {
				...devices['Pixel 5'],
			},
		},
	],
	webServer: {
		command: 'pnpm build && pnpm preview',
		port: 4173,
	},
	testDir: 'e2e',
	timeout: 60 * 1000,
	expect: {
		timeout: 10 * 1000,
	},
	retries: 2,
	use: {
		trace: 'on-first-retry',
	},
});
