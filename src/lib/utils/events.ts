import { canScroll } from './auto-scroll.ts';

export function dispatch(target: HTMLElement, name: string, detail: object) {
	const event = new CustomEvent(name, { bubbles: true, detail });
	target.dispatchEvent(event);
}

export function startPointerSession(pointerSession: AbortController | null) {
	pointerSession?.abort();
	return new AbortController();
}

export function endPointerSession(pointerSession: AbortController | null) {
	pointerSession?.abort();
	return null;
}

export function isActivePointer(e: PointerEvent, pointerId: PointerEvent['pointerId'] | null) {
	return e.pointerId === pointerId;
}

export function addScrollListener(
	scrollableAncestor: HTMLElement | undefined,
	handleScroll: () => void
) {
	if (!scrollableAncestor || !canScroll(scrollableAncestor)) return null;

	// The document’s scrolling element doesn’t reliably receive its own `scroll` events,
	// so `document` is the target used for that case. Any other element (even one taller
	// than the viewport) will receive `scroll` events as expected and won’t bubble.
	const scrollEventTarget =
		scrollableAncestor === document.documentElement ? document : scrollableAncestor;
	scrollEventTarget.addEventListener('scroll', handleScroll, { passive: true });

	return scrollEventTarget;
}

export function removeScrollListener(
	scrollEventTarget: HTMLElement | Document | null,
	handleScroll: () => void
) {
	scrollEventTarget?.removeEventListener('scroll', handleScroll);
	return null;
}
