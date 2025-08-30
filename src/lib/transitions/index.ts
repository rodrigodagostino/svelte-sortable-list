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
 * Animates the opacity, scale and the x and y positions of an element. `in` transitions animate from an element's current (default) values to the provided values, passed as parameters. `out` transitions animate from the provided values to an element's default values.
 *
 * @param node Element to animate.
 * @param params Animation parameters.
 * @param params.delay Delay (in milliseconds).
 * @param params.duration Duration (in milliseconds).
 * @param params.easing Easing function.
 * @param params.axis Axis.
 * @param params.x X position.
 * @param params.y Y position.
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

	const transform = style.transform === 'none' ? '' : style.transform;
	const [x_value, x_unit] = split_css_unit(x);
	const [y_value, y_unit] = split_css_unit(y);
	const opacity_target_value = +style.opacity;
	const opacity_delta_value = opacity_target_value * (1 - opacity);
	const primary_property = axis === 'y' ? 'height' : 'width';
	const primary_property_value = node.getBoundingClientRect()[primary_property];
	const primary_property_opposite = axis === 'y' ? 'width' : 'height';
	const primary_property_opposite_value = node.getBoundingClientRect()[primary_property_opposite];
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

	return {
		delay,
		duration,
		easing,
		css: (t, u) =>
			`transform: ${transform} translate3d(${t <= 0.5 ? `${(1 - t) * 2 * x_value}${x_unit}` : x}, ${t <= 0.5 ? `${(1 - t) * y_value}${y_unit}` : y}, 0);` +
			`opacity: ${t > 0.5 ? opacity_target_value - opacity_delta_value * u * 2 : 0};` +
			`${primary_property}: ${t <= 0.5 ? t * 2 * primary_property_value : primary_property_value}px;` +
			`${primary_property_opposite}: ${primary_property_opposite_value}px;` +
			`padding-${secondary_properties[0]}: ${t <= 0.5 ? t * 2 * padding_start_value : padding_start_value}px;` +
			`padding-${secondary_properties[1]}: ${t <= 0.5 ? t * 2 * padding_end_value : padding_end_value}px;` +
			`margin-${secondary_properties[0]}: ${t <= 0.5 ? t * 2 * margin_start_value : margin_start_value}px;` +
			`margin-${secondary_properties[1]}: ${t <= 0.5 ? t * 2 * margin_end_value : margin_end_value}px;` +
			`border-${secondary_properties[0]}-width: ${t <= 0.5 ? t * 2 * border_width_start_value : border_width_start_value}px;` +
			`border-${secondary_properties[1]}-width: ${t <= 0.5 ? t * 2 * border_width_end_value : border_width_end_value}px;` +
			`min-${primary_property}: 0;` +
			'overflow: hidden;',
	};
}
