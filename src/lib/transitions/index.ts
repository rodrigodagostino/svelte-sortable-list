import { sineInOut } from 'svelte/easing';
import type { EasingFunction, TransitionConfig } from 'svelte/transition';

function get_metrics(
	node: HTMLElement,
	axis: 'x' | 'y',
	known: Partial<ScaleFlyMetrics> = {}
): ScaleFlyMetrics {
	const style = getComputedStyle(node);
	const rect =
		known.width === undefined || known.height === undefined ? node.getBoundingClientRect() : null;
	const [start, end] = axis === 'y' ? (['Top', 'Bottom'] as const) : (['Left', 'Right'] as const);

	return {
		width: known.width ?? rect!.width,
		height: known.height ?? rect!.height,
		padding: known.padding ?? [
			parseFloat(style[`padding${start}`]),
			parseFloat(style[`padding${end}`]),
		],
		margin: known.margin ?? [
			parseFloat(style[`margin${start}`]),
			parseFloat(style[`margin${end}`]),
		],
		border: known.border ?? [
			parseFloat(style[`border${start}Width`]),
			parseFloat(style[`border${end}Width`]),
		],
		opacity: known.opacity ?? +style.opacity,
	};
}

function get_transform(node: HTMLElement) {
	const { transform } = getComputedStyle(node);
	return transform === 'none' ? '' : transform;
}

function split_css_unit(value: number | string): [number, string] {
	const split = typeof value === 'string' && value.match(/^\s*(-?[\d.]+)([^\s]*)\s*$/);
	return split ? [parseFloat(split[1]), split[2] || 'px'] : ([value, 'px'] as [number, string]);
}

interface ScaleFlyParams {
	/** Delay (in milliseconds). */
	delay?: number;
	/** Duration (in milliseconds). */
	duration?: number;
	/** Easing function. */
	easing?: EasingFunction;
	/** Axis. */
	axis?: 'x' | 'y';
	/** X position. */
	x?: number;
	/** Y position. */
	y?: number;
	/** Opacity. */
	opacity?: number;
	/** Precomputed box metrics. Any left out are read from the node. */
	metrics?: Partial<ScaleFlyMetrics>;
}

export interface ScaleFlyMetrics {
	/** Width of the element (in pixels). */
	width: number;
	/** Height of the element (in pixels). */
	height: number;
	/** Padding at the start and at the end of `axis` (in pixels). */
	padding: [number, number];
	/** Margin at the start and at the end of `axis` (in pixels). */
	margin: [number, number];
	/** Border width at the start and at the end of `axis` (in pixels). */
	border: [number, number];
	/** Opacity the element rests at. */
	opacity: number;
}

/**
 * Animates the size, opacity and position of an element. `in` transitions start with the element collapsed along `axis`, offset by `x`/`y` and at the given `opacity`, then grow it into place while holding the offset, and finally fly it to its resting position while fading it in. `out` transitions run the same animation in reverse.
 *
 * @param node Element to animate.
 * @param params Animation parameters.
 * @param params.delay Delay (in milliseconds).
 * @param params.duration Duration (in milliseconds).
 * @param params.easing Easing function.
 * @param params.axis Axis.
 * @param params.x Horizontal offset the element flies in from and out to (in pixels).
 * @param params.y Vertical offset the element flies in from and out to (in pixels).
 * @param params.opacity Opacity.
 * @param params.metrics Precomputed box metrics. Supplying them skips measuring the node, which avoids a forced reflow.
 * @returns Transition configuration.
 */
export function scaleFly(
	node: HTMLElement,
	{
		delay = 0,
		duration = 320,
		easing = sineInOut,
		axis = 'y',
		x = 0,
		y = 0,
		opacity = 0,
		metrics,
	}: ScaleFlyParams = {}
): TransitionConfig {
	const [x_value, x_unit] = split_css_unit(x);
	const [y_value, y_unit] = split_css_unit(y);

	const {
		width,
		height,
		padding: [padding_start_value, padding_end_value],
		margin: [margin_start_value, margin_end_value],
		border: [border_width_start_value, border_width_end_value],
		opacity: opacity_target_value,
	} = get_metrics(node, axis, metrics);

	const opacity_delta_value = opacity_target_value * (1 - opacity);
	const primary_property = axis === 'y' ? 'height' : 'width';
	const primary_property_value = primary_property === 'width' ? width : height;
	const primary_property_opposite = axis === 'y' ? 'width' : 'height';
	const primary_property_opposite_value = primary_property_opposite === 'height' ? height : width;
	const secondary_properties = axis === 'y' ? ['top', 'bottom'] : ['left', 'right'];

	const has_translate = x_value !== 0 || y_value !== 0;
	const transform = has_translate ? get_transform(node) : '';
	const has_opacity_delta = opacity_delta_value !== 0;
	const has_padding = padding_start_value !== 0 || padding_end_value !== 0;
	const has_margin = margin_start_value !== 0 || margin_end_value !== 0;
	const has_border = border_width_start_value !== 0 || border_width_end_value !== 0;

	return {
		delay,
		duration,
		easing,
		css: (t, u) =>
			`${has_translate ? `transform: ${transform} translate3d(${t <= 0.5 ? x_value : u * 2 * x_value}${x_unit}, ${t <= 0.5 ? y_value : u * 2 * y_value}${y_unit}, 0);` : ''}` +
			`${has_opacity_delta ? `opacity: ${t > 0.5 ? opacity_target_value - opacity_delta_value * u * 2 : 0};` : ''}` +
			`${primary_property}: ${t <= 0.5 ? t * 2 * primary_property_value : primary_property_value}px;` +
			`${primary_property_opposite}: ${primary_property_opposite_value}px;` +
			`${has_padding ? `padding-${secondary_properties[0]}: ${t <= 0.5 ? t * 2 * padding_start_value : padding_start_value}px; padding-${secondary_properties[1]}: ${t <= 0.5 ? t * 2 * padding_end_value : padding_end_value}px;` : ''}` +
			`${has_margin ? `margin-${secondary_properties[0]}: ${margin_start_value}px; margin-${secondary_properties[1]}: ${t <= 0.5 ? t * 2 * (margin_start_value + margin_end_value) - margin_start_value : margin_end_value}px;` : ''}` +
			`${has_border ? `border-${secondary_properties[0]}-width: ${t <= 0.5 ? t * 2 * border_width_start_value : border_width_start_value}px; border-${secondary_properties[1]}-width: ${t <= 0.5 ? t * 2 * border_width_end_value : border_width_end_value}px;` : ''}` +
			`min-${primary_property}: 0;`,
	};
}
