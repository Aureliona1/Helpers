import { arrFromFunction, ArrOp, arrRem, compare, concatTypedArrays, RandomArray, toArray } from "@aurellis/helpers";
import { assert } from "./assert.ts";

/** Compare values of different types (e.g., a typed array against a plain array). */
const eq = (a: unknown, b: unknown): boolean => compare(a, b);

/** Returns true if the function throws. */
function throws(fn: () => unknown): boolean {
	try {
		fn();
	} catch {
		return true;
	}
	return false;
}

Deno.test({
	name: "Array Remove",
	fn: () => {
		const arr = [0, 1, 2, 3, 4, 5, 4, 3, 2, 1];
		arrRem(arr, [5, 0, 2]);
		assert(compare(arr, [1, 3, 4, 4, 3, 2, 1]));

		// Duplicate indices only remove one element.
		const dupes = ["a", "b", "c", "d"];
		arrRem(dupes, [1, 1]);
		assert(compare(dupes, ["a", "c", "d"]));

		// Negative indices count from the end, out-of-range indices are ignored.
		const negative = [0, 1, 2, 3];
		arrRem(negative, [-1, 10, -10]);
		assert(compare(negative, [0, 1, 2]));

		const typedIndices = [0, 1, 2, 3];
		arrRem(typedIndices, new Int8Array([-2, 0]));
		assert(compare(typedIndices, [1, 3]));
	}
});

Deno.test({
	name: "Array From Function",
	fn: () => {
		assert(
			compare(
				arrFromFunction(5, x => x.toString(2)),
				["0", "1", "10", "11", "100"]
			)
		);
		assert(
			compare(
				arrFromFunction(10, x => x),
				Array.from(new Array(10).keys())
			)
		);
	}
});

Deno.test({
	name: "Random Array",
	fn: () => {
		const arr = new RandomArray("spread", [0, 1], 1000).run();
		assert(arr.length === 1000);
		assert(arr.every(x => x >= 0 && x < 1));
		// Values should cover the whole range, not cluster.
		const op = new ArrOp(arr);
		assert(op.mean > 0.45 && op.mean < 0.55);
		assert(op.min < 0.05 && op.max > 0.95);
		// Indices with the same digits in a different order used to produce identical values.
		assert(arr[12] !== arr[21]);
		// Same seed, same result.
		assert(compare(arr, new RandomArray("spread", [0, 1], 1000).run()));
	}
});

Deno.test({
	name: "Random Array Unique",
	fn: () => {
		for (let n = 10; n < 100; n++) {
			const arr = new RandomArray(n, [0, n], n, 2).runUnique();
			assert(arr.length === n);
			assert(new Set(arr).size === arr.length);
			assert(arr.every(x => x >= 0 && x < n));
		}
	}
});

Deno.test({
	name: "Random Array Unique Consecutive",
	fn: () => {
		for (let n = 10; n < 100; n++) {
			const gap = Math.floor(n / 10);
			const arr = new RandomArray(n, [0, n], n, 2).runUniqueConsecutive(gap);
			assert(arr.length === n);
			// Each value must differ from the `gap` values before it, so every window of gap + 1 is distinct.
			for (let i = 0; i + gap < n; i++) {
				const window = arr.slice(i, i + gap + 1);
				assert(new Set(window).size === window.length);
			}
		}
	}
});

Deno.test({
	name: "Array Add",
	fn: () => {
		assert(compare(ArrOp.add([1, 2, 3], [6, 5, 4]), [7, 7, 7]));
		assert(compare(ArrOp.add([1, 2, 3], 5), [6, 7, 8]));
		// Typed arrays keep their own overflow rules.
		const typed = ArrOp.add(new Uint8Array([200]), 100);
		assert(typed instanceof Uint8Array);
		assert(typed[0] === 44);
	}
});

Deno.test({
	name: "Array Subtract",
	fn: () => {
		assert(compare(ArrOp.subtract([1, 2, 3], [4, 5, 6]), [-3, -3, -3]));
		assert(compare(ArrOp.subtract([1, 2, 3], 2), [-1, 0, 1]));
	}
});

Deno.test({
	name: "Array Divide",
	fn: () => {
		assert(compare(ArrOp.divide([10, 20, 30], [1, 2, 3]), [10, 10, 10]));
		assert(compare(ArrOp.divide([10, 20, 30], 10), [1, 2, 3]));
	}
});

Deno.test({
	name: "Array Multiply",
	fn: () => {
		assert(compare(ArrOp.multiply([1, 2, 3], [4, 5, 6]), [4, 10, 18]));
		assert(compare(ArrOp.multiply([1, 2, 3], 2), [2, 4, 6]));
	}
});

Deno.test({
	name: "Array Lerp",
	fn: () => {
		assert(compare(ArrOp.lerp([1, 2, 3], [4, 5, 6], 0.5), [2.5, 3.5, 4.5]));
		assert(compare(ArrOp.lerp([1, 2, 3], 0, 0.5), [0.5, 1, 1.5]));
		// Endpoints are exact.
		assert(compare(ArrOp.lerp([0.1], [0.3], 1), [0.3]));
		assert(compare(ArrOp.lerp([0.1], [0.3], 0), [0.1]));
	}
});

Deno.test({
	name: "Array Shuffle",
	fn: () => {
		const shuffled = ArrOp.shuffle(
			arrFromFunction(10, x => x),
			84375
		);
		// All numbers are still present, and at least one has moved.
		assert(arrFromFunction(10, x => x).every(x => shuffled.includes(x)));
		assert(shuffled.some((x, i) => x !== i));

		// Typed arrays keep their type.
		const typedShuffle = ArrOp.shuffle(
			new Uint8Array(256).map((_, i) => i),
			32842
		);
		assert(typedShuffle instanceof Uint8Array);
		assert(arrFromFunction(256, x => x).every(x => typedShuffle.includes(x)));
		assert(typedShuffle.some((x, i) => x !== i));

		// Plain array-likes come back as real arrays.
		const arrayLike = ArrOp.shuffle({ length: 2, 0: "a", 1: "b" }, 1);
		assert(Array.isArray(arrayLike));
		assert(eq([...(arrayLike as unknown as string[])].sort(), ["a", "b"]));

		// Edge cases.
		assert(compare(ArrOp.shuffle([]), []));
		assert(compare(ArrOp.shuffle([1]), [1]));

		// The input isn't mutated, and the same seed gives the same order.
		const src = [1, 2, 3, 4, 5];
		const a = ArrOp.shuffle(src, 7);
		assert(compare(src, [1, 2, 3, 4, 5]));
		assert(compare(a, ArrOp.shuffle(src, 7)));
		assert(compare(ArrOp.shuffle(src, "seed"), ArrOp.shuffle(src, "seed")));
	}
});

Deno.test({
	name: "Array Shuffle Uniformity",
	fn: () => {
		// The old shuffle always returned 2-element arrays in their original order.
		let swapped = 0;
		for (let seed = 0; seed < 200; seed++) {
			if (ArrOp.shuffle([0, 1], seed)[0] === 1) swapped++;
		}
		// Expect about 100, allow a wide margin.
		assert(swapped > 60 && swapped < 140);

		// Every permutation of 3 elements should be equally likely (about 1000 each).
		const counts = new Map<string, number>();
		for (let seed = 0; seed < 6000; seed++) {
			const key = ArrOp.shuffle([0, 1, 2], seed).join("");
			counts.set(key, (counts.get(key) ?? 0) + 1);
		}
		assert(counts.size === 6);
		for (const count of counts.values()) {
			assert(count > 850 && count < 1150);
		}
	}
});

Deno.test({
	name: "Array Sort",
	fn: () => {
		assert(compare(ArrOp.sortAscending([5, 3, 4, 2, 1]), [1, 2, 3, 4, 5]));
		assert(compare(ArrOp.sortDescending([5, 3, 4, 1, 2]), [5, 4, 3, 2, 1]));
	}
});

Deno.test({
	name: "Array Max, Min And Range",
	fn: () => {
		const op = new ArrOp([3, -2, 7]);
		assert(op.max === 7);
		assert(op.min === -2);
		assert(op.range === 9);
		assert(ArrOp.range([1, 2, 3, 4, 5]) === 4);
		assert(Number.isNaN(new ArrOp([]).max));
		assert(Number.isNaN(new ArrOp([]).min));
		assert(Number.isNaN(ArrOp.range([])));
		// The old range spread into Math.max and overflowed the call stack on large arrays.
		const big = new Float64Array(500_000).map((_, i) => i);
		assert(ArrOp.range(big) === 499_999);
	}
});

Deno.test({
	name: "Array Mean",
	fn: () => {
		assert(ArrOp.mean([0, 1, 2, 3, 4, 5]) === 2.5);
		assert(Number.isNaN(ArrOp.mean([])));
	}
});

Deno.test({
	name: "Array Median",
	fn: () => {
		assert(ArrOp.median([1, 2, 3, 4, 5]) === 3);
		// Even lengths average the two middle values.
		assert(ArrOp.median([1, 2, 3, 4]) === 2.5);
		assert(ArrOp.median([4, 1, 3, 2]) === 2.5);
		assert(new ArrOp([4, 1, 3, 2]).median === 2.5);
		assert(Number.isNaN(ArrOp.median([])));
	}
});

Deno.test({
	name: "Array Mode",
	fn: () => {
		assert(ArrOp.mode([1, 2, 3, 2]) === 2);
		assert(ArrOp.mode(new Uint8Array([3, 3, 1])) === 3);
		// Ties go to the value that reaches the top count first.
		assert(ArrOp.mode([1, 2, 2, 1]) === 2);
		assert(Number.isNaN(ArrOp.mode([NaN, NaN, 1])));
		assert(Number.isNaN(ArrOp.mode([])));
	}
});

Deno.test({
	name: "Array Sum And Product",
	fn: () => {
		assert(ArrOp.sum([1, 2, 3]) === 6);
		assert(ArrOp.sum([]) === 0);
		// Typed arrays are summed as numbers, not in their own type.
		assert(ArrOp.sum(new Uint8Array([200, 100])) === 300);
		assert(ArrOp.product([1, 2, 3]) === 6);
		assert(ArrOp.product([]) === 1);
	}
});

Deno.test({
	name: "Interleave Arrays",
	fn: () => {
		assert(compare(ArrOp.interleave([1, 3, 5], [2, 4, 6]), [1, 2, 3, 4, 5, 6]));
		assert(compare(ArrOp.interleave([1, 4], [2, 5], [3, 6]), [1, 2, 3, 4, 5, 6]));
		// Longer arrays are chopped to the shortest.
		assert(compare(ArrOp.interleave([1, 3, 5], [2]), [1, 2]));
		// Typed arrays keep their type.
		assert(ArrOp.interleave(new Uint8Array([1, 3]), new Uint8Array([2, 4])) instanceof Uint8Array);
		// No arrays at all throws, like concatTypedArrays.
		assert(throws(() => ArrOp.interleave()));
	}
});

Deno.test({
	name: "Concat Typed Arrays",
	fn: () => {
		assert(compare(concatTypedArrays(new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6])), new Uint8Array([1, 2, 3, 4, 5, 6])));
		assert(throws(() => concatTypedArrays()));
	}
});

Deno.test({
	name: "De-duplicate Lite",
	fn: () => {
		assert(compare(ArrOp.deDuplicateLite([1, 2, 3, 4, 5, 4, 3, 2, 1]), [1, 2, 3, 4, 5]));

		// Objects are compared by reference.
		const shared = [1, 2];
		const byRef = ArrOp.deDuplicateLite([shared, shared, [1, 2]]);
		assert(byRef.length === 2);
		assert(byRef[0] === shared);
		assert(ArrOp.deDuplicateLite([{}, {}]).length === 2);

		// No string coercion.
		assert(ArrOp.deDuplicateLite([1, "1"]).length === 2);
		assert(ArrOp.deDuplicateLite(["__proto__", "__proto__"]).length === 1);
		assert(eq(ArrOp.deDuplicateLite([NaN, NaN]), [NaN]));

		// Typed arrays keep their type, plain array-likes become arrays.
		const typed = ArrOp.deDuplicateLite(new Uint8Array([1, 1, 2]));
		assert(typed instanceof Uint8Array);
		assert(eq(typed, [1, 2]));
		assert(Array.isArray(ArrOp.deDuplicateLite({ length: 2, 0: 1, 1: 1 })));
	}
});

Deno.test({
	name: "De-duplicate Full",
	fn: () => {
		// Keeps the first instance of each item.
		assert(compare(ArrOp.deDuplicateFull([1, 2, 3, 4, 5, 4, 3, 2, 1]), [1, 2, 3, 4, 5]));
		assert(
			compare(
				ArrOp.deDuplicateFull(
					[
						[1, 2],
						[2, 2],
						[3, 4]
					],
					(a, b) => a[1] === b[1]
				),
				[
					[1, 2],
					[3, 4]
				]
			)
		);
		// The default condition compares deeply, ignoring key order.
		assert(ArrOp.deDuplicateFull([{ a: 1 }, { a: 1 }, { a: 2 }]).length === 2);
		assert(
			ArrOp.deDuplicateFull([
				{ a: 1, b: 2 },
				{ b: 2, a: 1 }
			]).length === 1
		);
	}
});

Deno.test({
	name: "To Array",
	fn: () => {
		assert(compare(toArray(new Uint8Array([1, 2, 3, 4])), [1, 2, 3, 4]));
		assert(compare(toArray([1, 2, 3]), [1, 2, 3]));
		assert(compare(toArray({}), null));
	}
});
