// deno-lint-ignore-file no-explicit-any

import { lerp } from "./Interpolation.ts";
import { decimals, random } from "./Numbers.ts";
import type { Easing } from "./Types.ts";

/**
 * A type representing any array type that contains numbers.
 */
export type NumberArrLike = Uint16Array | Uint32Array | Uint8Array | Int16Array | Int32Array | Int8Array | Float16Array | Float32Array | Float64Array | Array<number>;

/**
 * Remove entries from an arr and return the modified arr. Affects the original arr, therefore you do not need to reassign.
 * @param arr The arr to remove elements from.
 * @param indexes The indexes of the elements to remove.
 */
export function arrRem<T extends any[]>(arr: T, indexes: number[]): T {
	for (let i = indexes.length - 1; i >= 0; i--) {
		arr.splice(indexes[i], 1);
	}
	return arr as T;
}

/**
 * Create a new array from a function of x. e.g arrFromFunction(10, x => x * 2)
 * @param length The length of the array.
 * @param func The function to run through the array.
 */
export const arrFromFunction = <T>(length: number, func: (x: number) => T): T[] => new Array(length).fill(0).map((_, i) => func(i));

export class randArray {
	/**
	 * Creates an arr of random numbers with a seed for reproducible results.
	 * @param seed The seed for prng generation, leave blank to keep random.
	 * @param range The min/max that the numbers in the arr can be.
	 * @param length The length of the arr (how many numbers to generate).
	 * @param decimals The precision of the result (0 for integers).
	 */
	constructor(public seed: number | string = Math.random(), public range: [number, number] = [0, 1], public length = 2, public decimals = 5) {}
	/**
	 * Creates the arr based on set parameters.
	 * @returns An arr of random values.
	 */
	run(): number[] {
		return arrFromFunction(this.length, x => decimals(random(this.range[0], this.range[1], `${this.seed}blahblah${x}`), this.decimals));
	}
	/**
	 * Ensures that no two numbers in the arr are identical. This is the slowest method on this class. Please only use it if you must.
	 * @param buffer The number of times to try for a unique number (prevents infinite repeats under certain circumstances).
	 * @returns An arr of random values.
	 */
	runUnique(buffer = this.length): number[] {
		const res: number[] = [];
		for (let i = 0; i < this.length; i++) {
			let unique = false,
				att = NaN;
			for (let j = 0; j < buffer && !unique; j++) {
				att = decimals(random(this.range[0], this.range[1], `${this.seed}blah${i}blah${j}`), this.decimals);
				unique = true;
				res.forEach(x => {
					if (x == att) {
						unique = false;
					}
				});
			}
			res.push(att);
		}
		return res;
	}
	/**
	 * Ensures that no consecutive numbers are identical.
	 * @param gap The number of indexes before allowing an identical number.
	 * @param buffer The number of times to try for a unique number (prevents infinite repeats under certain circumstances).
	 * @returns An arr of random values.
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

export class ArrOp<T extends NumberArrLike> {
	/**
	 * Add an array or a number to an array.
	 * @param arr1 The base array.
	 * @param arr2 The array or number to add.
	 */
	static add<T extends NumberArrLike, T2 extends NumberArrLike>(arr1: T, arr2: number | T2): T {
		if (typeof arr2 == "number") {
			return arr1.map(x => x + arr2) as T;
		} else {
			return arr1.map((x, i) => x + arr2[i]) as T;
		}
	}

	/**
	 * Subtract the entries of an array from a base array. Or subtract a single number from the base array.
	 * @param arr1 The base array.
	 * @param arr2 The array or number to subtract from the base array.
	 */
	static subtract<T extends NumberArrLike, T2 extends NumberArrLike>(arr1: T, arr2: number | T2): T {
		if (typeof arr2 == "number") {
			return arr1.map(x => x - arr2) as T;
		} else {
			return arr1.map((x, i) => x - arr2[i]) as T;
		}
	}

	/**
	 * Divide an array by the elements of another array, or by a number.
	 * @param arr1 The base array.
	 * @param arr2 The array or number to divide by.
	 */
	static divide<T extends NumberArrLike, T2 extends NumberArrLike>(arr1: T, arr2: number | T2): T {
		if (typeof arr2 == "number") {
			return arr1.map(x => x / arr2) as T;
		} else {
			return arr1.map((x, i) => x / arr2[i]) as T;
		}
	}

	/**
	 * Multiply an array by the elements of another array, or by a number.
	 * @param arr1 The base array.
	 * @param arr2 The array or number to mulitply by.
	 */
	static multiply<T extends NumberArrLike, T2 extends NumberArrLike>(arr1: T, arr2: number | T2): T {
		if (typeof arr2 == "number") {
			return arr1.map(x => x * arr2) as T;
		} else {
			return arr1.map((x, i) => x * arr2[i]) as T;
		}
	}

	/**
	 * Linearly interpolate from the values of one array to another array, or a number. If you need to lerp from a number to an array, then reverse the time value (1 - 0 instead of  0 - 1).
	 * @param from The array to lerp "from" (i.e., at fraction = 0).
	 * @param to The array or number ot lerp "to" (i.e., at fraction = 1).
	 * @param fraction The fraction of interpolation (0 - 1).
	 * @param ease Optional easing to add to the lerp.
	 */
	static lerp<T extends NumberArrLike, T2 extends NumberArrLike>(from: T, to: number | T2, fraction: number, ease?: Easing): T {
		if (typeof to == "number") {
			return from.map(x => lerp(x, to, fraction, ease)) as T;
		} else {
			return from.map((x, i) => lerp(x, to[i], fraction, ease)) as T;
		}
	}

	/**
	 * Shuffle the elements of an array.
	 * @param arr The array to shuffle.
	 * @param seed The seed for the shuffle (leave blank for random).
	 */
	static shuffle<T extends NumberArrLike>(arr: T, seed: number = Math.random()): T {
		const swap = (a: number, b: number) => {
			[arr[a], arr[b]] = [arr[b], arr[a]];
		};
		for (let i = 0; i < arr.length; i++) {
			swap(random(0, arr.length, seed + i * 26436 + 1, 0), random(0, arr.length, seed + i * 2636 + 134, 0));
		}
		return arr;
	}

	/**
	 * Sort an array in ascending order according to each element's numerical value.
	 * @param arr The array to sort.
	 */
	static sortNumericAsc<T extends NumberArrLike>(arr: T): T {
		return arr.sort((a, b) => a - b) as T;
	}

	/**
	 * Sort an array in descending order according to each element's numerical value.
	 * @param arr The array to sort.
	 */
	static sortNumericDsc<T extends NumberArrLike>(arr: T): T {
		return arr.sort((a, b) => b - a) as T;
	}

	/**
	 * Get the total numeric range of the array. i.e., the distance between the greatest and least elements.
	 * @param arr The array.
	 */
	static range(arr: NumberArrLike): number {
		return Math.max(...arr) - Math.min(...arr);
	}

	/**
	 * Get the numeric average (mean) of the array.
	 * @param arr The array to find the mean of.
	 */
	static mean(arr: NumberArrLike): number {
		return [...arr].reduce((a, b) => a + b) / arr.length;
	}

	/**
	 * Get the numeric median of the array.
	 * @param arr The array to find the median of.
	 */
	static median(arr: NumberArrLike): number {
		return arr.toSorted((a, b) => a - b)[Math.floor(arr.length / 2)];
	}

	/**
	 * Get the most common value (mode) in the array.
	 * @param arr The array to find the mode of.
	 */
	static mode(arr: NumberArrLike): number {
		const out: NumberArrLike[] = [];
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
	static sum(arr: NumberArrLike): number {
		return Array.from(arr).reduce((a, b) => a + b);
	}

	/**
	 * Get the product of all the elements in the array.
	 */
	static product(arr: NumberArrLike): number {
		return Array.from(arr).reduce((a, b) => a * b);
	}

	constructor(public arr: T) {}

	/**
	 * Get the element with the greatest numerical value.
	 */
	get max(): number {
		return Math.max(...this.arr);
	}

	/**
	 * Clamp the maximum value in the array to this value.
	 */
	set max(x: number) {
		this.arr.forEach(a => {
			a = a > x ? x : a;
		});
	}

	/**
	 * Clamp the minimum value in the array to this value.
	 */
	set min(x: number) {
		this.arr.forEach(a => {
			a = a < x ? x : a;
		});
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
		return Array.from(this.arr).reduce((a, b) => a + b) / this.arr.length;
	}

	/**
	 * Get the median value of the array.
	 */
	get median(): number {
		return this.arr.toSorted((a, b) => a - b)[Math.floor(this.arr.length / 2)];
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
		return Array.from(this.arr).reduce((a, b) => a * b);
	}

	/**
	 * Get the sum of all the elements of the array.
	 */
	get sum(): number {
		return Array.from(this.arr).reduce((a, b) => a + b);
	}
}

/**
 * Interleave two Arrays. If the length differs, 0s will be added for the missing entries of the shorter arr.
 * @param arr1 The first arr (this will be the first index of the resulting arr).
 * @param arr2 The second arr (this will be the last index of the resulting arr).
 * @returns T[]
 */
export function interleaveArrs<T>(arr1: ArrayLike<T>, arr2: ArrayLike<T>): T[] {
	const out = new Array(arr1.length + arr2.length);
	for (let i = 0; i < arr1.length; i++) {
		out[i * 2] = arr1[i] ?? 0;
		out[i * 2 + 1] = arr2[i] ?? 0;
	}
	return out;
}

/**
 * Concatenate 2 Uint8Arrays.
 */
export function concatUint8(a: Uint8Array, b: Uint8Array): Uint8Array {
	const out = new Uint8Array(a.length + b.length);
	out.set(a);
	out.set(b, a.length);
	return out;
}
