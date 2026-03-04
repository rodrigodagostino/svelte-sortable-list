export function afterPaint(transitionDuration: number, callback: () => void) {
	if (transitionDuration > 0)
		// A single rAF schedules the callback before the next paint, which may not be enough time
		// for the browser to finish applying style recalculations (particularly on mobile). The
		// double rAF pushes execution to the frame after the next paint, by which point the
		// transform is guaranteed to be applied.
		requestAnimationFrame(() => {
			requestAnimationFrame(callback);
		});
	else callback();
}
