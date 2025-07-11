import { sineInOut } from 'svelte/easing';
import type { EasingFunction, TransitionConfig } from 'svelte/transition';

function split_css_unit(value: number | string): [number, string] {
	const split = typeof value === 'string' && value.match(/^\s*(-?[\d.]+)([^\s]*)\s*$/);
	return split ? [parseFloat(split[1]), split[2] || 'px'] : ([value, 'px'] as [number, string]);
}

interface ScaleFlyParams {
	delay?: number;
	duration?: number;
	easing?: EasingFunction;
	x?: number;
	y?: number;
	opacity?: number;
}

export function scaleFly(
	node: HTMLElement,
	{ delay = 0, duration = 240, easing = sineInOut, x = 0, y = 0, opacity = 0 }: ScaleFlyParams = {}
): TransitionConfig {
	const style = getComputedStyle(node);
	const transform = style.transform === 'none' ? '' : style.transform;
	const [xValue, xUnit] = split_css_unit(x);
	const [yValue, yUnit] = split_css_unit(y);
	const target_opacity = +style.opacity;
	const od = target_opacity * (1 - opacity);
	const height = node.getBoundingClientRect().height;
	const padding_top = parseFloat(style.paddingTop);
	const padding_bottom = parseFloat(style.paddingBottom);
	const target_padding_top = +style.paddingTop;
	const target_padding_bottom = +style.paddingBottom;
	const margin_top = parseFloat(style.marginTop);
	const margin_bottom = parseFloat(style.marginBottom);
	const target_margin_top = +style.marginTop;
	const target_margin_bottom = +style.marginBottom;
	const border_top_width = parseFloat(style.borderTopWidth);
	const border_bottom_width = parseFloat(style.borderBottomWidth);
	const target_border_top_width = +style.borderTopWidth;
	const target_border_bottom_width = +style.borderBottomWidth;

	return {
		delay,
		duration,
		easing,
		css: (t, u) =>
			`transform: ${transform} translate3d(${t <= 0.5 ? `${(1 - t) * 2 * xValue}${xUnit}` : x}, ${t <= 0.5 ? `${(1 - t) * yValue}${yUnit}` : y}, 0);` +
			`opacity: ${t <= 0.5 ? `${target_opacity - od * u * 2};` : `${target_opacity}px;`}` +
			`height: ${t <= 0.5 ? `${t * 2 * height}px;` : `${height}px;`}` +
			`padding-top: ${t <= 0.5 ? `${t * 2 * padding_top}px;` : `${target_padding_top}px;`}` +
			`padding-bottom: ${t <= 0.5 ? `${t * 2 * padding_bottom}px;` : `${target_padding_bottom}px;`}` +
			`margin-top: ${t <= 0.5 ? `${t * 2 * margin_top}px;` : `${target_margin_top}px;`}` +
			`margin-bottom: ${t <= 0.5 ? `${t * 2 * margin_bottom}px;` : `${target_margin_bottom}px;`}` +
			`border-top-width: ${t <= 0.5 ? `${t * 2 * border_top_width}px;` : `${target_border_top_width}px;`}` +
			`border-bottom-width: ${t <= 0.5 ? `${t * 2 * border_bottom_width}px;` : `${target_border_bottom_width}px;`}`,
	};
}
