// deno-lint-ignore-file no-explicit-any
import * as easings from "./Easings.ts";
import type { Easing, Vec2 } from "./Types.ts";

/**
 * Interpolate between two numbers by a fraction, with optional easing.
 * @param start The start point.
 * @param end The end point.
 * @param fraction (0-1) The fraction between the start and end point.
 * @param easing The easing to use on the interpolation.
 */
export function lerp(start: number, end: number, fraction: number, easing: Easing = "easeLinear"): number {
	return easings[easing](fraction) * (end - start) + start;
}

/**
 * Returns a function of a waveform with period 1 and amplitude 1.
 */
export const waveform = {
	sine: (x: number): number => Math.sin(mapRange(x, [0, 1], [0, 2 * Math.PI])),
	saw: (x: number): number => (x % 1) * 2 - 1,
	sawInverse: (x: number): number => ((1 - x) % 1) * 2 - 1,
	square: (x: number): number => (x % 1 < 0.5 ? -1 : 1),
	ease: (x: number, ease: Easing, amp = 1): number => (x % 1 < 0.5 ? lerp(-amp, amp, (x % 1) * 2, ease) : lerp(amp, -amp, (x % 1) * 2 - 1, ease)),
	triangle: (x: number): number => 1 - Math.abs(0.5 - (x % 1)) * 4
};

/**
 * Maps a value from an existing range into another, also works recursively on arrays or objects.
 * @param val The value, array, or object of values to map.
 * @param from The range from which to map.
 * @param to The range to map to.
 * @param precision The number of decimal points to round to (can be nagative to round to tens, hundreds etc.).
 * @param easing Optional easing to apply to the range.
 */
export function mapRange<T extends number | string | any[] | Record<string, any>>(val: T, from: Vec2, to: Vec2, precision = 5, easing?: Easing): T {
	if (typeof val == "number") {
		return (Math.floor(Math.pow(10, precision) * lerp(to[0], to[1], (val - from[0]) / (from[1] - from[0]), easing)) / Math.pow(10, precision)) as T;
	} else if (!(typeof val == "number" || typeof val == "object")) {
		return val;
	} else if (Array.isArray(val)) {
		(val as any[]) = val.map(x => mapRange(x, from, to, precision));
	} else {
		Object.keys(val).forEach(key => {
			val[key] = mapRange(val[key], from, to, precision);
		});
	}
	return val;
}
