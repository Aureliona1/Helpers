// deno-lint-ignore-file no-explicit-any

/**
 * Internal helpers shared by math.ts and interpolation.ts.
 * This module is deliberately not re-exported from mod.ts.
 * @module
 */

import type { TypedArray } from "../type.ts";

/**
 * Recursively apply a function to every number in a value.
 * Arrays, typed arrays and objects are copied rather than mutated.
 * Built-in objects with internal state (Date, Map, Set, DataView, etc.) and null are returned unchanged.
 * @param val The value to traverse.
 * @param fn The function to apply to each number.
 */
export function mapNumbers<T>(val: T, fn: (x: number) => number): T {
	if (typeof val === "number") return fn(val) as T;
	if (val === null || typeof val !== "object") return val;
	if (Array.isArray(val)) return val.map(x => mapNumbers(x, fn)) as T;
	if (ArrayBuffer.isView(val)) {
		if (val instanceof DataView || val instanceof BigInt64Array || val instanceof BigUint64Array) return val;
		return (val as unknown as TypedArray).map(x => fn(x)) as T;
	}
	// Dates, Maps, Sets etc. can't be rebuilt from their own keys, so leave them alone.
	if (Object.prototype.toString.call(val) !== "[object Object]") return val;
	const out = Object.create(Object.getPrototypeOf(val));
	for (const key of Object.keys(val)) {
		out[key] = mapNumbers((val as any)[key], fn);
	}
	return out as T;
}

/**
 * Move the decimal point of a number by a whole number of places using its decimal string form.
 * This avoids binary float errors such as 1.005 * 100 = 100.49999999999999.
 */
function shiftDecimal(n: number, places: number): number {
	const [mantissa, exponent = "0"] = `${n}`.split("e");
	return Number(`${mantissa}e${Number(exponent) + places}`);
}

/**
 * Round a single number to a number of decimal places.
 * @param x The number to round.
 * @param precision The number of decimals (can be negative to round to tens, hundreds etc.).
 * @param method The rounding method.
 */
export function roundTo(x: number, precision: number, method: "floor" | "round" | "ceil"): number {
	if (!Number.isFinite(x)) return x;
	if (!Number.isInteger(precision)) {
		const factor = Math.pow(10, precision);
		return Math[method](x * factor) / factor;
	}
	return shiftDecimal(Math[method](shiftDecimal(x, precision)), -precision);
}
