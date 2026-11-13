import type { Easing, Vec2 } from "../type.ts";
import { easings } from "./easing.ts";
import { mapNumbers, roundTo } from "./internal.ts";

/**
 * Maps a value from an existing range into another, also works recursively on arrays or objects.
 * Arrays and objects are copied, the input is not mutated.
 * @param val The value, array, or object of values to map.
 * @param from The range from which to map. If both ends are equal, every value maps to `to[0]`.
 * @param to The range to map to.
 * @param precision The number of decimal points to round to (can be negative to round to tens, hundreds etc.).
 * @param easing Optional easing to apply to the range.
 * @param method (Default - round) The method for rounding to the precision.
 */
export function mapRange<T extends number | string | any[] | Record<string, any>>(val: T, from: Vec2, to: Vec2, precision = 5, easing?: Easing, method: "floor" | "round" | "ceil" = "round"): T {
	const width = from[1] - from[0];
	return mapNumbers(val, x => {
		if (width === 0) return roundTo(to[0], precision, method);
		return roundTo(lerp(to[0], to[1], (x - from[0]) / width, easing), precision, method);
	});
}

/**
 * Interpolate between two numbers by a fraction, with optional easing.
 * @param start The start point.
 * @param end The end point.
 * @param fraction (0-1) The fraction between the start and end point.
 * @param easing The easing to use on the interpolation.
 */
export function lerp(start: number, end: number, fraction: number, easing: Easing = "easeLinear"): number {
	const t = easings[easing](fraction);
	// This form returns exactly start at t = 0 and exactly end at t = 1.
	return start * (1 - t) + end * t;
}

/**
 * Finds the midpoint between two points.
 * @param p1 The first point.
 * @param p2 The second point (must be in the same dimension as the first).
 * @param floor Whether to floor the result.
 */
export function midPoint<T extends number[]>(p1: T, p2: T, floor = false): T {
	const mp = p1.map((x, i) => (x + p2[i]) / 2);
	return (floor ? mp.map(Math.floor) : mp) as T;
}
