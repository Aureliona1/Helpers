import { byteHsvToRgb, byteRgbToHsv, compare, deepCopy, hsv2rgb, rgb2hsv, sleep, sleepSync, toArray, TwoWayMap } from "../src/Misc.ts";
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

Deno.test({
	name: "HSV to RGB",
	fn: () => {
		assert(compare(hsv2rgb([0, 1, 1, 1]), [1, 0, 0, 1]));
		assert(compare(hsv2rgb([0, 0, 1, 1]), [1, 1, 1, 1]));
		assert(compare(hsv2rgb([1 / 3, 1, 1, 1]), [0, 1, 0, 1]));
		assert(compare(hsv2rgb([0, 1, 0, 1]), [0, 0, 0, 1]));
	}
});

Deno.test({
	name: "RGB to HSV",
	fn: () => {
		assert(compare(rgb2hsv([1, 0, 0, 1]), [0, 1, 1, 1]));
		assert(compare(rgb2hsv([1, 1, 1, 1]), [0, 0, 1, 1]));
		assert(compare(rgb2hsv([0, 1, 0, 1]), [1 / 3, 1, 1, 1]));
		assert(compare(rgb2hsv([0, 0, 0, 1]), [0, 0, 0, 1]));
	}
});

Deno.test({
	name: "Byte HSV to RGB",
	fn: () => {
		assert(compare(byteHsvToRgb(new Uint8Array([0, 255, 255, 255])), new Uint8Array([255, 0, 0, 255])));
		assert(compare(byteHsvToRgb(new Uint8Array([0, 0, 255, 255])), new Uint8Array([255, 255, 255, 255])));
		assert(compare(byteHsvToRgb(new Uint8Array([255 / 3, 255, 255, 255])), new Uint8Array([0, 255, 0, 255])));
		assert(compare(byteHsvToRgb(new Uint8Array([0, 255, 0, 255])), new Uint8Array([0, 0, 0, 255])));
	}
});

Deno.test({
	name: "Byte RGB to HSV",
	fn: () => {
		assert(compare(byteRgbToHsv(new Uint8Array([255, 0, 0, 255])), new Uint8Array([0, 255, 255, 255])));
		assert(compare(byteRgbToHsv(new Uint8Array([255, 255, 255, 255])), new Uint8Array([0, 0, 255, 255])));
		assert(compare(byteRgbToHsv(new Uint8Array([0, 255, 0, 255])), new Uint8Array([255 / 3, 255, 255, 255])));
		assert(compare(byteRgbToHsv(new Uint8Array([0, 0, 0, 255])), new Uint8Array([0, 0, 0, 255])));
	}
});

Deno.test({
	name: "To Array",
	fn: () => {
		assert(compare(toArray(new Uint8Array([1, 2, 3, 4])), [1, 2, 3, 4]));
		assert(compare(toArray([1, 2, 3]), [1, 2, 3]));
		assert(compare(toArray({}), []));
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
