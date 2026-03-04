export function afterPaint(transitionDuration: number, callback: () => void) {
	if (transitionDuration > 0) requestAnimationFrame(callback);
	else callback();
}
