export function getIntersectionRect(r1: DOMRect, r2: DOMRect) {
	const x1 = Math.max(r1.x, r2.x);
	const y1 = Math.max(r1.y, r2.y);
	const x2 = Math.min(r1.x + r1.width, r2.x + r2.width);
	const y2 = Math.min(r1.y + r1.height, r2.y + r2.height);

	return { x: x1, y: y1, width: x2 - x1, height: y2 - y1, area: (x2 - x1) * (y2 - y1) };
}

export function reorder<T>(array: T[], from: number, to: number) {
	array = array.slice();
	array.splice(to < 0 ? array.length + to : to, 0, array.splice(from, 1)[0]);
	return array;
}
