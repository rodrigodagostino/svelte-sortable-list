export function dispatch(target: HTMLElement, name: string, detail: object) {
	const event = new CustomEvent(name, { bubbles: true, detail });
	target.dispatchEvent(event);
}
