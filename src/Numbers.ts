// deno-lint-ignore-file no-explicit-any
import { ArrOp } from "./Arrays.ts";
import { rgb } from "./Console.ts";
import type { Vec2, Vec3 } from "./Types.ts";

import mulberry32 from "@bengineering/mulberry32";

/**
 * Recursively sets the precision of numbers in an object, array, or number.
 * @param o The object, or number to set the precision of.
 * @param precision The number of decimals.
 */
export function decimals<T extends string | number | any[] | Record<string, any>>(o: T, precision = 5): T {
	if (typeof o == "number") {
		return (Math.round(o * Math.pow(10, precision)) / Math.pow(10, precision)) as T;
	} else if (!(typeof o == "number" || typeof o == "object")) {
		return o;
	} else if (Array.isArray(o)) {
		(o as any[]) = o.map(x => decimals(x, precision));
	} else {
		Object.keys(o).forEach(key => {
			o[key] = decimals(o[key], precision);
		});
	}
	return o;
}

/**
 * Generates a number based on the character codes in a string.
 */
export function stringCodeToNumber(s: string): number {
	return s
		.split(/./)
		.map(x => x.charCodeAt(0))
		.reduce((x, y) => x + y);
}

/**
 * Generate a random number.
 * @param min The minimun possible number to generate (inclusive).
 * @param max The maximum possible number to generate (exclusive).
 * @param seed The optional seed to apply to the generator (leave blank for random).
 * @param precision (Default - 3) The number of decimals in the random number. This can be negative to round to different values, e.g., -1 will round to the nearest 10, -2 will round to the nearest 100 etc.
 * @returns Random number.
 */
export function random(min: number, max: number, seed: number | string = Math.random(), precision = 3): number {
	[min, max] = min > max ? [max, min] : [min, max];
	return decimals(mulberry32(stringCodeToNumber(seed.toString()))() * (max - min) + min, precision);
}

/**
 * Clamp a number within a range, also works recursively on arrays or objects.
 * @param val The value, array, or object of values to clamp.
 * @param range The range (inclusive) to clamp the value within.
 */
export function clamp<T extends number | string | any[] | Record<string, any>>(val: T, range: Vec2): T {
	range = range[0] > range[1] ? [range[1], range[0]] : range;
	if (typeof val == "number") {
		return Math.max(Math.min(...range), Math.min(Math.max(...range), val)) as T;
	} else if (!(typeof val == "number" || typeof val == "object")) {
		return val;
	} else if (Array.isArray(val)) {
		(val as any[]) = val.map(x => clamp(x, range));
	} else {
		Object.keys(val).forEach(key => {
			val[key] = clamp(val[key], range);
		});
	}
	return val;
}

/**
 * Clamps a number within a range by looping it when it extends the range on either side.
 * This function works recusively on any object or array or number.
 * @param x The number to clamp.
 * @param range The [min, max] to clamp to
 */
export function clampLoop<T extends number | string | any[] | Record<string, any>>(val: T, range: Vec2): T {
	range = range[0] > range[1] ? [range[1], range[0]] : range;
	if (typeof val == "number") {
		return (val >= 0 ? (val % (range[1] - range[0])) + range[0] : (val % (range[1] - range[0])) + range[1] - 1) as T;
	} else if (!(typeof val == "number" || typeof val == "object")) {
		return val;
	} else if (Array.isArray(val)) {
		(val as any[]) = val.map(x => clamp(x, range));
	} else {
		Object.keys(val).forEach(key => {
			val[key] = clamp(val[key], range);
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
 * Finds the midpoint between two points.
 * @param p1 The first point.
 * @param p2 The second point (must be in the same dimension as the first).
 * @param floor Whether to floor the result.
 */
export function midPoint<T extends number[]>(p1: T, p2: T, floor = false): T {
	const mp = p1.map((x, i) => (x + p2[i]) / 2);
	return (floor ? mp.map(Math.floor) : mp) as T;
}

/**
 * Get the hours, minutes, seconds, ms from a total ms value.
 * @param time The time in ms.
 */
export function msToTimeString(time: number): string {
	time = Math.round(time);
	let ms = 0,
		s = 0,
		m = 0,
		h = 0;
	if (time > 3600000) {
		h = Math.floor(time / 3600000);
		time -= 3600000 * h;
	}
	if (time > 60000) {
		m = Math.floor(time / 60000);
		time -= 60000 * m;
	}
	if (time > 1000) {
		s = Math.floor(time / 1000);
		time -= 1000 * s;
	}
	if (time) {
		ms = time;
		time -= ms;
	}
	return `${rgb(100, 150, 255) + h}h:${m}m:${s}.${ms.toString().padEnd(3, "0")}s\x1b[0m`;
}

export function bytesToString(bytes: number) {
	bytes = Math.round(bytes);
	return `${rgb(255, 255, 0)}${decimals(bytes / 1000000000, 3)}GB | ${decimals(bytes / 1000000, 3)}MB | ${bytes / 1000}KB\x1b[0m`;
}

/**
 * Multiply two rectangular or square matrices
 * @param mat1 The values for mat one (e.g., [[1,2,3],[4,5,6]])
 * @param mat2 The values for mat two (e.g., [[1,2],[3,4],[5,6]])
 */
function multiplymats(mat1: number[][], mat2: number[][]) {
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
 * @param end The end position of the vecotr.
 * @param rotation The rotation to apply.
 * @returns Vec3
 */
export function rotateVector(start: Vec3, end: Vec3, rotation: Vec3): Vec3 {
	rotation = rotation.map(x => (x * Math.PI) / 180) as Vec3;
	let pos: number[][] = [[end[0] - start[0]], [end[1] - start[1]], [end[2] - start[2]]];
	const xmat: number[][] = [
		[1, 0, 0],
		[0, Math.cos(rotation[0]), -Math.sin(rotation[0])],
		[0, Math.sin(rotation[0]), Math.cos(rotation[0])]
	];
	const ymat: number[][] = [
		[Math.cos(rotation[1]), 0, Math.sin(rotation[1])],
		[0, 1, 0],
		[-Math.sin(rotation[1]), 0, Math.cos(rotation[1])]
	];
	const zmat: number[][] = [
		[Math.cos(rotation[2]), -Math.sin(rotation[2]), 0],
		[Math.sin(rotation[2]), Math.cos(rotation[2]), 0],
		[0, 0, 1]
	];
	pos = multiplymats(zmat, pos);
	pos = multiplymats(xmat, pos);
	pos = multiplymats(ymat, pos);
	return [pos[0][0] + start[0], pos[1][0] + start[1], pos[2][0] + start[2]] as Vec3;
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
