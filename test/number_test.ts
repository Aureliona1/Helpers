import { arrFromFunction, ArrOp } from "../src/Arrays.ts";
import { compare } from "../src/Misc.ts";
import { clamp, decimals, distance, midPoint, random } from "../src/Numbers.ts";
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
		const sampleLength = 1_000_000;
		const sample = arrFromFunction(sampleLength, i => random(0, 1, i));

		const bins = 10;
		const spread = new Array(bins).fill(0);

		for (const v of sample) {
			spread[Math.floor(v * bins)]++;
		}

		const mean = new ArrOp(spread).mean;
		const stdDev = Math.sqrt(ArrOp.sum(spread.map(x => Math.pow(x - mean, 2))) / bins);
		const tolerance = 0.5; // 50% tolerance
		assert(stdDev / mean < tolerance);
	}
});

Deno.test({
	name: "Clamp",
	fn: () => {
		assert(clamp(100 as number, [0, 50]) === 50);
	}
});

Deno.test({
	name: "Clamp Loop",
	fn: () => {
		const res = clamp(100 as number, [50, 70]);
		assert(50 <= res && res <= 70);
	}
});

Deno.test({
	name: "Distance",
	fn: () => {
		assert(distance([0, 0], [1, 1]) === Math.sqrt(2));
	}
});

Deno.test({
	name: "Mid Point",
	fn: () => {
		assert(compare(midPoint([0, 0, 0], [1, 1, 1]), [1 / 2, 1 / 2, 1 / 2]));
	}
});
