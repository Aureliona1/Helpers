import { deepCopy, compare, TwoWayMap } from "@aurellis/helpers";
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
		// Objects update independently.
		assert(!compare(obj, obj2));
		// Objects have exactly the same values.
		assert(compare(obj, deepCopy(obj)));
		// Top-Level object references are different.
		assert(obj !== deepCopy(obj2));
		// Nested references are different.
		assert(obj.bar !== deepCopy(obj).bar);
	}
});

Deno.test({
	name: "Compare",
	fn: () => {
		assert(compare([], []));
		assert(!compare([], [1, 2]));
		assert(compare({}, {}));
		const a: Record<string, number> = {};
		assert(compare(a, {}));
		a["hi"] = 1;
		assert(!compare(a, {}));
		assert(compare(a, { hi: 1 }));
		assert(!compare({}, { a: 1 }));
		assert(compare("a", "a"));
		assert(!compare(1, 2));
	}
});

Deno.test({
	name: "Two-Way Map",
	fn: () => {
		const m = new TwoWayMap({ a: 1, b: 2 });
		assert(m.get("a") === 1);
		assert(m.revGet(2) === "b");
	}
});
