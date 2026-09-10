# Performance benchmark

This directory holds the tooling used to measure the runtime performance of the library and to compare it before and after a change. It is a development tool only: nothing here is shipped in the package, and the numbers it produces are specific to the machine and browser build they were taken on.

The harness has two halves:

- **`src/routes/benchmarking/+page.svelte`**, a demo route that renders large lists (a thousand items by default) and exposes a few hooks the benchmark reads back. It is not linked from the navigation, but it is served like every other demo route, so it can also be opened in a real browser to profile by hand with DevTools.
- **`benchmarking/run.mjs`**, a Node script (run as `pnpm bench`) that launches a browser through Playwright, drives the benchmarking route through a fixed set of interactions, samples engine and page metrics while doing so, and writes the medians to a JSON file. When given a previous result file, it prints a side-by-side comparison with deltas.

## Why measure this way

The library's cost is dominated by what happens while a drag is in progress: per-frame reactive updates across every item, forced layout and style reads, and CSS transitions and animations at drop time. Those costs do not show up in a unit test and are easy to misjudge by reading code. The benchmark reproduces the interactions users actually perform (pointer drags, hovering a peer list, auto scrolling, keyboard drags, focus navigation, adding and removing items) and reports the quantities that explain where the time goes:

- how many times the browser recalculated style or laid out the page, and how long it spent doing so;
- how much time went to script, and how long the main thread was busy in total;
- how many `getBoundingClientRect`, `getComputedStyle` and `querySelector` calls the page made, since these are the operations that force synchronous layout and style work;
- how steady the frame rate was;
- how long the user waited between releasing an item and the `ondragend` callback.

Every scenario runs at a deliberately large size (1000 items) so that anything proportional to the number of items becomes visible. Real lists are usually far smaller, but a cost that scales with `N` is still worth removing, and measuring at `N = 1000` makes the difference between "constant" and "per item" obvious.

## Prerequisites

- Dependencies installed (`pnpm install`); the Playwright browsers are already part of the dev setup used for the E2E suite. If a browser is missing, `pnpm exec playwright install chromium webkit` fetches it.
- A production preview of the demo app running on port 4173. The benchmark refuses to start if it cannot reach the URL.

Always measure the production build, never `vite dev`. The development runtime of Svelte is unminified, carries extra checks, and the dev server adds module overhead, so its numbers are neither representative nor stable.

## Taking a measurement

```sh
pnpm build && pnpm preview        # serves the production build on http://localhost:4173
pnpm bench --label baseline        # in a second terminal
```

The script prints one line per scenario while it runs (one check mark per successful run), then a Markdown table per scenario, and finally the path of the JSON it saved, `benchmarking/results/<label>-<git sha>-<timestamp>.json`. The `results` directory is ignored by git and by Prettier; keep whatever files are useful as local references.

Each run opens a fresh browser context and page, so runs never share state. A full pass with the default three runs per scenario takes about two minutes on Chromium.

### Options

| Option                  | Default                 | Meaning                                                                                                                                                                                                  |
| ----------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--label <name>`        | short git sha           | Name stored in the results and used as the column header. Use something descriptive such as `baseline` or `peer-snapshot`.                                                                               |
| `--scenarios <a,b,...>` | all                     | Comma-separated subset of `mount`, `ptr-drag`, `ptr-peer`, `auto-scroll`, `kbd-drag`, `focus-nav`, `add-remove`. Useful while iterating on one code path.                                                |
| `--runs <n>`            | `3`                     | Runs per scenario. The reported value is the median across runs; five runs give a steadier baseline.                                                                                                     |
| `--duration <ms>`       | `1500`                  | Length of the sampling window for the continuous scenarios (pointer drag, peer hover, auto scroll).                                                                                                      |
| `--count <n>`           | per scenario            | Overrides the number of items per list for every scenario.                                                                                                                                               |
| `--browser <name>`      | `chromium`              | `chromium`, `webkit` or `firefox`. Engine metrics and layer counts come from the Chrome DevTools Protocol and are only available on Chromium; frame timing, call counters and latencies work everywhere. |
| `--url <url>`           | `http://localhost:4173` | Where the demo app is served.                                                                                                                                                                            |
| `--out <file>`          | auto                    | Where to write the JSON result.                                                                                                                                                                          |
| `--compare <file>`      | none                    | A previous result file to diff against (see below).                                                                                                                                                      |
| `--headed`              | off                     | Show the browser window while the scenarios run. Handy for checking that an interaction does what you think it does; do not trust numbers taken this way.                                                |

## Comparing before and after

```sh
pnpm bench --label peer-snapshot --compare benchmarking/results/baseline-<sha>-<timestamp>.json
```

Every table then has three value columns: the baseline, the current run and the relative change. The comparison is per metric and per scenario, so a change that improves one interaction and regresses another shows up as such.

Run both sides under the same conditions: same machine, same browser, nothing heavy running in the background, laptop on mains power. Even then, some metrics are noisier than others:

- Call counts (`gBCRPerSec`, `gCSPerSec`, `querySelectorPerSec`, `rAFPerSec`), frame rate and latencies are stable to within a few percent between identical runs.
- Time measurements (`scriptMsPerSec`, `taskMsPerSec`, `recalcStyleMsPerSec`, `layoutMsPerSec`) fluctuate by 10 to 15 percent, occasionally more, on identical code. Treat differences in that range as noise unless they repeat across several runs, and prefer the count metrics when judging whether a change removed work.

### Comparing against an older commit

The simplest comparison is against a result file taken before the change, which is what the workflow above does. When a strict A/B on the same day is needed, or the baseline file is gone, serve the old commit from a separate worktree rather than stashing and unstashing the working tree:

```sh
git worktree add --detach /tmp/ssl-before <sha>
(cd /tmp/ssl-before && pnpm install --offline --frozen-lockfile && pnpm build && pnpm preview --port 4174)
pnpm bench --url http://localhost:4174 --label before
git worktree remove --force /tmp/ssl-before
```

Both sides need the `/benchmarking` route, so the older commit must already include it.

## Scenarios

All scenarios open `/benchmarking` with the parameters shown, wait until the list has mounted, and settle for 300 ms before doing anything. The viewport is fixed at 1280 × 1000 pixels.

| Scenario      | Route parameters              | What the script does                                                                                                                                                       | What it exercises                                                                                                                                                  |
| ------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `mount`       | `count=1000`                  | Loads the page and reads timing, DOM and compositor data once everything is mounted.                                                                                       | Hydration and mount cost, number of DOM nodes and JS event listeners registered per item, heap size, and how many compositor layers the idle list creates and why. |
| `ptr-drag`    | `count=1000`                  | Presses on the item closest to the viewport center, then moves the pointer up and down across about four items in a 1 Hz sine wave for the sampling window, then releases. | The per-frame cost of a pointer drag inside its own list: reactive updates across all items, target detection, DOM queries per frame, and the drop transition.     |
| `ptr-peer`    | `count=300&lists=3`           | Same start in the first list of a three-list group, then glides the pointer over the second list and oscillates there, then releases (a cross-list drop).                  | The per-frame cost of hovering a peer list: how the peer's geometry is read, and the cross-list drop.                                                              |
| `auto-scroll` | `count=1000&scroll=container` | Starts a drag near the top of a fixed-height scroll container and holds the pointer inside the bottom auto-scroll band, with a 1 px jitter every 50 ms, then releases.     | The auto scroll loop, scroll-driven retargeting, and the refresh of the fixed-position origin. Also reports how far the container scrolled.                        |
| `kbd-drag`    | `count=1000`                  | Focuses the item closest to the viewport center, lifts it with Space, presses ArrowDown twenty times at 40 ms intervals, then drops with Space.                            | Keyboard drag: flushes per key press, scroll-into-view measurements, the transitions on each move, and the keyboard drop.                                          |
| `focus-nav`   | `count=1000`                  | Focuses the same item and presses ArrowDown thirty times at 30 ms intervals without lifting.                                                                               | Focus movement between items: reactive updates that depend on the focused item, and the visibility checks that scroll the focused item into view.                  |
| `add-remove`  | `count=1000`                  | Scrolls to the end of the list, then twice appends an item and removes the last item, waiting for each transition to finish.                                               | The add and remove transitions (`scaleFly` by default), which animate layout properties, and the style work triggered by inserting and removing a list item.       |

The benchmarking route accepts a few more parameters that no scenario uses by default, for manual profiling or for ad hoc runs with `--count`:

| Parameter          | Effect                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `count=<n>`        | Items per list. Default 500 when opened by hand.                                                                    |
| `lists=<n>`        | Number of lists. More than one puts them all in the same group, side by side, so items can be dragged between them. |
| `scroll=container` | Wraps each list in a fixed-height container that scrolls, instead of scrolling the document.                        |
| `duration=<ms>`    | Transition duration passed to the lists. Default 320.                                                               |
| `handle=1`         | Renders a drag handle inside every item.                                                                            |
| `remove=1`         | Renders a remove button inside every item.                                                                          |

Parameters are read once when the page loads; reload after changing them.

## Metrics

Everything with a `PerSec` suffix is a rate: the raw count or duration measured during the sampling window, divided by the window length in seconds. Rates make runs with slightly different window lengths comparable. Lower is better for every metric except `fps`, `movesPerSec`, `scrolledPx` and the plain counts (`items`, `presses`, `ops`), which describe the workload rather than its cost.

### Engine metrics (Chromium only)

Taken from the Chrome DevTools Protocol `Performance.getMetrics` command, as the difference between a snapshot before and after the interaction.

| Metric                | Meaning                                                                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `layoutPerSec`        | Number of layout passes per second. Layout is forced when script reads geometry (`getBoundingClientRect`, `offsetTop`, `scrollTop`, and so on) after the DOM or styles changed. |
| `layoutMsPerSec`      | Time spent in layout per second, in milliseconds.                                                                                                                               |
| `recalcStylePerSec`   | Number of style recalculation passes per second.                                                                                                                                |
| `recalcStyleMsPerSec` | Time spent recalculating style per second. This is where expensive selectors and invalidation that touches every item show up.                                                  |
| `scriptMsPerSec`      | Time spent executing JavaScript per second. This includes the library, Svelte's reactivity runtime, and the page's own handlers.                                                |
| `taskMsPerSec`        | Total main-thread task time per second: script, style, layout, and everything else the renderer does on the main thread. The closest thing to "how busy is the page".           |

### Frame timing

Recorded by a `requestAnimationFrame` loop installed in the page. Because it uses the original, unpatched `requestAnimationFrame`, its own frames are not counted in `rAFPerSec`.

| Metric             | Meaning                                                                                                                                                                                                               |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fps`              | Frames observed per second.                                                                                                                                                                                           |
| `frameMedianMs`    | Median interval between frames. About 16.7 ms on a 60 Hz engine; around 34 ms in headless WebKit, which ticks at roughly 30 fps.                                                                                      |
| `frameP95Ms`       | 95th percentile frame interval.                                                                                                                                                                                       |
| `frameMaxMs`       | Longest interval between two frames, in other words the worst hitch during the window.                                                                                                                                |
| `longFramesPerSec` | Frames per second that took longer than `max(20 ms, 1.5 × median)`, meaning the engine missed at least one of its own vsyncs. The relative threshold keeps the metric meaningful on engines that do not run at 60 Hz. |

### Call counters

Before any application script runs, the benchmark patches a handful of DOM APIs to count how often the page calls them. The patches forward every call unchanged; they only increment counters.

| Metric                | What is counted                                                                                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gBCRPerSec`          | `Element.prototype.getBoundingClientRect` calls. Each one may force layout.                                                                           |
| `gCSPerSec`           | `window.getComputedStyle` calls. Each one may force a style recalculation, and reading `transform` from the result also depends on layout.            |
| `querySelectorPerSec` | `querySelector` and `querySelectorAll` calls on elements and the document.                                                                            |
| `rAFPerSec`           | `requestAnimationFrame` calls made by the page. Compared with `fps`, this shows how many independent frame callbacks the library schedules per frame. |
| `animatePerSec`       | `Element.prototype.animate` calls, which is how Svelte runs CSS-based transitions.                                                                    |

### Latency and workload

| Metric           | Meaning                                                                                                                                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dropLatencyMs`  | Time between the pointer release (or the Space key that dropped the item) and the `ondragend` callback, both timestamps taken inside the page. This is how long the user waits before the list is interactive again. |
| `elapsedMs`      | Actual length of the sampling window.                                                                                                                                                                                |
| `movesPerSec`    | Pointer moves the script managed to dispatch per second. In Chromium this settles at about 60 because the engine coalesces mouse moves to one per frame.                                                             |
| `scrolledPx`     | Distance the container auto-scrolled during the window (`auto-scroll` only).                                                                                                                                         |
| `presses`, `ops` | Number of key presses or add/remove operations performed.                                                                                                                                                            |

### Mount metrics

Reported only by the `mount` scenario, as absolute values rather than rates.

| Metric                                                                                                                | Meaning                                                                                                                                                                                                                                                             |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `items`, `domNodes`                                                                                                   | Number of `.ssl-item` elements and total elements in the document.                                                                                                                                                                                                  |
| `hydrateMountMs`                                                                                                      | Time from the document becoming interactive (HTML parsed) to the list's `onmounted` callback: module loading, hydration and mount effects.                                                                                                                          |
| `jsEventListeners`                                                                                                    | Number of JavaScript event listeners registered in the page. Listeners registered per item show up here as a multiple of the item count.                                                                                                                            |
| `layoutObjects`                                                                                                       | Number of layout objects in the render tree.                                                                                                                                                                                                                        |
| `jsHeapMB`                                                                                                            | Used JavaScript heap, in megabytes.                                                                                                                                                                                                                                 |
| `recalcStyleMsTotal`, `layoutMsTotal`, `scriptMsTotal`                                                                | Cumulative time since navigation; at this point, the cost of mounting the page.                                                                                                                                                                                     |
| `compositorLayers`                                                                                                    | Number of compositor layers after a forced frame.                                                                                                                                                                                                                   |
| `layersTrivial3DTransform`, `layersBackfaceVisibility`, `layersWillChangeTransform`, `layersActiveTransformAnimation` | How many of those layers exist because of each compositing reason, as reported by `LayerTree.compositingReasons`. This is the direct way to check whether idle items are being promoted to their own layers, and whether a dragged item is promoted while it moves. |

## Known limitations

- Engine metrics and layer counts need the Chrome DevTools Protocol, so on WebKit and Firefox those rows are simply absent. Frame timing, call counters and latencies still work there, and WebKit is worth running for anything that touches transitions, since it retargets CSS transitions differently from Chromium.
- Headless WebKit renders at roughly 30 fps. Compare its `frameMaxMs` and `longFramesPerSec` against a WebKit baseline, not against Chromium.
- In Chromium, `page.mouse.move` resolves once per frame, so the pointer scenarios deliver about 60 moves per second. This matches what a real pointer produces after coalescing, but it means the benchmark cannot reproduce very high-rate input devices.
- The compositor layer list only arrives after a frame is produced, so the benchmark forces one before reading it. In headless mode, layers far outside the viewport may not be reported.
- Results are only comparable with results from the same machine, browser build and Playwright version. Do not compare numbers across computers.
- The call counters count every caller in the page, including Svelte's runtime and the benchmarking page itself. That is fine for comparisons, since both sides carry the same overhead.

## Extending the harness

To add a scenario, add an entry to `SCENARIOS` in `benchmarking/run.mjs` with the route parameters, a description and a `run(session)` function. The `session` gives you the Playwright `page`, the CDP session (or `null` outside Chromium) and the parameters. Wrap the part you want measured in `sample(session, async () => { ... })`, which resets the counters, starts the frame sampler, snapshots the engine metrics, runs your interaction, and returns the summarized metrics. Anything the callback returns is merged into the result, which is how `movesPerSec`, `presses` and `scrolledPx` get there. Helpers such as `startPointerDrag`, `oscillate`, `itemNearViewportCenter`, `waitForEvent` and `waitForDragEnd` cover the common steps.

To expose more state from the page, extend the object the benchmarking route assigns to `window.__ssl`, or record additional events with its `record()` function, and read them with `page.evaluate` from the scenario.

When adding a metric, keep the convention: rates get a `PerSec` suffix, durations end in `Ms`, and the results file stays flat per scenario so `--compare` can diff it without changes.
