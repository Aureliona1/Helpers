// deno-lint-ignore-file no-explicit-any

import { lerp } from "../math/interpolation.ts";
import { random } from "../math/math.ts";
import type { Easing, IntTypedArray, NumberArray, TypedArray, UintTypedArray, WritableArrayLike } from "../type.ts";
import { compare } from "./object.ts";

/**
 * Create an empty array of the same kind as the source.
 * Arrays and typed arrays keep their constructor, any other ArrayLike becomes a plain array.
 * @param source The array to copy the type of.
 * @param length The length of the new array.
 */
function emptyLike<V, T extends WritableArrayLike<V>>(source: WritableArrayLike<V>, length: number): T {
	if (Array.isArray(source) || (ArrayBuffer.isView(source) && !(source instanceof DataView))) {
		const Constructor = source.constructor as {
			new (length: number): T;
		};
		return new Constructor(length);
	}
	return new Array(length) as unknown as T;
}

/**
 * Remove entries from an array and return the modified array. Affects the original array, therefore you do not need to reassign.
 * Negative indices count from the end of the array. Duplicate and out-of-range indices are ignored.
 * @param arr The array to remove elements from.
 * @param indices The indices of the elements to remove.
 */
export function arrRem<T extends any[]>(arr: T, indices: UintTypedArray | IntTypedArray | Array<number>): T {
	const len = arr.length;
	const valid = new Set<number>();
	for (const index of indices) {
		const i = index < 0 ? index + len : index;
		if (Number.isInteger(i) && i >= 0 && i < len) valid.add(i);
	}
	// Remove from the end first so earlier indices stay correct.
	const descending = [...valid].sort((a, b) => b - a);
	for (const i of descending) {
		arr.splice(i, 1);
	}
	return arr;
}

/**
 * Create a new array from a function of x. e.g arrFromFunction(10, x => x * 2)
 * @param length The length of the array.
 * @param func The function to run through the array.
 */
export const arrFromFunction = <T>(length: number, func: (x: number) => T): T[] => new Array(length).fill(0).map((_, i) => func(i));

/**
 * Creates an array of random numbers with a seed for reproducible results.
 */
export class RandomArray {
	/**
	 * Creates an array of random numbers with a seed for reproducible results.
	 * @param seed The seed for prng generation, leave blank to keep random.
	 * @param range The min (incl.)/max (excl.) that the numbers in the array can be.
	 * @param length The length of the array (how many numbers to generate).
	 * @param decimals The precision of the result (0 for integers).
	 */
	constructor(
		public seed: number | string = Math.random(),
		public range: [number, number] = [0, 1],
		public length = 2,
		public decimals = 5
	) {}
	/**
	 * Creates the array based on set parameters.
	 * @returns An array of random values.
	 */
	run(): number[] {
		return arrFromFunction(this.length, x => random(this.range[0], this.range[1], `${this.seed}blahblah${x}`, this.decimals));
	}
	/**
	 * Ensures that no two numbers in the array are identical. This is the slowest method on this class. Please only use it if you must.
	 * If the range and precision can't produce enough distinct numbers, the returned array will be shorter than `length`.
	 * @param buffer The number of times to try for a unique number (prevents infinite repeats under certain circumstances).
	 * @returns An array of random values.
	 */
	runUnique(buffer = this.length): number[] {
		const map = new Map<number, boolean>();
		for (let fails = 0; fails < buffer && map.size < this.length; ) {
			const oldSize = map.size;
			map.set(random(this.range[0], this.range[1], `${this.seed}delim${map.size}delim${fails}`, this.decimals), true);
			if (map.size === oldSize) {
				fails++;
			} else {
				fails = 0;
			}
		}
		return Array.from(map.keys());
	}
	/**
	 * Ensures that no consecutive numbers are identical.
	 * If no unique number is found within `buffer` attempts, the last attempt is used even if it repeats.
	 * @param gap The number of indexes before allowing an identical number.
	 * @param buffer The number of times to try for a unique number (prevents infinite repeats under certain circumstances).
	 * @returns An array of random values.
	 */
	runUniqueConsecutive(gap = 1, buffer = this.length): number[] {
		const res: number[] = [],
			prev: number[] = [];
		for (let i = 0; i < gap; i++) {
			prev.push(NaN);
		}
		for (let i = 0; i < this.length; i++) {
			let unique = false,
				att = NaN;
			for (let attempt = 0; attempt < buffer && !unique; attempt++) {
				att = random(this.range[0], this.range[1], `${this.seed}blah${i}blah${attempt}`, this.decimals);
				unique = !prev.includes(att);
			}
			res.push(att);
			prev.push(att);
			prev.shift();
		}
		return res;
	}
}

/**
 * A utility class that provide several static and instanced methods for working with arrays.
 * All static methods do not mutate the source array/s.
 *
 * The arithmetic methods (add, subtract, multiply, divide, lerp) return the same type as the base array,
 * so typed arrays keep their usual overflow and truncation, e.g. adding 100 to 200 in a Uint8Array gives 44.
 * Pass a plain array or a Float64Array if you need exact results.
 */
export class ArrOp<T extends NumberArray> {
	/**
	 * Add an array or a number to an array.
	 * @param arr1 The base array.
	 * @param arr2 The array or number to add.
	 */
	static add<T extends NumberArray, T2 extends NumberArray>(arr1: T, arr2: number | T2): T {
		if (typeof arr2 == "number") {
			return arr1.map(x => x + arr2) as T;
		} else {
			return arr1.map((x, i) => x + (arr2[i] ?? 0)) as T;
		}
	}

	/**
	 * Subtract the entries of an array from a base array. Or subtract a single number from the base array.
	 * @param arr1 The base array.
	 * @param arr2 The array or number to subtract from the base array.
	 */
	static subtract<T extends NumberArray, T2 extends NumberArray>(arr1: T, arr2: number | T2): T {
		if (typeof arr2 == "number") {
			return arr1.map(x => x - arr2) as T;
		} else {
			return arr1.map((x, i) => x - (arr2[i] ?? 0)) as T;
		}
	}

	/**
	 * Divide an array by the elements of another array, or by a number.
	 * @param arr1 The base array.
	 * @param arr2 The array or number to divide by.
	 */
	static divide<T extends NumberArray, T2 extends NumberArray>(arr1: T, arr2: number | T2): T {
		if (typeof arr2 == "number") {
			return arr1.map(x => x / arr2) as T;
		} else {
			return arr1.map((x, i) => x / (arr2[i] ?? 1)) as T;
		}
	}

	/**
	 * Multiply an array by the elements of another array, or by a number.
	 * @param arr1 The base array.
	 * @param arr2 The array or number to multiply by.
	 */
	static multiply<T extends NumberArray, T2 extends NumberArray>(arr1: T, arr2: number | T2): T {
		if (typeof arr2 == "number") {
			return arr1.map(x => x * arr2) as T;
		} else {
			return arr1.map((x, i) => x * (arr2[i] ?? 1)) as T;
		}
	}

	/**
	 * Linearly interpolate from the values of one array to another array, or a number. If you need to lerp from a number to an array, then reverse the time value (1 - 0 instead of  0 - 1).
	 * @param from The array to lerp "from" (i.e., at fraction = 0).
	 * @param to The array or number to lerp "to" (i.e., at fraction = 1).
	 * @param fraction The fraction of interpolation (0 - 1).
	 * @param ease Optional easing to add to the lerp.
	 */
	static lerp<T extends NumberArray, T2 extends NumberArray>(from: T, to: number | T2, fraction: number, ease?: Easing): T {
		if (typeof to == "number") {
			return from.map(x => lerp(x, to, fraction, ease)) as T;
		} else {
			return from.map((x, i) => lerp(x, to[i] ?? x, fraction, ease)) as T;
		}
	}

	/**
	 * Shuffle the elements of an array (uniform Fisher-Yates shuffle).
	 * @param arr The array to shuffle.
	 * @param seed The seed for the shuffle (leave blank for random).
	 */
	static shuffle<V, T extends WritableArrayLike<V>>(arr: T, seed: number | string = Math.random()): T {
		const out = emptyLike<V, T>(arr, arr.length);
		for (let i = 0; i < out.length; i++) {
			out[i] = arr[i];
		}
		for (let i = out.length - 1; i > 0; i--) {
			// Pick from 0 to i inclusive (max is exclusive in random).
			const j = random(0, i + 1, `${seed}|${i}`, 0);
			[out[i], out[j]] = [out[j], out[i]];
		}
		return out;
	}

	/**
	 * Sort an array in ascending order according to each element's numerical value.
	 * @param arr The array to sort.
	 */
	static sortAscending<T extends NumberArray>(arr: T): T {
		return arr.toSorted((a, b) => a - b) as T;
	}

	/**
	 * Sort an array in descending order according to each element's numerical value.
	 * @param arr The array to sort.
	 */
	static sortDescending<T extends NumberArray>(arr: T): T {
		return arr.toSorted((a, b) => b - a) as T;
	}

	/**
	 * Get the total numeric range of the array. i.e., the distance between the greatest and least elements.
	 * @param arr The array.
	 * @returns The range, or NaN for an empty array.
	 */
	static range(arr: NumberArray): number {
		if (arr.length === 0) return NaN;
		const op = new ArrOp(arr);
		return op.max - op.min;
	}

	/**
	 * Get the numeric average (mean) of the array.
	 * @param arr The array to find the mean of.
	 * @returns The mean, or NaN for an empty array.
	 */
	static mean(arr: NumberArray): number {
		if (arr.length === 0) return NaN;
		return ArrOp.sum(arr) / arr.length;
	}

	/**
	 * Get the numeric median of the array. For even lengths this is the average of the two middle values.
	 * @param arr The array to find the median of.
	 * @returns The median, or NaN for an empty array.
	 */
	static median(arr: NumberArray): number {
		if (arr.length === 0) return NaN;
		const sorted = arr.toSorted((a, b) => a - b);
		const mid = Math.floor(arr.length / 2);
		if (arr.length & 1) return sorted[mid];
		return lerp(sorted[mid - 1], sorted[mid], 0.5);
	}

	/**
	 * O(n) function to find the most common value in an array.
	 * If several values tie for the highest count, the one that reaches that count first is returned.
	 * @param arr The array to find the mode of.
	 * @returns The mode, or NaN for an empty array.
	 */
	static mode(arr: NumberArray): number {
		if (arr.length === 0) return NaN;
		const counts = new Map<number, number>();
		let mode = arr[0];
		let maxCount = 0;
		for (let i = 0; i < arr.length; i++) {
			const count = (counts.get(arr[i]) ?? 0) + 1;
			counts.set(arr[i], count);
			if (count > maxCount) {
				maxCount = count;
				mode = arr[i];
			}
		}
		return mode;
	}

	/**
	 * Get the sum of all the elements in the array.
	 * @returns The sum, or 0 for an empty array.
	 */
	static sum(arr: NumberArray): number {
		let total = 0;
		for (let i = 0; i < arr.length; i++) total += arr[i];
		return total;
	}

	/**
	 * Get the product of all the elements in the array.
	 * @returns The product, or 1 for an empty array.
	 */
	static product(arr: NumberArray): number {
		let total = 1;
		for (let i = 0; i < arr.length; i++) total *= arr[i];
		return total;
	}

	/**
	 * Interleave multiple of the same type of array together.
	 * If the length of the arrays differ, the longer arrays will be chopped to the length of the shortest one.
	 * @param arrays The arrays to interleave.
	 * @returns The interleaved array.
	 * @throws If no arrays are given, since the output type can't be inferred.
	 */
	static interleave<V, T extends WritableArrayLike<V>>(...arrays: T[]): T {
		if (arrays.length === 0) throw new Error("Cannot infer array type from empty input...");
		let shortest = arrays[0].length;
		for (const a of arrays) shortest = Math.min(shortest, a.length);
		const output = emptyLike<V, T>(arrays[0], shortest * arrays.length);
		for (let i = 0; i < output.length; i++) {
			output[i] = arrays[i % arrays.length][Math.floor(i / arrays.length)];
		}
		return output;
	}

	/**
	 * O(n) de-duplication function on any writeable ArrayLike. Keeps the first instance of each item.
	 * Items are compared like a Set does: primitives by value (NaN equals NaN), objects by reference.
	 * Use {@link ArrOp.deDuplicateFull} to treat structurally equal objects as duplicates.
	 * @param array The array to de-duplicate.
	 */
	static deDuplicateLite<V, T extends WritableArrayLike<V>>(array: T): T {
		const seen = new Set<V>();
		const unique: V[] = [];
		for (let i = 0; i < array.length; i++) {
			if (!seen.has(array[i])) {
				seen.add(array[i]);
				unique.push(array[i]);
			}
		}
		const output = emptyLike<V, T>(array, unique.length);
		for (let i = 0; i < unique.length; i++) {
			output[i] = unique[i];
		}
		return output;
	}

	/**
	 * O(n^2) de-duplication function on any writable ArrayLike. Keeps the first instance of each item.
	 * @param array The array to de-duplicate.
	 * @param condition The condition to check for duplication. If this returns truthy value, then the value is considered a duplicate. (Default - {@link compare compare(a, b)})
	 * @example
	 * ```ts
	 * ArrOp.deDuplicateFull([1, 2, 3, 4, 5, 4, 3, 2, 1]) // [1, 2, 3, 4, 5]
	 * ```
	 */
	static deDuplicateFull<T extends WritableArrayLike<any>>(array: T, condition: (a: T[number], b: T[number]) => boolean = compare): T {
		const unique: T[number][] = [];
		for (let i = 0; i < array.length; i++) {
			let duplicate = false;
			for (let j = 0; j < unique.length && !duplicate; j++) {
				duplicate = !!condition(unique[j], array[i]);
			}
			if (!duplicate) {
				unique.push(array[i]);
			}
		}
		const output = emptyLike<any, T>(array, unique.length);
		for (let i = 0; i < unique.length; i++) {
			output[i] = unique[i];
		}
		return output;
	}

	/**
	 * A utility class that either operates on arrays through static methods, or provides information about an array through an instance.
	 * @param arr The array to get information about.
	 */
	constructor(public arr: T) {}

	/**
	 * Get the element with the greatest numerical value, or NaN for an empty array.
	 */
	get max(): number {
		if (this.arr.length === 0) return NaN;
		let m = this.arr[0];
		for (let i = 1; i < this.arr.length; i++) {
			if (this.arr[i] > m) m = this.arr[i];
		}
		return m;
	}

	/**
	 * Get the element in the array with the least numerical value, or NaN for an empty array.
	 */
	get min(): number {
		if (this.arr.length === 0) return NaN;
		let m = this.arr[0];
		for (let i = 1; i < this.arr.length; i++) {
			if (this.arr[i] < m) m = this.arr[i];
		}
		return m;
	}

	/**
	 * Get the numerical distance between the least and greatest element in the array.
	 */
	get range(): number {
		return ArrOp.range(this.arr);
	}

	/**
	 * Get the average (mean) of the values in the array.
	 */
	get mean(): number {
		return ArrOp.mean(this.arr);
	}

	/**
	 * Get the median value of the array.
	 */
	get median(): number {
		return ArrOp.median(this.arr);
	}

	/**
	 * Get the most common value (mode) of the array.
	 */
	get mode(): number {
		return ArrOp.mode(this.arr);
	}

	/**
	 * Get the product of all the elements of the array.
	 */
	get product(): number {
		return ArrOp.product(this.arr);
	}

	/**
	 * Get the sum of all the elements of the array.
	 */
	get sum(): number {
		return ArrOp.sum(this.arr);
	}
}

/**
 * Concatenate several typed arrays. The arrays must all be the same type.
 * @param arrays The list of arrays to concatenate.
 */
export function concatTypedArrays<T extends TypedArray>(...arrays: T[]): T {
	if (arrays.length === 0) throw new Error("Cannot infer array type from empty input...");
	const newLength = arrays.reduce((sum, b) => sum + b.length, 0);
	const Constructor = arrays[0].constructor as {
		new (length: number): T;
	};
	const out = new Constructor(newLength);
	let offset = 0;
	for (const b of arrays) {
		out.set(b, offset);
		offset += b.length;
	}
	return out;
}

/**
 * Attempt to coerce the value into an array.
 * @param value The value to coerce.
 * @returns Array form of the input value, or null if coercion failed.
 */
export function toArray(value: any): any[] | null {
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

	return null;
}
