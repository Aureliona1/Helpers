// deno-lint-ignore-file no-explicit-any
import type { TypedArray } from "@aurellis/helpers";
import { decimals, lerp, random } from "./Numbers.ts";
import type { Easing, IntTypedArray, NumberArray, UintTypedArray } from "./Types.ts";

/**
 * Remove entries from an array and return the modified array. Affects the original array, therefore you do not need to reassign.
 * @param arr The array to remove elements from.
 * @param indices The indices of the elements to remove.
 */
export function arrRem<T extends any[]>(arr: T, indices: UintTypedArray | IntTypedArray | Array<number>): T {
	indices = indices.toSorted((a, b) => a - b);
	for (let i = indices.length - 1; i >= 0; i--) {
		arr.splice(indices[i], 1);
	}
	return arr as T;
}

/**
 * Create a new array from a function of x. e.g arrFromFunction(10, x => x * 2)
 * @param length The length of the array.
 * @param func The function to run through the array.
 */
export const arrFromFunction = <T>(length: number, func: (x: number) => T): T[] => new Array(length).fill(0).map((_, i) => func(i));

export class RandomArray {
	/**
	 * Creates an array of random numbers with a seed for reproducible results.
	 * @param seed The seed for prng generation, leave blank to keep random.
	 * @param range The min/max that the numbers in the array can be.
	 * @param length The length of the array (how many numbers to generate).
	 * @param decimals The precision of the result (0 for integers).
	 */
	constructor(public seed: number | string = Math.random(), public range: [number, number] = [0, 1], public length = 2, public decimals = 5) {}
	/**
	 * Creates the array based on set parameters.
	 * @returns An array of random values.
	 */
	run(): number[] {
		return arrFromFunction(this.length, x => decimals(random(this.range[0], this.range[1], `${this.seed}blahblah${x}`), this.decimals));
	}
	/**
	 * Ensures that no two numbers in the array are identical. This is the slowest method on this class. Please only use it if you must.
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
			for (let j = 0; j < buffer && !unique; j++) {
				att = decimals(random(this.range[0], this.range[1], `${this.seed}blah${i}blah${j}`), this.decimals);
				unique = true;
				for (let j = 0; j < prev.length; j++) {
					if (att == prev[j]) {
						unique = false;
					}
				}
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
	 * @param arr2 The array or number to mulitply by.
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
	 * @param to The array or number ot lerp "to" (i.e., at fraction = 1).
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
	 * Shuffle the elements of an array.
	 * @param arr The array to shuffle.
	 * @param seed The seed for the shuffle (leave blank for random).
	 */
	static shuffle<T extends NumberArray>(arr: T, seed: number = Math.random()): T {
		const Constructor = arr.constructor as {
			new (length: number): T;
		};
		const out = new Constructor(arr.length);
		for (let i = 0; i < out.length; i++) {
			out[i] = arr[i];
		}
		const swap = (a: number, b: number) => {
			[out[a], out[b]] = [out[b], out[a]];
		};
		for (let i = 0; i < out.length; i++) {
			swap(random(0, out.length, seed + i * 26436 + 1, 0), random(0, out.length, seed + i * 2636 + 134, 0));
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
	 */
	static range(arr: NumberArray): number {
		return Math.max(...arr) - Math.min(...arr);
	}

	/**
	 * Get the numeric average (mean) of the array.
	 * @param arr The array to find the mean of.
	 */
	static mean(arr: NumberArray): number {
		return ArrOp.sum(arr) / arr.length;
	}

	/**
	 * Get the numeric median of the array.
	 * @param arr The array to find the median of.
	 */
	static median(arr: NumberArray): number {
		return arr.toSorted((a, b) => a - b)[Math.floor(arr.length / 2)];
	}

	/**
	 * Get the most common value (mode) in the array.
	 * @param arr The array to find the mode of.
	 */
	static mode(arr: NumberArray): number {
		const out: NumberArray[] = [];
		const set = [...new Set(arr)];
		for (let i = 0; i < set.length; i++) {
			let instances = 0;
			for (let j = 0; j < arr.length; j++) {
				if (set[i] == arr[j]) {
					instances++;
				}
			}
			out.push([set[i], instances]);
		}
		out.sort((a, b) => a[1] - b[1]);
		return out[out.length - 1][0];
	}

	/**
	 * Get the sum of all the elements in the array.
	 */
	static sum(arr: NumberArray): number {
		return Array.from(arr).reduce((a, b) => a + b);
	}

	/**
	 * Get the product of all the elements in the array.
	 */
	static product(arr: NumberArray): number {
		return Array.from(arr).reduce((a, b) => a * b);
	}

	/**
	 * A utility class that either operates on arrays through static methods, or provides information about an array through an instance.
	 * @param arr The array to get information about.
	 */
	constructor(public arr: T) {}

	/**
	 * Get the element with the greatest numerical value.
	 */
	get max(): number {
		return Math.max(...this.arr);
	}

	/**
	 * Get the element in the array with the least numerical value.
	 */
	get min(): number {
		return Math.min(...this.arr);
	}

	/**
	 * Get the numerical distance between the least and greatest element in the array.
	 */
	get range(): number {
		return this.max - this.min;
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
		return ArrOp.sortAscending(this.arr)[Math.floor(this.arr.length / 2)];
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
 * Interleave two Arrays. If the length differs, 0s will be added for the missing entries of the shorter array.
 * @param arr1 The first arr (this will be the first index of the resulting arr).
 * @param arr2 The second arr (this will be the last index of the resulting arr).
 */
export function interleaveArrs<T>(arr1: ArrayLike<T>, arr2: ArrayLike<T>): T[] {
	const out = new Array(Math.max(arr1.length, arr2.length) * 2);
	for (let i = 0; i < out.length; i += 2) {
		out[i] = arr1[Math.floor(i / 2)] ?? 0;
		out[i + 1] = arr2[Math.floor(i / 2)] ?? 0;
	}
	return out;
}

/**
 * Concatenate several typed arrays. The arrays must all be the same type.
 * @param arrays The list of arrays to concatenate.
 */
export function concatTypedArray<T extends TypedArray>(...arrays: T[]): T {
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
