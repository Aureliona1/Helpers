// deno-lint-ignore-file no-explicit-any

import { ArrOp } from "../object/array.ts";
import type { Easing, Vec2, Vec3, Vec4 } from "../type.ts";
import { lerp, mapRange } from "./interpolation.ts";

/**
 * Recursively sets the precision of numbers in an object, array, or number.
 * @param o The object, or number to set the precision of.
 * @param precision The number of decimals.
 * @param method (Default - round) The method for rounding.
 */
export function decimals<T extends string | number | any[] | Record<string, any>>(o: T, precision = 5, method: "floor" | "round" | "ceil" = "round"): T {
	if (typeof o == "number") {
		return (Math[method](o * Math.pow(10, precision)) / Math.pow(10, precision)) as T;
	} else if (!(typeof o == "number" || typeof o == "object")) {
		return o;
	} else if (Array.isArray(o)) {
		(o as any[]) = o.map(x => decimals(x, precision, method));
	} else {
		Object.keys(o).forEach(key => {
			o[key] = decimals(o[key], precision, method);
		});
	}
	return o;
}

/**
 * Generates a number based on the character codes in a string.
 */
export function stringCodeToNumber(s: string): number {
	return Array.from(s)
		.map(x => x.charCodeAt(0))
		.reduce((x, y) => x + y);
}

/**
 * Spread a seed number across 32 bits.
 */
function fastSeed(seed: number): number {
	let x = seed * 0x9e3779b1; // golden ratio prime
	x ^= x >>> 16;
	x = Math.imul(x, 0x85ebca6b);
	x ^= x >>> 13;
	x = Math.imul(x, 0xc2b2ae35);
	x ^= x >>> 16;
	return x >>> 0;
}

/**
 * Generate a random number. The generator uses a 32-bit integer internally, meaning that this function can generate at most 2^32 distinct numbers.
 * @param min The minimum possible number to generate (inclusive).
 * @param max The maximum possible number to generate (exclusive).
 * @param seed The optional seed to apply to the generator (leave blank for random).
 * @param precision (Default - 3) The number of decimals in the random number. This can be negative to round to different values, e.g., -1 will round to the nearest 10, -2 will round to the nearest 100 etc.
 * @returns Random number.
 */
export function random(min: number, max: number, seed: number | string = Math.random(), precision = 3): number {
	[min, max] = min > max ? [max, min] : [min, max];
	const parsedSeed = typeof seed == "number" ? fastSeed(seed) : stringCodeToNumber(`${seed}`);
	const xor32 = (s: number) => {
		s ^= s << 13;
		s ^= s >> 17;
		s ^= s << 5;
		return s / 0xffffffff + 0.5;
	};

	return mapRange(xor32(parsedSeed), [0, 1], [min, max], precision);
}

/**
 * Clamp a number within a range, also works recursively on arrays or objects.
 * @param val The value, array, or object of values to clamp.
 * @param min The minimum (inclusive) value to clamp to.
 * @param max The maximum (inclusive) value to clamp to.
 */
export function clamp<T extends number | string | any[] | Record<string, any>>(val: T, min: number, max: number): T {
	if (typeof val == "number") {
		return Math.max(Math.min(min, max), Math.min(Math.max(min, max), val)) as T;
	} else if (!(typeof val == "number" || typeof val == "object")) {
		return val;
	} else if (Array.isArray(val)) {
		(val as any[]) = val.map(x => clamp(x, min, max));
	} else {
		Object.keys(val).forEach(key => {
			val[key] = clamp(val[key], min, max);
		});
	}
	return val;
}

/**
 * Clamps a number within a range by looping it when it extends the range on either side.
 * This function works recursively on any object or array or number.
 * @param x The number to clamp.
 * @param min The minimum (inclusive) value to clamp to.
 * @param max The maximum (inclusive) value to clamp to.
 */
export function clampLoop<T extends number | string | any[] | Record<string, any>>(val: T, min: number, max: number): T {
	if (max < min) {
		const temp = min;
		min = max;
		max = temp;
	}
	if (typeof val == "number") {
		return (val >= 0 ? (val % (max - min)) + min : (val % (max - min)) + max - 1) as T;
	} else if (!(typeof val == "number" || typeof val == "object")) {
		return val;
	} else if (Array.isArray(val)) {
		(val as any[]) = val.map(x => clampLoop(x, min, max));
	} else {
		Object.keys(val).forEach(key => {
			val[key] = clampLoop(val[key], min, max);
		});
	}
	return val;
}

/**
 * Abstraction of hypot function. Finds the distance between 2 vectors.
 * @param vec1 The first vector.
 * @param vec2 The second vector.
 */
export function distance<T extends number[]>(vec1: T, vec2: T): number {
	return Math.hypot(...ArrOp.subtract(vec2, vec1));
}

/**
 * Multiply two rectangular or square matrices
 * @param mat1 The values for mat one (e.g., [[1,2,3],[4,5,6]])
 * @param mat2 The values for mat two (e.g., [[1,2],[3,4],[5,6]])
 */
function multiplyMats(mat1: number[][], mat2: number[][]) {
	const md = [mat1.length, mat1[0].length],
		nd = [mat2.length, mat2[0].length];
	const res = new Array(md);
	for (let i = 0; i < md[0]; i++) res[i] = new Array(nd[1]);

	for (let i = 0; i < md[0]; i++) {
		for (let j = 0; j < nd[1]; j++) {
			res[i][j] = 0;

			for (let x = 0; x < md[1]; x++) {
				res[i][j] += mat1[i][x] * mat2[x][j];
			}
		}
	}
	return res;
}

/**
 * Rotate a vector based on euler rotations. Rotations are performed in the order ZXY.
 * @param start The start position of the vector. The vector will be rotated around this position.
 * @param end The end position of the vector.
 * @param rotation The rotation to apply (in degrees).
 * @param precision (Default - 3) The number of decimals in the result.
 * @returns Vec3
 */
export function rotateVector(start: Vec3, end: Vec3, rotation: Vec3, precision = 3): Vec3 {
	rotation = rotation.map(x => (x * Math.PI) / 180) as Vec3;
	let pos: number[][] = [[end[0] - start[0]], [end[1] - start[1]], [end[2] - start[2]]];
	const xMat: number[][] = [
		[1, 0, 0],
		[0, Math.cos(rotation[0]), -Math.sin(rotation[0])],
		[0, Math.sin(rotation[0]), Math.cos(rotation[0])]
	];
	const yMat: number[][] = [
		[Math.cos(rotation[1]), 0, Math.sin(rotation[1])],
		[0, 1, 0],
		[-Math.sin(rotation[1]), 0, Math.cos(rotation[1])]
	];
	const zMat: number[][] = [
		[Math.cos(rotation[2]), -Math.sin(rotation[2]), 0],
		[Math.sin(rotation[2]), Math.cos(rotation[2]), 0],
		[0, 0, 1]
	];
	pos = multiplyMats(zMat, pos);
	pos = multiplyMats(xMat, pos);
	pos = multiplyMats(yMat, pos);
	return decimals([pos[0][0] + start[0], pos[1][0] + start[1], pos[2][0] + start[2]] as Vec3, precision);
}

/**
 * Alias for `rotateVector` only considering a 2D plane.
 * @param start The start of the vector.
 * @param end The end of the vector.
 * @param rot The rotation angle.
 */
export function rotateVector2D(start: Vec2, end: Vec2, rot: number): Vec2 {
	return rotateVector([...start, 0], [...end, 0], [0, 0, rot]).slice(0, 2) as Vec2;
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
 * Convert hsva to rgba.
 * @param color The hsva color (linear values 0-1).
 */
export function hsv2rgb(color: Vec4): Vec4 {
	const [h, s, v, a] = color;
	const f = (n: number, k = (n + h * 6) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
	return [f(5), f(3), f(1), a] as Vec4;
}

/**
 * Convert rgba to hsva.
 * @param color The rgba color (linear rgb 0-1).
 */
export function rgb2hsv(color: Vec4): Vec4 {
	const max = Math.max(color[0], color[1], color[2]);
	const min = Math.min(color[0], color[1], color[2]);
	const delta = max - min;
	const h = delta === 0 ? 0 : max === color[0] ? (color[1] - color[2]) / delta + (color[1] < color[2] ? 6 : 0) : max === color[1] ? (color[2] - color[0]) / delta + 2 : (color[0] - color[1]) / delta + 4;
	const s = max === 0 ? 0 : delta / max;
	return [h / 6, s, max, color[3]] as Vec4;
}

/**
 * Convert byte value hsv to gamma rgb (all values are 0-255).
 * @param hsv Uint8Array of hsv (optional a) values. This will be mutated by the function.
 */
export function byteHsvToRgb(hsv: Uint8Array): Uint8Array {
	const h = hsv[0] / 255,
		s = hsv[1] / 255,
		v = hsv[2] / 255;
	const f = (n: number, k = (n + h * 6) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
	hsv[0] = f(5) * 255;
	hsv[1] = f(3) * 255;
	hsv[2] = f(1) * 255;
	return hsv;
}

/**
 * Convert gamma rgb to byte value hsv (all values are 0-255).
 * @param rgb Uint8Array of rgb (optional a) values. This will be mutated by the function.
 */
export function byteRgbToHsv(rgb: Uint8Array): Uint8Array {
	const r = rgb[0] / 255,
		g = rgb[1] / 255,
		b = rgb[2] / 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const delta = max - min;
	rgb[0] = Math.round((255 * (delta === 0 ? 0 : max === r ? (g - b) / delta + (g < b ? 6 : 0) : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4)) / 6);
	rgb[1] = max === 0 ? 0 : (delta * 255) / max;
	rgb[2] = max * 255;
	return rgb;
}
