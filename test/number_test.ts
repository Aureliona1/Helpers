import { msToTimeString, rotateVector } from "@aurellis/helpers";
import { arrFromFunction, ArrOp } from "../src/Arrays.ts";
import { compare } from "../src/Misc.ts";
import { clamp, clampLoop, decimals, distance, midPoint, random, stringCodeToNumber } from "../src/Numbers.ts";
import { assert } from "./assert.ts";

Deno.test({
	name: "Decimals",
	fn: () => {
		assert(decimals(1.01 as number, 1) === 1);
		assert(decimals(1.01 as number, 0) === 1);
		assert(decimals(1.01 as number, -1) === 0);
	}
});

Deno.test({
	name: "Random",
	fn: () => {
		// Test PRNG uniformity using coefficient of variation.

		// Samples should be from 0 to 1
		const getCV = (samples: number[], bins = 10) => {
			const spread = new Array(bins).fill(0);
			for (const v of samples) {
				spread[Math.floor(v * bins)]++;
			}

			const mean = new ArrOp(spread).mean;
			const stdDev = Math.sqrt(ArrOp.sum(spread.map(x => Math.pow(x - mean, 2))) / bins);
			return stdDev / mean;
		};

		assert(
			getCV(
				arrFromFunction(1 << 20, i => random(0, 1, i, 5)),
				100
			) < 0.01 // 1% tolerance
		);
	}
});

Deno.test({
	name: "Clamp",
	fn: () => {
		const res = clamp(100, [0, 50]);
		assert(compare(res, 50));
	}
});

Deno.test({
	name: "Clamp Loop",
	fn: () => {
		const res = clampLoop(100, [50, 70]);
		assert(50 <= res && res <= 70);
	}
});

Deno.test({
	name: "Distance",
	fn: () => {
		assert(distance([0, 0], [1, 1]) === Math.sqrt(2));
		assert(distance([0, 0, 0], [1, 1, 1]) === Math.sqrt(3));
	}
});

Deno.test({
	name: "Mid Point",
	fn: () => {
		assert(compare(midPoint([0, 0, 0], [1, 1, 1]), [1 / 2, 1 / 2, 1 / 2]));
	}
});

Deno.test({
	name: "Rotate Vector",
	fn: () => {
		// Rotate
		assert(compare(rotateVector([0, 0, 0], [0, 0, 1], [90, 0, 0]), [0, -1, 0]));
		// Maintains magnitude
		assert(compare(decimals(distance(rotateVector([1, 2, 3], [5, 4, 3], [45, 90, -45]), [1, 2, 3]), 3), decimals(distance([1, 2, 3], [5, 4, 3]), 3)));
	}
});
