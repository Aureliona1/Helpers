// deno-lint-ignore-file no-explicit-any

import { clog } from "./Console.ts";
import type { RecordKey, TypedArray, Vec4 } from "./Types.ts";

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
 * Block the main thread for a set time.
 * @param milliseconds The time (ms) to wait.
 */
export function sleepSync(milliseconds: number) {
	const date = Date.now();
	let currentDate;
	if (milliseconds >= 0) {
		do {
			currentDate = Date.now();
		} while (currentDate - date < milliseconds);
	}
}

/**
 * Pause execution for a set time, must be used with await.
 * @param milliseconds The time (ms) to wait.
 */
export async function sleep(milliseconds: number): Promise<void> {
	return await new Promise(r => setTimeout(r, milliseconds));
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
 * Check whether a file or directory path can be accessed.
 *
 * This ensures:
 *
 * - The path exists
 * - The path has read permissions
 * - The directory tree to the path has read permissions
 * - `Deno.read` variants will work on this path.
 * @param path The path to the path to check.
 */
export function pathAccessibleSync(path: string): boolean {
	try {
		Deno.statSync(path);
		return true;
	} catch (_) {
		return false;
	}
}

/**
 * Check whether a file or directory path can be accessed.
 *
 * This ensures:
 *
 * - The path exists
 * - The path has read permissions
 * - The directory tree to the path has read permissions
 * - `Deno.read` variants will work on this path.
 * @param path The path to the path to check.
 */
export async function pathAccessible(path: string): Promise<boolean> {
	try {
		await Deno.stat(path);
		return true;
	} catch (_) {
		return false;
	}
}

/**
 * Ensures that a dir exists.
 */
export function ensureDirSync(...paths: string[]) {
	for (const raw of paths) {
		const path = raw.replaceAll("\\", "/");
		try {
			Deno.mkdirSync(path, { recursive: true });
		} catch (e) {
			if (!(e instanceof Deno.errors.AlreadyExists)) {
				clog(e, "Error", "ensureDir");
			}
		}
	}
}

/**
 * Ensures that a dir exists.
 */
export async function ensureDir(...paths: string[]) {
	for (const raw of paths) {
		const path = raw.replaceAll("\\", "/");
		try {
			await Deno.mkdir(path, { recursive: true });
		} catch (e) {
			if (!(e instanceof Deno.errors.AlreadyExists)) {
				clog(e, "Error", "ensureDir");
			}
		}
	}
}

/**
 * Ensure that a file exists, the path to the file can be many directories deep and these directories will be created if needed.
 * @param path The path to the file to ensure.
 * @param contents The contents to place in the file if it needs to be created.
 */
export function ensureFileSync(path: string, contents: string | Uint8Array = new Uint8Array()) {
	path = path.replaceAll("\\", "/");
	const dir = path.substring(0, path.lastIndexOf("/"));
	if (dir) {
		ensureDirSync(dir);
	}
	try {
		Deno.writeFileSync(path, typeof contents === "string" ? new TextEncoder().encode(contents) : contents, { createNew: true });
	} catch (e) {
		if (!(e instanceof Deno.errors.AlreadyExists)) {
			clog(e, "Error", "ensureFile");
		}
	}
}

/**
 * Ensure that a file exists, the path to the file can be many directories deep and these directories will be created if needed.
 * @param path The path to the file to ensure.
 * @param contents The contents to place in the file if it needs to be created.
 */
export async function ensureFile(path: string, contents: string | Uint8Array = new Uint8Array()) {
	path = path.replaceAll("\\", "/");
	const dir = path.substring(0, path.lastIndexOf("/"));
	if (dir) {
		await ensureDir(dir);
	}
	try {
		await Deno.writeFile(path, typeof contents === "string" ? new TextEncoder().encode(contents) : contents, { createNew: true });
	} catch (e) {
		if (!(e instanceof Deno.errors.AlreadyExists)) {
			clog(e, "Error", "ensureFile");
		}
	}
}

/**
 * Attempt to coerce the value into an array.
 * @param value The value to coerce.
 * @returns Array form of the input value, or empty array if coercion failed.
 */
export function toArray(value: any): any[] {
	if (Array.isArray(value)) {
		return value;
	}
	if (value instanceof ArrayBuffer) {
		return Array.from(new Uint8Array(value));
	}

	// Typed Arrays and DataViews
	if (ArrayBuffer.isView(value)) {
		if (value instanceof DataView) {
			const arr = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
			return Array.from(arr);
		} else {
			return Array.from(value as TypedArray);
		}
	}

	// Other ArrayLikes
	if (value != null && typeof value.length === "number") {
		const result = [];
		for (let i = 0; i < value.length; i++) {
			result.push(value[i]);
		}
		return result;
	}

	return [];
}

/**
 * Recursively compare any types. This function will traverse through all entries on any type of object or value to get a comparison.
 * Cyclic objects and self-references will cause this function to crash.
 * @param a First thing to compare.
 * @param b Second thing to compare.
 */
export function compare<T>(a: T, b: T): boolean {
	if (typeof a === "object" && !(a instanceof Date)) {
		// Array
		const arr = toArray(a);
		const brr = toArray(b);
		if (arr.length && brr.length) {
			if (arr.length === brr.length) {
				return arr.every((x, i) => compare(x, brr[i]));
			}
			return false;
		}
		// Map
		else if (a instanceof Map && b instanceof Map) {
			if (a.size === b.size) {
				return a.entries().every(x => compare(x[1], b.get(x[0])));
			}
			return false;
		}
		// Set
		else if (a instanceof Set && b instanceof Set) {
			const oldSize = a.size;
			return oldSize === a.union(b).size;
		}
		// Record / Object
		else {
			return Object.entries(a as Record<any, any>).every(x => compare(x[1], (b as Record<any, any>)[x[0]]));
		}
	}
	return a === b;
}

/**
 * A two-way map is a map that can be accessed by its keys or by its values.
 * If a value is used as a key, it will return the corresponding key.
 */
export class TwoWayMap<const K extends RecordKey, const V extends RecordKey> {
	/**
	 * Internal map that contains the reversed {value, key} mappings.
	 * Only use this for referencing key/value types.
	 */
	readonly reverseMap: Record<V, K>;
	/**
	 * A two-way map is a map that can be accessed by its keys or by its values. If a value is used as a key, it will return the corresponding key.
	 * @param map The initial map. If two keys have the same value, then each instance of the value will overwrite the reverse key.
	 */
	constructor(public readonly map: Record<K, V>) {
		this.reverseMap = Object.fromEntries(Object.entries(map).map(x => [x[1], x[0]]));
	}
	/**
	 * Get the value at a key in the map.
	 * @param key The key to get.
	 */
	get(key: K): V {
		return this.map[key];
	}
	/**
	 * Get the key corresponding to a value. If multiple keys have this value then the last one will be returned.
	 * @param value The value to get the key of.
	 */
	revGet(value: V): K {
		return this.reverseMap[value];
	}
}
