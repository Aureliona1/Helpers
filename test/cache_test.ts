import { Cache } from "../src/Cache.ts";
import { compare, pathAccessible } from "../src/Misc.ts";
import { assert } from "./assert.ts";

const path = "test/cache.json";
const sampleJson = {
	foo: 1,
	bar: [1, 2, 3],
	baz: "blah blah"
};

Deno.test({
	name: "Cache Write Add",
	fn: async () => {
		await new Cache(path).write("test", sampleJson);
		assert(await pathAccessible(path));
		assert(compare(JSON.parse(await Deno.readTextFile(path)), { test: sampleJson }));
	}
});

Deno.test({
	name: "Cache Read",
	fn: async () => {
		assert(compare(await new Cache(path).read("test"), sampleJson));
	}
});

Deno.test({
	name: "Cache Entries",
	fn: async () => {
		assert(new Cache(path).entries.includes("test"));
	}
});

Deno.test({
	name: "Cache Ensure - Present",
	fn: async () => {
		assert(compare(await new Cache(path).ensure("test", () => sampleJson), sampleJson));
	}
});

Deno.test({
	name: "Cache Write Remove",
	fn: async () => {
		await new Cache(path).write("test");
		assert(compare(await Deno.readTextFile(path), "{}"));
	}
});

Deno.test({
	name: "Cache Ensure - Absent",
	fn: async () => {
		assert(compare(await new Cache(path).ensure("test", () => sampleJson), sampleJson));
	}
});

Deno.test({
	name: "Cache Clear",
	fn: async () => {
		await new Cache(path).clear();
		assert(!(await pathAccessible(path)));
	}
});
