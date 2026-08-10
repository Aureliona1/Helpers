// deno-lint-ignore-file no-explicit-any

import type { RecordKey, TypedArray } from "../type.ts";
import { toArray } from "./array.ts";

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

	if (ArrayBuffer.isView(obj)) {
		if (obj instanceof DataView) {
			return new DataView(obj.buffer.slice()) as T;
		} else {
			return (obj as unknown as TypedArray).slice() as T;
		}
	}

	const copiedObj = Object.create(Object.getPrototypeOf(obj));
	Object.keys(obj).forEach(key => {
		(copiedObj as any)[key] = deepCopy((obj as any)[key]);
	});

	return copiedObj as T;
}

/**
 * Recursively compare any types. This function will traverse through all entries on any type of object or value to get a comparison.
 * Cyclic objects and self-references will cause this function to crash.
 * @param a First thing to compare.
 * @param b Second thing to compare.
 */
export function compare<T>(a: T, b: T): boolean {
	if (typeof a === "object" && !(a instanceof Date) && a !== null) {
		// Array
		const arr = toArray(a);
		const brr = toArray(b);
		if (arr && brr) {
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
			return compare(Object.getOwnPropertyNames(a), Object.getOwnPropertyNames(b)) && Object.entries(a as Record<any, any>).every(x => compare(x[1], (b as Record<any, any>)[x[0]]));
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
