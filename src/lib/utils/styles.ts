export function getTranslateValues(element: HTMLElement) {
	const style = window.getComputedStyle(element);
	if (style.transform === 'none') return;
	const matrix = style.transform.match(/matrix.*\((.+)\)/)![1].split(', ');

	return {
		x: Number(matrix[12] || matrix[4] || 0),
		y: Number(matrix[13] || matrix[5] || 0),
		z: Number(matrix[14] || 0),
	};
}
