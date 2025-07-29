import { compare } from "@aurellis/helpers";
import { clamp, decimals, distance, midPoint } from "../src/Numbers.ts";
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
