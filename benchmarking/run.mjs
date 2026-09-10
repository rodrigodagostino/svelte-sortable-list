#!/usr/bin/env node
/**
 * Performance benchmark for svelte-sortable-list.
 *
 * Drives the `/benchmarking` route with Playwright and samples, per scenario:
 * - Engine metrics from CDP `Performance.getMetrics` (Chromium only): layout and style-recalc counts
 *   and durations, script and task time.
 * - Frame intervals from an in-page `requestAnimationFrame` sampler: fps, p95/max frame, long frames.
 * - Call counters for `getBoundingClientRect`, `getComputedStyle`, `querySelector(All)`,
 *   `requestAnimationFrame` and `Element.animate`, patched into the page before any app script runs.
 * - Release → `ondragend` latency, from the events the benchmarking page records.
 *
 * Usage:
 *   pnpm build && pnpm preview                 # serve the production build on :4173
 *   pnpm bench --label baseline                 # measure; writes benchmarking/results/<label>-<sha>-<time>.json
 *   pnpm bench --label after --compare benchmarking/results/baseline-<sha>-<time>.json
 *
 * Options:
 *   --url <url>            default http://localhost:4173
 *   --browser <name>       chromium (default) | webkit | firefox (engine metrics and layer counts are
 *                          Chromium-only; frame timing, call counters and latencies work everywhere)
 *   --scenarios <a,b,...>  subset of: mount, ptr-drag, ptr-peer, auto-scroll, kbd-drag, focus-nav, add-remove
 *   --runs <n>             runs per scenario, median reported (default 3)
 *   --duration <ms>        sampling window for continuous scenarios (default 1500)
 *   --count <n>            items per list override
 *   --label <name>         result label (default: git short sha)
 *   --out <file>           result path
 *   --compare <file>       previous result file to diff against
 *   --headed               show the browser
 *
 * Numbers from `vite dev` are not representative (dev runtime, unminified, HMR); measure the preview build.
 */

import { chromium, firefox, webkit } from '@playwright/test';
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { cpus, platform, release } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RESULTS_DIR = path.join(ROOT, 'benchmarking', 'results');
const BROWSERS = { chromium, webkit, firefox };
const VIEWPORT = { width: 1280, height: 1000 };

const options = parseArgs(process.argv.slice(2));

function parseArgs(argv) {
	const parsed = {
		url: 'http://localhost:4173',
		browser: 'chromium',
		scenarios: null,
		runs: 3,
		duration: 1500,
		count: null,
		label: null,
		out: null,
		compare: null,
		headed: false,
	};
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (!arg.startsWith('--')) continue;
		const key = arg.slice(2);
		if (key === 'headed') {
			parsed.headed = true;
			continue;
		}
		const value = argv[++i];
		if (value === undefined) throw new Error(`Missing value for --${key}`);
		if (key === 'runs' || key === 'duration' || key === 'count') parsed[key] = Number(value);
		else if (key === 'scenarios')
			parsed.scenarios = value
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean);
		else parsed[key] = value;
	}
	return parsed;
}

// Installed before any page script: counts the DOM APIs the library leans on and exposes a frame
// sampler that uses the unpatched `requestAnimationFrame`, so its own frames are not counted.
const INIT_SCRIPT = `(() => {
	const counters = { gBCR: 0, gCS: 0, qs: 0, qsA: 0, rAF: 0, animate: 0 };
	const rawRAF = window.requestAnimationFrame.bind(window);
	const wrap = (target, name, key) => {
		const original = target[name];
		target[name] = function (...args) {
			counters[key]++;
			return original.apply(this, args);
		};
	};
	wrap(Element.prototype, 'getBoundingClientRect', 'gBCR');
	wrap(window, 'getComputedStyle', 'gCS');
	wrap(Element.prototype, 'querySelector', 'qs');
	wrap(Element.prototype, 'querySelectorAll', 'qsA');
	wrap(Document.prototype, 'querySelector', 'qs');
	wrap(Document.prototype, 'querySelectorAll', 'qsA');
	wrap(Element.prototype, 'animate', 'animate');
	wrap(window, 'requestAnimationFrame', 'rAF');

	let frames = null;
	let last = 0;
	const tick = (t) => {
		if (!frames) return;
		frames.push(t - last);
		last = t;
		rawRAF(tick);
	};
	window.__perf = {
		counters,
		reset() {
			for (const key in counters) counters[key] = 0;
		},
		snapshot() {
			return { ...counters };
		},
		startFrames() {
			frames = [];
			last = performance.now();
			rawRAF(tick);
		},
		stopFrames() {
			const result = frames ?? [];
			frames = null;
			return result.slice(1);
		},
	};
})();`;

const SCENARIOS = {
	mount: {
		params: { count: 1000 },
		run: mount,
		description: 'load with 1000 items: hydration time, DOM/listener counts, compositor layers',
	},
	'ptr-drag': {
		params: { count: 1000 },
		run: ptrDrag,
		description: 'pointer drag in a 1000-item list, pointer oscillating across ~4 items at 1 Hz',
	},
	'ptr-peer': {
		params: { count: 300, lists: 3 },
		run: ptrPeer,
		description: 'pointer drag from list 1 hovering list 2 of a 3×300 group, oscillating at 1 Hz',
	},
	'auto-scroll': {
		params: { count: 1000, scroll: 'container' },
		run: autoScroll,
		description: 'pointer held near the bottom edge of a scroll container holding 1000 items',
	},
	'kbd-drag': {
		params: { count: 1000 },
		run: kbdDrag,
		description: 'keyboard drag: 20 ArrowDown presses at 40 ms intervals, then drop',
	},
	'focus-nav': {
		params: { count: 1000 },
		run: focusNav,
		description: 'focus navigation: 30 ArrowDown presses at 30 ms intervals, no drag',
	},
	'add-remove': {
		params: { count: 1000 },
		run: addRemove,
		description: 'two add + remove cycles at the end of a 1000-item list (in/out transitions)',
	},
};

async function main() {
	await assertServer(options.url);
	const names = options.scenarios ?? Object.keys(SCENARIOS);
	for (const name of names) {
		if (!SCENARIOS[name])
			throw new Error(`Unknown scenario "${name}". Known: ${Object.keys(SCENARIOS).join(', ')}`);
	}
	const launcher = BROWSERS[options.browser];
	if (!launcher) throw new Error(`Unknown browser "${options.browser}"`);

	const browser = await launcher.launch({ headless: !options.headed });
	const results = { meta: buildMeta(), scenarios: {} };
	try {
		for (const name of names) {
			const scenario = SCENARIOS[name];
			const params = { ...scenario.params };
			if (options.count) params.count = options.count;
			const runs = [];
			process.stdout.write(`${name} ${JSON.stringify(params)}`);
			for (let i = 0; i < options.runs; i++) {
				const session = await openPage(browser, params);
				try {
					runs.push(await scenario.run(session));
					process.stdout.write(' ✓');
				} catch (error) {
					process.stdout.write(' ✗');
					runs.push({ error: String(error?.message ?? error) });
				} finally {
					await session.context.close();
				}
			}
			process.stdout.write('\n');
			results.scenarios[name] = {
				params,
				description: scenario.description,
				runs,
				median: medianOf(runs.filter((run) => !run.error)),
			};
		}
	} finally {
		await browser.close();
	}

	const baseline = options.compare
		? JSON.parse(readFileSync(path.resolve(ROOT, options.compare), 'utf8'))
		: null;
	console.log('');
	printReport(results, baseline);
	const outPath = writeResults(results);
	console.log(`\nSaved ${path.relative(ROOT, outPath)}`);
}

async function assertServer(url) {
	try {
		const response = await fetch(url);
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
	} catch (error) {
		throw new Error(
			`Cannot reach ${url} (${error.message}). Start the preview build first: pnpm build && pnpm preview`,
			{ cause: error }
		);
	}
}

function buildMeta() {
	const git = (command) => {
		try {
			return execSync(command, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] })
				.toString()
				.trim();
		} catch {
			return null;
		}
	};
	const sha = git('git rev-parse --short HEAD');
	return {
		label: options.label ?? sha ?? 'run',
		date: new Date().toISOString(),
		sha,
		dirty: git('git status --porcelain') !== '',
		branch: git('git rev-parse --abbrev-ref HEAD'),
		url: options.url,
		browser: options.browser,
		runs: options.runs,
		durationMs: options.duration,
		viewport: VIEWPORT,
		node: process.version,
		platform: `${platform()} ${release()}`,
		cpu: cpus()[0]?.model ?? null,
		cpus: cpus().length,
	};
}

async function openPage(browser, params) {
	const context = await browser.newContext({ viewport: VIEWPORT });
	await context.addInitScript(INIT_SCRIPT);
	const page = await context.newPage();
	const cdp = options.browser === 'chromium' ? await context.newCDPSession(page) : null;
	if (cdp) await cdp.send('Performance.enable');

	const url = new URL('/benchmarking', options.url);
	for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
	await page.goto(url.href);
	await page.waitForFunction(() => window.__ssl?.ready === true);
	await page.waitForTimeout(300);

	return { context, page, cdp, params };
}

async function getMetrics(cdp) {
	if (!cdp) return null;
	const { metrics } = await cdp.send('Performance.getMetrics');
	return Object.fromEntries(metrics.map((metric) => [metric.name, metric.value]));
}

// Runs `action` while counting DOM API calls, sampling frames and diffing engine metrics.
async function sample({ page, cdp }, action) {
	await page.evaluate(() => {
		window.__perf.reset();
		window.__perf.startFrames();
	});
	const before = await getMetrics(cdp);
	const started = performance.now();
	const extra = (await action()) ?? {};
	const elapsedMs = performance.now() - started;
	const after = await getMetrics(cdp);
	const { frames, counters } = await page.evaluate(() => ({
		frames: window.__perf.stopFrames(),
		counters: window.__perf.snapshot(),
	}));
	return { ...summarize({ before, after, frames, counters, elapsedMs }), ...extra };
}

function summarize({ before, after, frames, counters, elapsedMs }) {
	const seconds = elapsedMs / 1000;
	const perSecond = (value) => value / seconds;
	const sorted = [...frames].sort((a, b) => a - b);
	const percentile = (q) =>
		sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] : 0;

	const medianFrameMs = percentile(0.5);
	// A long frame is one that misses at least one vsync of the observed cadence (headless WebKit
	// ticks at ~30 fps, so an absolute threshold would flag every frame there).
	const longFrameMs = Math.max(20, medianFrameMs * 1.5);

	const result = {
		elapsedMs,
		fps: perSecond(frames.length),
		frameMedianMs: medianFrameMs,
		frameP95Ms: percentile(0.95),
		frameMaxMs: sorted.at(-1) ?? 0,
		longFramesPerSec: perSecond(frames.filter((delta) => delta > longFrameMs).length),
		gBCRPerSec: perSecond(counters.gBCR),
		gCSPerSec: perSecond(counters.gCS),
		querySelectorPerSec: perSecond(counters.qs + counters.qsA),
		rAFPerSec: perSecond(counters.rAF),
		animatePerSec: perSecond(counters.animate),
	};
	if (before && after) {
		const delta = (key) => after[key] - before[key];
		Object.assign(result, {
			layoutPerSec: perSecond(delta('LayoutCount')),
			recalcStylePerSec: perSecond(delta('RecalcStyleCount')),
			layoutMsPerSec: perSecond(delta('LayoutDuration') * 1000),
			recalcStyleMsPerSec: perSecond(delta('RecalcStyleDuration') * 1000),
			scriptMsPerSec: perSecond(delta('ScriptDuration') * 1000),
			taskMsPerSec: perSecond(delta('TaskDuration') * 1000),
		});
	}
	return result;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function resetEvents(page) {
	await page.evaluate(() => {
		window.__ssl.events.length = 0;
	});
}

async function waitForEvent(page, type) {
	await page.waitForFunction((type) => window.__ssl.events.some((e) => e.type === type), type, {
		timeout: 10_000,
	});
}

// Release → `ondragend`, both timestamps taken in the page.
async function waitForDragEnd(page, release) {
	await waitForEvent(page, 'dragend');
	return page.evaluate((release) => {
		const events = window.__ssl.events;
		const end = events.findLast((e) => e.type === 'dragend');
		const released = events.findLast(
			(e) =>
				e.t <= end.t &&
				(release === 'pointer' ? e.type === 'pointerup' : e.type === 'keydown' && e.key === ' ')
		);
		return released ? end.t - released.t : null;
	}, release);
}

// Item whose center is closest to the viewport center, with the vertical pitch between items.
async function itemNearViewportCenter(page, listIndex = 0) {
	const target = await page.evaluate((listIndex) => {
		const root = document.querySelectorAll('.ssl-root')[listIndex];
		const items = Array.from(root.querySelectorAll('.ssl-item'));
		const centerY = window.innerHeight / 2;
		let best = null;
		items.forEach((item, index) => {
			const rect = item.getBoundingClientRect();
			const distance = Math.abs(rect.top + rect.height / 2 - centerY);
			if (!best || distance < best.distance)
				best = { index, distance, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
		});
		const pitch =
			items.length > 1
				? items[1].getBoundingClientRect().top - items[0].getBoundingClientRect().top
				: 0;
		return best ? { ...best, pitch } : null;
	}, listIndex);
	if (!target) throw new Error('No items found');
	return target;
}

async function startPointerDrag(page, x, y) {
	await page.mouse.move(x, y);
	await page.mouse.down();
	await page.mouse.move(x, y + 3);
	await waitForEvent(page, 'dragstart');
	await page.waitForTimeout(50);
}

// Moves the pointer up and down around (x, y) for the sampling window, ~150–250 moves/s.
async function oscillate(page, x, y, amplitude, frequencyHz = 1) {
	const started = performance.now();
	let moves = 0;
	for (;;) {
		const t = performance.now() - started;
		if (t >= options.duration) break;
		await page.mouse.move(x, y + Math.sin((t / 1000) * 2 * Math.PI * frequencyHz) * amplitude);
		moves++;
		await sleep(4);
	}
	return { movesPerSec: moves / (options.duration / 1000) };
}

async function mount({ page, cdp }) {
	const timing = await page.evaluate(() => {
		const navigation = performance.getEntriesByType('navigation')[0];
		const mounted = performance.getEntriesByName('ssl-mounted')[0];
		return {
			domInteractive: navigation?.domInteractive ?? null,
			mounted: mounted?.startTime ?? null,
			items: document.querySelectorAll('.ssl-item').length,
			domNodes: document.getElementsByTagName('*').length,
		};
	});
	const metrics = await getMetrics(cdp);
	const layers = cdp ? await countLayers(cdp, page) : null;
	return {
		items: timing.items,
		domNodes: timing.domNodes,
		// DOM parsed → list mounted (module load, hydration, mount effects).
		hydrateMountMs:
			timing.mounted !== null && timing.domInteractive !== null
				? timing.mounted - timing.domInteractive
				: null,
		...(metrics
			? {
					jsEventListeners: metrics.JSEventListeners,
					layoutObjects: metrics.LayoutObjects,
					jsHeapMB: metrics.JSHeapUsedSize / 1048576,
					recalcStyleMsTotal: metrics.RecalcStyleDuration * 1000,
					layoutMsTotal: metrics.LayoutDuration * 1000,
					scriptMsTotal: metrics.ScriptDuration * 1000,
				}
			: {}),
		...(layers ?? {}),
	};
}

// Compositor layers and the reasons behind them. The layer list only arrives once a frame is
// produced after `LayerTree.enable`, so one is forced.
async function countLayers(cdp, page) {
	const changed = new Promise((resolve) =>
		cdp.once('LayerTree.layerTreeDidChange', (event) => resolve(event.layers ?? []))
	);
	await cdp.send('LayerTree.enable');
	await page.evaluate(
		() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
	);
	const layers = await Promise.race([changed, sleep(2000).then(() => null)]);
	if (!layers) {
		await cdp.send('LayerTree.disable');
		return null;
	}
	const reasons = {};
	for (const layer of layers) {
		try {
			const { compositingReasonIds = [] } = await cdp.send('LayerTree.compositingReasons', {
				layerId: layer.layerId,
			});
			for (const id of compositingReasonIds) reasons[id] = (reasons[id] ?? 0) + 1;
		} catch {
			// The layer went away between the event and the query.
		}
	}
	await cdp.send('LayerTree.disable');
	return {
		compositorLayers: layers.length,
		layersTrivial3DTransform: reasons.Trivial3DTransform ?? 0,
		layersBackfaceVisibility: reasons.BackfaceVisibilityHidden ?? 0,
		layersWillChangeTransform: reasons.WillChangeTransform ?? 0,
		layersActiveTransformAnimation: reasons.ActiveTransformAnimation ?? 0,
	};
}

async function ptrDrag(session) {
	const { page } = session;
	const target = await itemNearViewportCenter(page);
	const amplitude = Math.min(target.pitch * 4, 180);
	await startPointerDrag(page, target.x, target.y);
	await resetEvents(page);
	const result = await sample(session, () => oscillate(page, target.x, target.y, amplitude));
	await page.mouse.up();
	result.dropLatencyMs = await waitForDragEnd(page, 'pointer');
	return result;
}

async function ptrPeer(session) {
	const { page } = session;
	const source = await itemNearViewportCenter(page, 0);
	const peer = await page.locator('.ssl-root').nth(1).boundingBox();
	if (!peer) throw new Error('Peer list not found');
	const peerX = peer.x + peer.width / 2;
	const amplitude = Math.min(source.pitch * 4, 180);
	await startPointerDrag(page, source.x, source.y);
	await page.mouse.move(peerX, source.y, { steps: 20 });
	// Let the peer placeholder intro finish before sampling.
	await page.waitForTimeout(400);
	await resetEvents(page);
	const result = await sample(session, () => oscillate(page, peerX, source.y, amplitude));
	await page.mouse.up();
	result.dropLatencyMs = await waitForDragEnd(page, 'pointer');
	return result;
}

async function autoScroll(session) {
	const { page } = session;
	const container = await page.locator('.list').first().boundingBox();
	const item = await page.locator('.ssl-item').nth(1).boundingBox();
	if (!container || !item) throw new Error('Scroll container or item not found');
	const x = item.x + item.width / 2;
	await startPointerDrag(page, x, item.y + item.height / 2);
	// Inside the bottom 20% band that triggers auto scroll.
	const holdY = container.y + container.height - 24;
	await page.mouse.move(x, holdY, { steps: 10 });
	await resetEvents(page);
	const scrollTop = () => page.evaluate(() => document.querySelector('.list').scrollTop);
	const startTop = await scrollTop();
	const result = await sample(session, async () => {
		const started = performance.now();
		let i = 0;
		while (performance.now() - started < options.duration) {
			// A 1 px jitter keeps pointer events flowing like a finger would.
			await page.mouse.move(x + (i++ % 2), holdY);
			await sleep(50);
		}
	});
	result.scrolledPx = (await scrollTop()) - startTop;
	await page.mouse.up();
	result.dropLatencyMs = await waitForDragEnd(page, 'pointer');
	return result;
}

async function kbdDrag(session) {
	const { page } = session;
	const target = await itemNearViewportCenter(page);
	await page.locator('.ssl-item').nth(target.index).focus();
	await page.keyboard.press('Space');
	await waitForEvent(page, 'dragstart');
	await resetEvents(page);
	const result = await sample(session, async () => {
		for (let i = 0; i < 20; i++) {
			await page.keyboard.press('ArrowDown');
			await sleep(40);
		}
		return { presses: 20 };
	});
	await page.keyboard.press('Space');
	result.dropLatencyMs = await waitForDragEnd(page, 'keyboard');
	return result;
}

async function focusNav(session) {
	const { page } = session;
	const target = await itemNearViewportCenter(page);
	await page.locator('.ssl-item').nth(target.index).focus();
	await page.waitForTimeout(50);
	return sample(session, async () => {
		for (let i = 0; i < 30; i++) {
			await page.keyboard.press('ArrowDown');
			await sleep(30);
		}
		return { presses: 30 };
	});
}

async function addRemove(session) {
	const { page, params } = session;
	const transition = Number(params.duration ?? 320);
	// Bring the end of the list into view so the transitions paint as well as lay out.
	await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
	await page.waitForTimeout(200);
	return sample(session, async () => {
		for (let i = 0; i < 2; i++) {
			await page.evaluate(() => window.__ssl.addItem());
			await page.waitForTimeout(transition + 150);
			await page.evaluate(() => window.__ssl.removeLastItem());
			await page.waitForTimeout(transition + 150);
		}
		return { ops: 4 };
	});
}

function medianOf(runs) {
	if (!runs.length) return null;
	const keys = new Set(runs.flatMap((run) => Object.keys(run)));
	const median = {};
	for (const key of keys) {
		const values = runs
			.map((run) => run[key])
			.filter((value) => typeof value === 'number' && Number.isFinite(value))
			.sort((a, b) => a - b);
		if (!values.length) continue;
		const mid = Math.floor(values.length / 2);
		median[key] = values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
	}
	return median;
}

function format(value) {
	if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
	const abs = Math.abs(value);
	return abs >= 1000 ? value.toFixed(0) : abs >= 100 ? value.toFixed(1) : value.toFixed(2);
}

function formatDelta(current, base) {
	if (typeof base !== 'number' || base === 0) return '—';
	const pct = ((current - base) / Math.abs(base)) * 100;
	return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
}

function printTable(header, rows) {
	const widths = header.map((cell, i) =>
		Math.max(cell.length, ...rows.map((row) => String(row[i]).length))
	);
	const line = (cells) =>
		`| ${cells.map((cell, i) => String(cell).padEnd(widths[i])).join(' | ')} |`;
	console.log(line(header));
	console.log(`| ${widths.map((width) => '-'.repeat(width)).join(' | ')} |`);
	for (const row of rows) console.log(line(row));
}

function printReport(results, baseline) {
	const { meta } = results;
	console.log(
		`# ${meta.label} — ${meta.browser} — ${meta.sha ?? 'no git'}${meta.dirty ? ' (dirty)' : ''} — ${meta.date}`
	);
	if (baseline) {
		const b = baseline.meta;
		console.log(`Compared with ${b.label} — ${b.sha}${b.dirty ? ' (dirty)' : ''} — ${b.date}`);
	}
	for (const [name, scenario] of Object.entries(results.scenarios)) {
		const ok = scenario.runs.filter((run) => !run.error).length;
		console.log(
			`\n## ${name} ${JSON.stringify(scenario.params)} — median of ${ok}/${scenario.runs.length} runs`
		);
		for (const { error } of scenario.runs.filter((run) => run.error))
			console.log(`  error: ${error}`);
		if (!scenario.median) continue;
		const base = baseline?.scenarios?.[name]?.median ?? null;
		const rows = Object.entries(scenario.median).map(([key, value]) =>
			baseline
				? [key, format(base?.[key]), format(value), formatDelta(value, base?.[key])]
				: [key, format(value)]
		);
		printTable(
			baseline ? ['metric', baseline.meta.label, meta.label, 'Δ'] : ['metric', meta.label],
			rows
		);
	}
	console.log(
		'\n*PerSec values are normalized by the sampled window. layout/recalcStyle/script/task: CDP Performance.getMetrics (Chromium). gBCR/gCS/querySelector/rAF/animate: call counts patched into the page. fps/frameMedianMs/frameP95Ms/frameMaxMs/longFramesPerSec (> max(20 ms, 1.5× median)): in-page rAF sampler. dropLatencyMs: release → ondragend.'
	);
}

function writeResults(results) {
	const { label, sha, date } = results.meta;
	const safe = (value) => String(value ?? '').replace(/[^\w.-]+/g, '-');
	const file =
		options.out ??
		path.join(RESULTS_DIR, `${safe(label)}-${safe(sha)}-${safe(date.replace(/[:.]/g, '-'))}.json`);
	mkdirSync(path.dirname(file), { recursive: true });
	writeFileSync(file, JSON.stringify(results, null, '\t') + '\n');
	return file;
}

main().catch((error) => {
	console.error(error.message ?? error);
	process.exit(1);
});
