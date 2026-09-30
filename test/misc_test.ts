import { byteHsvToRgb, byteRgbToHsv, hsv2rgb, rgb2hsv } from "../src/math/math.ts";
import { toArray } from "../src/object/array.ts";
import { compare, deepCopy, TwoWayMap } from "../src/object/object.ts";
import { sleep, sleepSync } from "../src/process.ts";
import { assert } from "./assert.ts";

Deno.test({
	name: "Sleep Sync",
	fn: () => {
		const delay = 100;
		const start = Date.now();
		sleepSync(delay);
		const elapsed = Date.now() - start;
		// 10 ms variance
		const variance = 10;
		assert(elapsed > delay - variance && elapsed < delay + variance);
	},
	ignore: true
});

Deno.test({
	name: "Sleep Async",
	fn: async () => {
		const delay = 100;
		const start = Date.now();
		await sleep(delay);
		const elapsed = Date.now() - start;
		// 10 ms variance
		const variance = 10;
		assert(elapsed > delay - variance && elapsed < delay + variance);
	},
	ignore: true
});
