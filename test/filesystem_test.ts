import { compare, ensureDir, ensureDirSync, ensureFile, ensureFileSync, pathAccessible, pathAccessibleSync } from "@aurellis/helpers";
import { assert } from "./assert.ts";
import { captureConsole, withTempDir } from "./utils.ts";

const isDirectory = async (path: string) => (await Deno.stat(path)).isDirectory;

Deno.test("Path Accessible - files", () =>
	withTempDir(async dir => {
		const file = `${dir}/file.txt`;
		await Deno.writeTextFile(file, "hi");
		assert(await pathAccessible(file));
		assert(pathAccessibleSync(file));
		assert(!(await pathAccessible(`${dir}/missing.txt`)));
		assert(!pathAccessibleSync(`${dir}/missing.txt`));
		assert(!(await pathAccessible(`${dir}/missing/deeper.txt`)));
	})
);

Deno.test("Path Accessible - directories", () =>
	withTempDir(async dir => {
		// The docs promise this works for directories too.
		assert(await pathAccessible(dir));
		assert(pathAccessibleSync(dir));
	})
);

Deno.test("Ensure Dir", () =>
	withTempDir(async dir => {
		await ensureDir(`${dir}/a/b`, `${dir}/c`);
		assert(await isDirectory(`${dir}/a/b`));
		assert(await isDirectory(`${dir}/c`));

		// Existing directories are fine.
		const { output } = await captureConsole(() => ensureDir(`${dir}/a/b`));
		assert(output.error.length === 0);

		// Backslashes are treated as separators.
		await ensureDir(`${dir}\\d\\e`);
		assert(await isDirectory(`${dir}/d/e`));
	})
);

Deno.test("Ensure Dir Sync", () =>
	withTempDir(async dir => {
		ensureDirSync(`${dir}/a/b`, `${dir}/c`);
		assert(await isDirectory(`${dir}/a/b`));
		assert(await isDirectory(`${dir}/c`));
		const { output } = await captureConsole(() => ensureDirSync(`${dir}/a/b`));
		assert(output.error.length === 0);
		ensureDirSync(`${dir}\\d\\e`);
		assert(await isDirectory(`${dir}/d/e`));
	})
);

Deno.test("Ensure Dir - reports a file in the way", () =>
	withTempDir(async dir => {
		const file = `${dir}/file`;
		await Deno.writeTextFile(file, "");
		// The directory can't exist, so this must not pass silently.
		const { output } = await captureConsole(() => ensureDir(file));
		assert(output.error.length > 0);
		const sync = await captureConsole(() => ensureDirSync(file));
		assert(sync.output.error.length > 0);
	})
);

Deno.test("Ensure File", () =>
	withTempDir(async dir => {
		// Creates missing directories and writes the contents.
		const nested = `${dir}/x/y/a.txt`;
		await ensureFile(nested, "hello");
		assert((await Deno.readTextFile(nested)) === "hello");

		// Existing files are left alone.
		await ensureFile(nested, "other");
		assert((await Deno.readTextFile(nested)) === "hello");

		// Binary contents.
		await ensureFile(`${dir}/b.bin`, new Uint8Array([1, 2]));
		assert(compare(Array.from(await Deno.readFile(`${dir}/b.bin`)), [1, 2]));

		// Empty by default.
		await ensureFile(`${dir}/empty.txt`);
		assert((await Deno.readTextFile(`${dir}/empty.txt`)) === "");

		// Backslashes are treated as separators.
		await ensureFile(`${dir}\\z\\c.txt`, "c");
		assert((await Deno.readTextFile(`${dir}/z/c.txt`)) === "c");
	})
);

Deno.test("Ensure File Sync", () =>
	withTempDir(async dir => {
		const nested = `${dir}/x/y/a.txt`;
		ensureFileSync(nested, "hello");
		assert((await Deno.readTextFile(nested)) === "hello");
		ensureFileSync(nested, "other");
		assert((await Deno.readTextFile(nested)) === "hello");
		ensureFileSync(`${dir}/b.bin`, new Uint8Array([1, 2]));
		assert(compare(Array.from(await Deno.readFile(`${dir}/b.bin`)), [1, 2]));
		ensureFileSync(`${dir}/empty.txt`);
		assert((await Deno.readTextFile(`${dir}/empty.txt`)) === "");
		ensureFileSync(`${dir}\\z\\c.txt`, "c");
		assert((await Deno.readTextFile(`${dir}/z/c.txt`)) === "c");
	})
);
