// deno-lint-ignore-file no-explicit-any

import type { RecordKey, TypedArray } from "../type.ts";
import { toArray } from "./array.ts";

/**
 * Get the own enumerable keys of an object, including symbol keys.
 */
function ownEnumerableKeys(obj: object): (string | symbol)[] {
	return Reflect.ownKeys(obj).filter(key => Object.prototype.propertyIsEnumerable.call(obj, key));
}

/**
 * Recursively create a new instance of an object and all nested objects.
 *
 * - Arrays, typed arrays, ArrayBuffers, DataViews, Dates, RegExps, Maps and Sets are rebuilt as real instances.
 * - Map keys are kept by reference (so lookups with the original keys still work), Map values and Set items are deep copied.
 * - Plain objects and class instances keep their prototype and get copies of their own enumerable properties (string and symbol keys).
 *   Private `#fields` and non-enumerable properties are not copied.
 * - Other built-ins with internal state (Promise, WeakMap, Error, etc.) are returned as the same reference.
 * - Cyclic references are preserved in the copy.
 * @param obj The object to clone.
 * @returns A new instance of the same object.
 */
export function deepCopy<T>(obj: T): T {
	return copyValue(obj, new WeakMap());
}

function copyValue<T>(obj: T, seen: WeakMap<object, any>): T {
	if (obj === null || typeof obj !== "object") {
		return obj;
	}
	if (seen.has(obj)) {
		return seen.get(obj);
	}

	if (Array.isArray(obj)) {
		const out: any[] = new Array(obj.length);
		seen.set(obj, out);
		for (let i = 0; i < obj.length; i++) {
			out[i] = copyValue(obj[i], seen);
		}
		return out as T;
	}

	if (obj instanceof ArrayBuffer) {
		const out = obj.slice(0);
		seen.set(obj, out);
		return out as T;
	}

	if (ArrayBuffer.isView(obj)) {
		let out: ArrayBufferView;
		if (obj instanceof DataView) {
			// Copy only the bytes this view covers, not the whole underlying buffer.
			out = new DataView(obj.buffer.slice(obj.byteOffset, obj.byteOffset + obj.byteLength));
		} else {
			out = (obj as unknown as TypedArray).slice();
		}
		seen.set(obj, out);
		return out as T;
	}

	if (obj instanceof Date) {
		const out = new Date(obj.getTime());
		seen.set(obj, out);
		return out as T;
	}

	if (obj instanceof RegExp) {
		const out = new RegExp(obj.source, obj.flags);
		seen.set(obj, out);
		return out as T;
	}

	if (obj instanceof Map) {
		const out = new Map();
		seen.set(obj, out);
		for (const [key, value] of obj) {
			out.set(key, copyValue(value, seen));
		}
		return out as T;
	}

	if (obj instanceof Set) {
		const out = new Set();
		seen.set(obj, out);
		for (const item of obj) {
			out.add(copyValue(item, seen));
		}
		return out as T;
	}

	// Other built-ins hold internal state that can't be rebuilt from their keys.
	if (Object.prototype.toString.call(obj) !== "[object Object]") {
		return obj;
	}

	const out = Object.create(Object.getPrototypeOf(obj));
	seen.set(obj, out);
	for (const key of ownEnumerableKeys(obj)) {
		out[key] = copyValue((obj as any)[key], seen);
	}
	return out as T;
}

/**
 * Recursively compare any types. This function will traverse through all entries on any type of object or value to get a comparison.
 *
 * - NaN equals NaN.
 * - Dates are equal if they hold the same time.
 * - Arrays and other ArrayLikes (typed arrays, DataViews etc.) are compared element by element, so `[1, 2]` equals `new Uint8Array([1, 2])`.
 * - Maps are equal if they have the same keys (by reference) with deeply equal values.
 * - Sets are equal if each item in one has a matching item in the other (deeply, for objects).
 * - Other objects are equal if they have the same own enumerable string keys, in any order, with deeply equal values. Prototypes are not compared.
 *
 * Cyclic objects and self-references will cause this function to crash.
 * @param a First thing to compare.
 * @param b Second thing to compare.
 */
export function compare<T>(a: T, b: T): boolean {
	if (a === b) return true;
	if (typeof a === "number" && typeof b === "number") return Number.isNaN(a) && Number.isNaN(b);
	if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;

	// Date
	if (a instanceof Date !== b instanceof Date) return false;
	if (a instanceof Date && b instanceof Date) return Object.is(a.getTime(), b.getTime());

	// Map
	if (a instanceof Map !== b instanceof Map) return false;
	if (a instanceof Map && b instanceof Map) {
		if (a.size !== b.size) return false;
		for (const [key, value] of a) {
			if (!b.has(key) || !compare(value, b.get(key))) return false;
		}
		return true;
	}

	// Set
	if (a instanceof Set !== b instanceof Set) return false;
	if (a instanceof Set && b instanceof Set) {
		if (a.size !== b.size) return false;
		// Each item in b can only be matched once.
		const matched = new Set<unknown>();
		for (const item of a) {
			if (b.has(item) && !matched.has(item)) {
				matched.add(item);
				continue;
			}
			let found = false;
			for (const candidate of b) {
				if (!matched.has(candidate) && compare(item, candidate)) {
					matched.add(candidate);
					found = true;
					break;
				}
			}
			if (!found) return false;
		}
		return true;
	}

	// Array / ArrayLike
	const arrA = toArray(a);
	const arrB = toArray(b);
	if (arrA || arrB) {
		if (!arrA || !arrB || arrA.length !== arrB.length) return false;
		return arrA.every((x, i) => compare(x, arrB[i]));
	}

	// Record / Object
	const keysA = Object.keys(a);
	const keysB = Object.keys(b);
	if (keysA.length !== keysB.length) return false;
	return keysA.every(key => Object.hasOwn(b as object, key) && compare((a as any)[key], (b as any)[key]));
}

/**
 * A two-way map is a map that can be accessed by its keys or by its values.
 * If a value is used as a key, it will return the corresponding key.
 */
export class TwoWayMap<const K extends RecordKey, const V extends RecordKey> {
	/**
	 * The {key, value} mappings as a record.
	 * Only use this for referencing key/value types, use {@link TwoWayMap.get} for lookups.
	 */
	readonly map: Record<K, V>;
	/**
	 * Internal map that contains the reversed {value, key} mappings.
	 * Only use this for referencing key/value types, use {@link TwoWayMap.revGet} for lookups.
	 */
	readonly reverseMap: Record<V, K>;
	#forward: Map<K, V> = new Map();
	#backward: Map<V, K> = new Map();
	/**
	 * A two-way map is a map that can be accessed by its keys or by its values. If a value is used as a key, it will return the corresponding key.
	 *
	 * Keys keep their original types, so number keys stay numbers.
	 * @param entries The initial mappings, as a Map or an array of `[key, value]` pairs. If two keys have the same value, then each instance of the value will overwrite the reverse key.
	 */
	constructor(entries: Iterable<readonly [K, V]>);
	/**
	 * A two-way map is a map that can be accessed by its keys or by its values. If a value is used as a key, it will return the corresponding key.
	 *
	 * Object keys are always strings or symbols at runtime, so numeric keys like `{ 1: "a" }` come back from {@link TwoWayMap.revGet} as `"1"`.
	 * Use the Map or `[key, value]` pairs overload to keep number keys as numbers.
	 * @param map The initial mappings as a record. If two keys have the same value, then each instance of the value will overwrite the reverse key.
	 */
	constructor(map: Record<K, V>);
	constructor(map: Record<K, V> | Iterable<readonly [K, V]>) {
		const entries: [K, V][] = isIterable(map) ? Array.from(map, ([key, value]) => [key, value]) : ownEnumerableKeys(map).map(key => [key as K, (map as any)[key] as V]);
		for (const [key, value] of entries) {
			this.#forward.set(key, value);
			this.#backward.set(value, key);
		}
		this.map = Object.fromEntries(entries) as unknown as Record<K, V>;
		this.reverseMap = Object.fromEntries(entries.map(([key, value]) => [value, key])) as unknown as Record<V, K>;
	}
	/**
	 * Get the value at a key in the map.
	 * @param key The key to get.
	 */
	get(key: K): V {
		return this.#forward.get(key) as V;
	}
	/**
	 * Get the key corresponding to a value. If multiple keys have this value then the last one will be returned.
	 * @param value The value to get the key of.
	 */
	revGet(value: V): K {
		return this.#backward.get(value) as K;
	}
}

function isIterable(value: unknown): value is Iterable<any> {
	return value != null && typeof (value as any)[Symbol.iterator] === "function";
}
