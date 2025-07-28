import { Cache } from "../src/Cache.ts";
import { compare, pathCanBeAccessed } from "../src/Misc.ts";
import { assert } from "./assert.ts";

const path = "test/cache.json";
const sampleJson = {
	foo: 1,
	bar: [1, 2, 3],
	baz: "blah blah"
};

Deno.test({
	name: "Cache Write Add",
	fn: () => {
		new Cache(path).write("test", sampleJson);
		assert(pathCanBeAccessed(path));
		assert(compare(JSON.parse(Deno.readTextFileSync(path)), { test: sampleJson }));
	}
});

Deno.test({
	name: "Cache Read",
	fn: () => {
		assert(compare(new Cache(path).read("test"), sampleJson));
	}
});

Deno.test({
	name: "Cache Entries",
	fn: () => {
		assert(new Cache(path).entries.includes("test"));
	}
});

Deno.test({
	name: "Cache Ensure - Present",
	fn: () => {
		assert(
			compare(
				new Cache(path).ensure("test", () => sampleJson),
				sampleJson
			)
		);
	}
});

Deno.test({
	name: "Cache Write Remove",
	fn: () => {
		new Cache(path).write("test");
		assert(compare(Deno.readTextFileSync(path), "{}"));
	}
});

Deno.test({
	name: "Cache Ensure - Absent",
	fn: () => {
		assert(
			compare(
				new Cache(path).ensure("test", () => sampleJson),
				sampleJson
			)
		);
	}
});

Deno.test({
	name: "Cache Clear",
	fn: () => {
		new Cache(path).clear();
		assert(!pathCanBeAccessed(path));
	}
});
