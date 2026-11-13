import { compare, lerp, mapRange, midPoint } from "@aurellis/helpers";
import { assert } from "./assert.ts";

Deno.test({
	name: "Map Range",
	fn: () => {
		assert(mapRange(5 as number, [0, 10], [0, 100]) === 50);
		// Rounds rather than floors.
		assert(mapRange(0.29 as number, [0, 1], [0, 1], 2) === 0.29);
		assert(mapRange(0.299 as number, [0, 1], [0, 1], 2, undefined, "floor") === 0.29);
		// Zero-width source range.
		assert(mapRange(3 as number, [2, 2], [10, 20]) === 10);
	}
});

Deno.test({
	name: "Map Range Recursive",
	fn: () => {
		// Easing used to be dropped inside arrays and objects.
		assert(compare(mapRange([0.5], [0, 1], [0, 1], 5, "easeInQuad"), [0.25]));
		// Nested null used to throw.
		assert(compare(mapRange({ a: null, b: 5 }, [0, 10], [0, 1]), { a: null, b: 0.5 }));
		// Inputs are copied, not mutated.
		const src = { v: 5 };
		const res = mapRange(src, [0, 10], [0, 1]);
		assert(src.v === 5);
		assert(res.v === 0.5);
	}
});

Deno.test({
	name: "Lerp",
	fn: () => {
		assert(lerp(0, 10, 0.5) === 5);
		// Endpoints are exact.
		assert(lerp(0.1, 0.3, 0) === 0.1);
		assert(lerp(0.1, 0.3, 1) === 0.3);
		assert(lerp(0, 10, 0.5, "easeInQuad") === 2.5);
	}
});

Deno.test({
	name: "Mid Point",
	fn: () => {
		assert(compare(midPoint([0, 0, 0], [1, 1, 1]), [1 / 2, 1 / 2, 1 / 2]));
		assert(compare(midPoint([0, 0], [2, 4]), [1, 2]));
		assert(compare(midPoint([0, 0], [1, 3], true), [0, 1]));
	}
});
