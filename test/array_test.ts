import { arrFromFunction, ArrOp, arrRem, concatTypedArrays, RandomArray } from "../src/Arrays.ts";
import { compare } from "../src/Misc.ts";
import { assert } from "./assert.ts";

Deno.test({
	name: "Array Remove",
	fn: () => {
		const arr = [0, 1, 2, 3, 4, 5, 4, 3, 2, 1];
		const indices = [5, 0, 2];
		arrRem(arr, indices);
		assert(compare(arr, [1, 3, 4, 4, 3, 2, 1]));
	}
});

Deno.test({
	name: "Array From function",
	fn: () => {
		assert(
			compare(
				arrFromFunction(5, x => x.toString(2)),
				["0", "1", "10", "11", "100"]
			)
		);
	}
});

Deno.test({
	name: "Unique Random Array",
	fn: () => {
		for (let n = 10; n < 100; n++) {
			const arr = new RandomArray(n, [0, n], n, 2).runUnique();
			assert(arr.every((x, i, a) => !a.filter((y, j) => j !== i && x === y).length));
		}
	}
});

Deno.test({
	name: "Unique Consecutive Array",
	fn: () => {
		for (let n = 10; n < 100; n++) {
			const gap = Math.floor(n / 10);
			const arr = new RandomArray(n, [0, n], n, 2).runUniqueConsecutive(gap);
			for (let i = 0; i < n - gap; i++) {
				const window = arr.slice(i, i + gap);
				assert(window.every((x, j, a) => !a.filter((y, k) => j !== k && x === y).length));
			}
		}
	}
});

Deno.test({
	name: "Array Add",
	fn: () => {
		assert(compare(ArrOp.add([1, 2, 3], [6, 5, 4]), [7, 7, 7]));
	}
});

Deno.test({
	name: "Array Add Number",
	fn: () => {
		assert(compare(ArrOp.add([1, 2, 3], 5), [6, 7, 8]));
	}
});

Deno.test({
	name: "Array Sub",
	fn: () => {
		assert(compare(ArrOp.subtract([1, 2, 3], [4, 5, 6]), [-3, -3, -3]));
	}
});

Deno.test({
	name: "Array Sub Number",
	fn: () => {
		assert(compare(ArrOp.subtract([1, 2, 3], 2), [-1, 0, 1]));
	}
});

Deno.test({
	name: "Array Divide",
	fn: () => {
		assert(compare(ArrOp.divide([10, 20, 30], [1, 2, 3]), [10, 10, 10]));
	}
});

Deno.test({
	name: "Array Divide Number",
	fn: () => {
		assert(compare(ArrOp.divide([10, 20, 30], 10), [1, 2, 3]));
	}
});

Deno.test({
	name: "Array Multiply",
	fn: () => {
		assert(compare(ArrOp.multiply([1, 2, 3], [4, 5, 6]), [4, 10, 18]));
	}
});

Deno.test({
	name: "Array Multiply Number",
	fn: () => {
		assert(compare(ArrOp.multiply([1, 2, 3], 2), [2, 4, 6]));
	}
});

Deno.test({
	name: "Array Lerp",
	fn: () => {
		assert(compare(ArrOp.lerp([1, 2, 3], [4, 5, 6], 0.5), [2.5, 3.5, 4.5]));
	}
});

Deno.test({
	name: "Array Lerp Number",
	fn: () => {
		assert(compare(ArrOp.lerp([1, 2, 3], 0, 0.5), [0.5, 1, 1.5]));
	}
});

Deno.test({
	name: "Array Shuffle",
	fn: () => {
		const shuffled = ArrOp.shuffle(arrFromFunction(10, x => x));
		// Ensure that all numbers are still present.
		assert(arrFromFunction(10, x => x).every(x => shuffled.includes(x)));
		// Ensure that at least one number has changed position.
		assert(shuffled.some((x, i) => x !== i));
	}
});

Deno.test({
	name: "Array Sort Asc",
	fn: () => {
		assert(compare(ArrOp.sortAscending([5, 3, 4, 2, 1]), [1, 2, 3, 4, 5]));
	}
});

Deno.test({
	name: "Array Sort Desc",
	fn: () => {
		assert(compare(ArrOp.sortDescending([5, 3, 4, 1, 2]), [5, 4, 3, 2, 1]));
	}
});

Deno.test({
	name: "Array Range",
	fn: () => {
		assert(compare(ArrOp.range([1, 2, 3, 4, 5]), 4));
	}
});

Deno.test({
	name: "Array Mean",
	fn: () => {
		assert(compare(ArrOp.mean([0, 1, 2, 3, 4, 5]), 2.5));
	}
});

Deno.test({
	name: "Array Median",
	fn: () => {
		assert(compare(ArrOp.median([1, 2, 3, 4, 5]), 3));
	}
});

Deno.test({
	name: "Array Mode",
	fn: () => {
		assert(compare(ArrOp.mode([1, 2, 3, 2]), 2));
	}
});

Deno.test({
	name: "Array Sum",
	fn: () => {
		assert(compare(ArrOp.sum([1, 2, 3]), 6));
	}
});

Deno.test({
	name: "Array Product",
	fn: () => {
		assert(compare(ArrOp.product([1, 2, 3]), 6));
	}
});

Deno.test({
	name: "Interleave Arrays",
	fn: () => {
		const arr1 = [1, 3, 5];
		const arr2 = [2, 4, 6];
		assert(compare(ArrOp.interleave(arr1, arr2), [1, 2, 3, 4, 5, 6]));
	}
});

Deno.test({
	name: "Concat Typed Array",
	fn: () => {
		assert(compare(concatTypedArrays(new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6])), new Uint8Array([1, 2, 3, 4, 5, 6])));
	}
});
