import { sineInOut } from 'svelte/easing';
import type { EasingFunction, TransitionConfig } from 'svelte/transition';

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
	}: ScaleFlyParams = {}
): TransitionConfig {
	const style = getComputedStyle(node);
	const nodeRect = node.getBoundingClientRect();

	const transform = style.transform === 'none' ? '' : style.transform;
	const [x_value, x_unit] = split_css_unit(x);
	const [y_value, y_unit] = split_css_unit(y);
	const opacity_target_value = +style.opacity;
	const opacity_delta_value = opacity_target_value * (1 - opacity);
	const primary_property = axis === 'y' ? 'height' : 'width';
	const primary_property_value = nodeRect[primary_property];
	const primary_property_opposite = axis === 'y' ? 'width' : 'height';
	const primary_property_opposite_value = nodeRect[primary_property_opposite];
	const secondary_properties = axis === 'y' ? ['top', 'bottom'] : ['left', 'right'];
	const capitalized_secondary_properties = secondary_properties.map(
		(e) => `${e[0].toUpperCase()}${e.slice(1)}` as 'Left' | 'Right' | 'Top' | 'Bottom'
	);
	const padding_start_value = parseFloat(style[`padding${capitalized_secondary_properties[0]}`]);
	const padding_end_value = parseFloat(style[`padding${capitalized_secondary_properties[1]}`]);
	const margin_start_value = parseFloat(style[`margin${capitalized_secondary_properties[0]}`]);
	const margin_end_value = parseFloat(style[`margin${capitalized_secondary_properties[1]}`]);
	const border_width_start_value = parseFloat(
		style[`border${capitalized_secondary_properties[0]}Width`]
	);
	const border_width_end_value = parseFloat(
		style[`border${capitalized_secondary_properties[1]}Width`]
	);

	const has_translate = x_value !== 0 || y_value !== 0;
	const has_opacity_delta = opacity_delta_value !== 0;

	return {
		delay,
		duration,
		easing,
		css: (t, u) =>
			`${has_translate ? `transform: ${transform} translate3d(${t <= 0.5 ? x_value : u * 2 * x_value}${x_unit}, ${t <= 0.5 ? y_value : u * 2 * y_value}${y_unit}, 0);` : ''}` +
			`${has_opacity_delta ? `opacity: ${t > 0.5 ? opacity_target_value - opacity_delta_value * u * 2 : 0};` : ''}` +
			`${primary_property}: ${t <= 0.5 ? t * 2 * primary_property_value : primary_property_value}px;` +
			`${primary_property_opposite}: ${primary_property_opposite_value}px;` +
			`padding-${secondary_properties[0]}: ${t <= 0.5 ? t * 2 * padding_start_value : padding_start_value}px;` +
			`padding-${secondary_properties[1]}: ${t <= 0.5 ? t * 2 * padding_end_value : padding_end_value}px;` +
			`margin-${secondary_properties[0]}: ${margin_start_value}px;` +
			`margin-${secondary_properties[1]}: ${t <= 0.5 ? t * 2 * (margin_start_value + margin_end_value) - margin_start_value : margin_end_value}px;` +
			`border-${secondary_properties[0]}-width: ${t <= 0.5 ? t * 2 * border_width_start_value : border_width_start_value}px;` +
			`border-${secondary_properties[1]}-width: ${t <= 0.5 ? t * 2 * border_width_end_value : border_width_end_value}px;` +
			`min-${primary_property}: 0;`,
	};
}
