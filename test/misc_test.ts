import { compare } from "@aurellis/helpers";
import { deepCopy } from "../src/Misc.ts";
import { assert } from "./assert.ts";

Deno.test({
	name: "Deep Copy",
	fn: () => {
		const obj = {
			foo: 1,
			bar: [{ a: 1 }, { a: 2 }, { a: 3 }]
		};
		const obj2 = deepCopy(obj);
		obj2.bar[0] = { a: 3 };
		assert(!compare(obj, obj2));
	}
});
