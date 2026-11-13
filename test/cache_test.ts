import { Cache, compare, MemoryCache, pathAccessible } from "@aurellis/helpers";
import { assert } from "./assert.ts";
import { captureConsole, withTempDir } from "./utils.ts";

const sample = {
	foo: 1,
	bar: [1, 2, 3],
	baz: "blah blah"
};

Deno.test("Cache - write and read", () =>
	withTempDir(async dir => {
		const path = `${dir}/cache.json`;
		const cache = new Cache(path);
		await cache.write("test", sample);
		assert(await pathAccessible(path));
		assert(compare(JSON.parse(await Deno.readTextFile(path)), { test: sample }));
		assert(compare(await cache.read("test"), sample));
		assert((await cache.read("missing")) === undefined);
	})
);

Deno.test("Cache - sync write and read", () =>
	withTempDir(dir => {
		const cache = new Cache(`${dir}/cache.json`);
		cache.writeSync("test", sample);
		assert(compare(cache.readSync("test"), sample));
		assert(cache.readSync("missing") === undefined);
		cache.writeSync("test");
		assert(cache.readSync("test") === undefined);
	})
);

Deno.test("Cache - creates nested directories", () =>
	withTempDir(async dir => {
		const path = `${dir}/a/b/c/cache.json`;
		await new Cache(path).write("x", 1);
		assert(await pathAccessible(path));
	})
);

Deno.test("Cache - write without data removes only that entry", () =>
	withTempDir(async dir => {
		const path = `${dir}/cache.json`;
		const cache = new Cache(path);
		await cache.write("a", 1);
		await cache.write("b", 2);
		await cache.write("a");
		assert(compare(JSON.parse(await Deno.readTextFile(path)), { b: 2 }));
		assert((await cache.read("a")) === undefined);
		assert((await cache.read<number>("b")) === 2);
	})
);

Deno.test("Cache - entries", () =>
	withTempDir(async dir => {
		const cache = new Cache(`${dir}/cache.json`);
		assert(compare(cache.entries, []));
		await cache.write("a", 1);
		await cache.write("b", 2);
		assert(compare(cache.entries.sort(), ["a", "b"]));
		assert(compare((await cache.entriesAsync()).sort(), ["a", "b"]));
	})
);

Deno.test("Cache - ensure only runs the generator when needed", () =>
	withTempDir(async dir => {
		const cache = new Cache(`${dir}/cache.json`);
		let calls = 0;
		const generator = () => {
			calls++;
			return sample;
		};
		assert(compare(await cache.ensure("test", generator), sample));
		assert(calls === 1);
		assert(compare(await cache.ensure("test", generator), sample));
		assert(calls === 1);

		let syncCalls = 0;
		const syncGenerator = () => {
			syncCalls++;
			return 5;
		};
		assert(cache.ensureSync("sync", syncGenerator) === 5);
		assert(cache.ensureSync("sync", syncGenerator) === 5);
		assert(syncCalls === 1);
	})
);

Deno.test("Cache - entries persist across instances", () =>
	withTempDir(async dir => {
		const path = `${dir}/cache.json`;
		await new Cache(path).write("a", 1);
		await new Cache(path).write("b", 2);
		const fresh = new Cache(path);
		assert((await fresh.read<number>("a")) === 1);
		assert((await fresh.read<number>("b")) === 2);
	})
);

Deno.test("Cache - sees writes from other instances", () =>
	withTempDir(async dir => {
		const path = `${dir}/cache.json`;
		const reader = new Cache(path);
		assert((await reader.read("x")) === undefined);
		await new Cache(path).write("x", 1);
		// The reader's in-memory copy must not hide another instance's write.
		assert((await reader.read<number>("x")) === 1);
	})
);

Deno.test("Cache - clear", () =>
	withTempDir(async dir => {
		const path = `${dir}/cache.json`;
		const cache = new Cache(path);
		await cache.write("a", 1);
		await cache.clear();
		assert(!(await pathAccessible(path)));
		assert((await cache.read("a")) === undefined);

		cache.writeSync("b", 2);
		cache.clearSync();
		assert(cache.readSync("b") === undefined);
	})
);

Deno.test("Cache - clearing a cache that was never written is not an error", () =>
	withTempDir(async dir => {
		const { output } = await captureConsole(() => new Cache(`${dir}/never-written.json`).clear());
		assert(output.error.length === 0);
	})
);

Deno.test("Cache - corrupt file reads as empty", () =>
	withTempDir(async dir => {
		const path = `${dir}/cache.json`;
		await Deno.writeTextFile(path, "this is not json");
		const { result, output } = await captureConsole(() => new Cache(path).read("a"));
		assert(result === undefined);
		// The problem is still reported.
		assert(output.error.length > 0);
	})
);

Deno.test("MemoryCache - write, read and delete", () => {
	const cache = new MemoryCache();
	cache.write("a", [1, 2], "data");
	assert(cache.readData<string>("a") === "data");
	assert(compare(cache.readSignature("a"), [1, 2]));
	assert(compare(cache.entries, ["a"]));
	assert(compare(cache.signatures, [["a", [1, 2]]]));

	// Writing the same name replaces it.
	cache.write("a", 3, "new");
	assert(cache.readData<string>("a") === "new");
	assert(cache.readSignature<number>("a") === 3);

	cache.delete("a");
	assert(compare(cache.entries, []));

	cache.write("a", 1, 1);
	cache.write("b", 2, 2);
	cache.clear();
	assert(compare(cache.entries, []));
});

Deno.test("MemoryCache - ensure", () => {
	const cache = new MemoryCache();
	let calls = 0;
	const generator = () => ++calls;

	assert(cache.ensure("sum", [1, 2], generator) === 1);
	// An equal signature (even a new array) reuses the cached data.
	assert(cache.ensure("sum", [1, 2], generator) === 1);
	// A different signature regenerates.
	assert(cache.ensure("sum", [2, 1], generator) === 2);
	// A custom comparison can treat different signatures as the same.
	assert(cache.ensure("sum", [1, 2], generator, (a, b) => compare([...a].sort(), [...b].sort())) === 2);
	assert(calls === 2);
});

Deno.test("MemoryCache - reading a missing entry warns and returns undefined", async () => {
	const data = await captureConsole(() => new MemoryCache().readData("missing"));
	assert(data.result === undefined);
	assert(data.output.warn.length === 1);

	const signature = await captureConsole(() => new MemoryCache().readSignature("missing"));
	assert(signature.result === undefined);
	assert(signature.output.warn.length === 1);
});

Deno.test("MemoryCache - entry names that clash with Object properties", async () => {
	const cache = new MemoryCache();
	cache.write("__proto__", 1, "a");
	cache.write("toString", 2, "b");
	assert(compare(cache.entries.sort(), ["__proto__", "toString"]));
	assert(cache.readData<string>("__proto__") === "a");
	assert(cache.readData<string>("toString") === "b");

	// Inherited names like "constructor" aren't entries that already exist.
	const { result, output } = await captureConsole(() => new MemoryCache().readData("constructor"));
	assert(result === undefined);
	assert(output.warn.length === 1);
});
