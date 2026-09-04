import { canScroll } from './auto-scroll.ts';

export function dispatch(target: HTMLElement, name: string, detail: object) {
	const event = new CustomEvent(name, { bubbles: true, detail });
	target.dispatchEvent(event);
}

export function addScrollListener(
	scrollableAncestor: HTMLElement | undefined,
	isScrollingDocument: boolean,
	handleScroll: () => void
) {
	if (!scrollableAncestor || !canScroll(scrollableAncestor)) return null;

	// The document’s scrolling element doesn’t reliably receive its own
	// `scroll` events, so `document` is the target used for that case.
	const scrollEventTarget = isScrollingDocument ? document : scrollableAncestor;
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
