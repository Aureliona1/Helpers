// deno-lint-ignore-file no-explicit-any

import { Vec4 } from "./Types.ts";

/**
 * Creates a new instance of an object, recursively.
 * @param obj Object to clone.
 */
export function copy<T>(obj: T): T {
	if (obj === null || typeof obj !== "object") {
		return obj;
	}

	const newObj = Array.isArray(obj) ? [] : {};
	const keys = Object.getOwnPropertyNames(obj);

	keys.forEach(x => {
		const value = copy((obj as any)[x]);
		(newObj as any)[x] = value;
	});

	Object.setPrototypeOf(newObj, obj as any);
	return newObj as T;
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
export function hsv2rgb(color: Vec4) {
	const [h, s, v, a] = color;
	const f = (n: number, k = (n + h * 6) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
	return [f(5), f(3), f(1), a] as Vec4;
}

/**
 * Convert rgba to hsva.
 * @param color The rgba color (linear rgb 0-1).
 */
export function rgb2hsv(color: Vec4) {
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
export function byteHsvToRgb(hsv: Uint8Array) {
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
export function byteRgbToHsv(rgb: Uint8Array) {
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
					console.error(e);
				}
			}
		}
	});
}

/**
 * Ensure that a file exists.
 */
export function ensureFile(path: string) {
	path = path.replaceAll("\\", "/");
	let dir = path.split("/");
	dir = dir.slice(0, dir.length - 1);
	ensureDir(dir.join("/") + "/");
	try {
		Deno.statSync(path);
	} catch (_) {
		try {
			Deno.writeFileSync(path, new Uint8Array());
		} catch (e) {
			console.error(e);
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
