import { compare, midPoint } from "@aurellis/helpers";
import { assert } from "./assert.ts";

Deno.test({
	name: "Mid Point",
	fn: () => {
		assert(compare(midPoint([0, 0, 0], [1, 1, 1]), [1 / 2, 1 / 2, 1 / 2]));
	}
});
