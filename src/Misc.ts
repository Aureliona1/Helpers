// deno-lint-ignore-file no-explicit-any

import { clog } from "./Console.ts";
import type { Vec4 } from "./Types.ts";

/**
 * Recursively create a new instance of an object and all nested objects.
 * @param obj The object to clone.
 * @returns A new instance of the same object.
 */
export function deepCopy<T>(obj: T): T {
	if (obj === null || typeof obj !== "object") {
		return obj;
	}

	if (Array.isArray(obj)) {
		return obj.map(item => deepCopy(item)) as T;
	}

	const copiedObj = Object.create(Object.getPrototypeOf(obj));
	Object.keys(obj).forEach(key => {
		(copiedObj as any)[key] = deepCopy((obj as any)[key]);
	});

	return copiedObj as T;
}

/**
 * Pause code execution for a set time.
 * @param milliseconds The time (ms) to wait.
 */
export function sleep(milliseconds: number) {
	const date = Date.now();
	let currentDate;
	if (milliseconds >= 0) {
		do {
			currentDate = Date.now();
		} while (currentDate - date < milliseconds);
	}
}

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

/**
 * Ensures that a dir exists.
 */
export function ensureDir(...paths: string[]) {
	paths.forEach(path => {
		path = path.replaceAll("\\", "/");
		const dirs = path.split("/");
		let accumilator = dirs[0];
		for (let i = 1; i <= dirs.length; accumilator += `/${dirs[i++]}`) {
			try {
				Deno.statSync(accumilator);
			} catch (_) {
				try {
					Deno.mkdirSync(accumilator);
				} catch (e) {
					clog(e, "Error", "ensureDir");
				}
			}
		}
	});
}

/**
 * Ensure that a file exists, the path to teh file can be many directories deep and these directories will be created if needed.
 * @param path The path to the file to ensure.
 * @param contents The contents to place in the file if it needs to be created.
 */
export function ensureFile(path: string, contents: string | Uint8Array = new Uint8Array()) {
	path = path.replaceAll("\\", "/");
	let dir = path.split("/");
	dir = dir.slice(0, dir.length - 1);
	if (dir.length) {
		ensureDir(dir.join("/") + "/");
	}
	try {
		Deno.statSync(path);
	} catch (_) {
		try {
			if (typeof contents == "string") {
				Deno.writeTextFileSync(path, contents);
			} else {
				Deno.writeFileSync(path, contents);
			}
		} catch (e) {
			clog(e, "Error", "ensureFile");
		}
	}
}

/**
 * Recursively compare any types. This function will search through all entries on any type of object or value to get a comparison.
 * @param a First thing to compare.
 * @param b Second thing to compare.
 */
export function compare<T>(a: T, b: T): boolean {
	if (typeof a == "object") {
		if (Array.isArray(a) && Array.isArray(b)) {
			if (a.length === b.length) {
				return a.every((x, i) => compare(x, b[i]));
			}
			return false;
		} else {
			return Object.entries(a as Record<any, any>).every(x => compare(x[1], (b as Record<any, any>)[x[0]]));
		}
	}
	return a === b;
}
