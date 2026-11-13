// deno-lint-ignore-file no-explicit-any

import { arrFromFunction, ArrOp, byteHsvToRgb, byteRgbToHsv, clamp, clampLoop, closestFactors, compare, decimals, distance, distance2, hsv2rgb, random, rgb2hsv, rotateVector, rotateVector2D, stringCodeToNumber, waveform } from "@aurellis/helpers";
import { assert } from "./assert.ts";

Deno.test({
	name: "Decimals",
	fn: () => {
		assert(decimals(1.01 as number, 1) === 1);
		assert(decimals(1.01 as number, 0) === 1);
		assert(decimals(1.01 as number, -1) === 0);
		// Float errors used to round these down.
		assert(decimals(1.005 as number, 2) === 1.01);
		assert(decimals(0.285 as number, 2) === 0.29);
		assert(decimals(1.29 as number, 1, "floor") === 1.2);
		assert(decimals(1.21 as number, 1, "ceil") === 1.3);
		// Very large, very small and non-finite numbers.
		assert(decimals(1e21 as number, 2) === 1e21);
		assert(decimals(1e-7 as number, 10) === 1e-7);
		assert(decimals(Infinity as number, 2) === Infinity);
	}
});

Deno.test({
	name: "Decimals Recursive",
	fn: () => {
		// Nested null used to throw.
		assert(compare(decimals({ a: null, b: 1.26 }, 1), { a: null, b: 1.3 }));
		// Inputs are copied, not mutated.
		const src = { x: 1.26 };
		const res = decimals(src, 1);
		assert(src.x === 1.26);
		assert(res.x === 1.3);
		assert(res !== src);
		// Dates are left as the same reference.
		const date = new Date(5);
		assert(decimals({ date }, 0).date === date);
		// Typed arrays keep their type.
		const typed = decimals(new Float64Array([1.26]) as any, 1);
		assert(typed instanceof Float64Array);
		assert(typed[0] === 1.3);
	}
});

/**
 * Coefficient of variation of how samples (from 0 to 1) fall into equal bins.
 */
function getCV(samples: number[], bins: number): number {
	const spread = new Array(bins).fill(0);
	for (const v of samples) {
		spread[Math.floor(v * bins)]++;
	}
	const mean = new ArrOp(spread).mean;
	const stdDev = Math.sqrt(ArrOp.sum(spread.map(x => Math.pow(x - mean, 2))) / bins);
	return stdDev / mean;
}

/**
 * A truly uniform source gives a CV of about sqrt((bins - 1) / samples), so allow 1.5x that.
 */
const maxCV = (samples: number, bins: number) => 1.5 * Math.sqrt((bins - 1) / samples);

Deno.test({
	name: "Random Uniformity",
	fn: () => {
		const numberSamples = 1 << 20;
		assert(
			getCV(
				arrFromFunction(numberSamples, i => random(0, 1, i, 5)),
				100
			) < maxCV(numberSamples, 100)
		);
		// String seeds used to cluster around 0.5.
		const stringSamples = 1 << 18;
		assert(
			getCV(
				arrFromFunction(stringSamples, i => random(0, 1, `seed${i}`, 5)),
				100
			) < maxCV(stringSamples, 100)
		);
	}
});

Deno.test({
	name: "Random Range",
	fn: () => {
		for (let i = 0; i < 1000; i++) {
			const x = random(5, 10, i);
			assert(x >= 5 && x < 10);
			// min and max are swapped if given in the wrong order.
			const y = random(10, 5, i);
			assert(y >= 5 && y < 10);
			// Negative precision rounds to tens, hundreds etc.
			assert(random(0, 1000, i, -2) % 100 === 0);
			// Flooring never drops below min, even when min isn't a whole number.
			const z = random(0.5, 3, i, 0);
			assert(z === 1 || z === 2);
		}
	}
});

Deno.test({
	name: "Random Seeds",
	fn: () => {
		assert(random(0, 1, "abc") === random(0, 1, "abc"));
		assert(random(0, 1, 42) === random(0, 1, 42));
		// Anagrams used to give identical numbers.
		assert(random(0, 1, "ab", 10) !== random(0, 1, "ba", 10));
		// Large integer seeds used to lose their low bits.
		assert(random(0, 1, 2 ** 40, 10) !== random(0, 1, 2 ** 40 + 1, 10));
		// Seed 0 used to be stuck on a fixed point.
		assert(random(0, 1, 0, 10) !== 0);
		// The empty string used to throw.
		const x = random(0, 1, "");
		assert(x >= 0 && x < 1);
	}
});

Deno.test({
	name: "Clamp",
	fn: () => {
		assert(clamp(100 as number, 0, 50) === 50);
		assert(clamp(-5 as number, 0, 50) === 0);
		// min and max can be given in either order.
		assert(clamp(100 as number, 50, 0) === 50);
		assert(compare(clamp([-5, 5, 15], 0, 10), [0, 5, 10]));
		assert(compare(clamp({ a: null, b: 20 }, 0, 10), { a: null, b: 10 }));
		// Inputs are copied, not mutated.
		const src = [20];
		clamp(src, 0, 10);
		assert(src[0] === 20);
	}
});

Deno.test({
	name: "Clamp Loop",
	fn: () => {
		assert(clampLoop(100 as number, 50, 70) === 60);
		// Values already in range are unchanged.
		assert(clampLoop(5 as number, 3, 10) === 5);
		// Negative values wrap correctly.
		assert(clampLoop(-1 as number, 0, 10) === 9);
		assert(clampLoop(-0.5 as number, 0, 1) === 0.5);
		assert(clampLoop(-10 as number, 0, 10) === 0);
		// max is exclusive.
		assert(clampLoop(10 as number, 0, 10) === 0);
		assert(clampLoop(1.25 as number, 0, 1) === 0.25);
		// Zero-width range.
		assert(clampLoop(7 as number, 5, 5) === 5);
		assert(compare(clampLoop([11, -1], 0, 10), [1, 9]));
	}
});

Deno.test({
	name: "Distance",
	fn: () => {
		assert(distance([0, 0], [1, 1]) === Math.sqrt(2));
		assert(distance([0, 0, 0], [1, 1, 1]) === Math.sqrt(3));
		assert(distance2([0, 0], [1, 1]) === 2);
		assert(distance2([0, 0, 0], [1, 1, 1]) === 3);
	}
});

Deno.test({
	name: "Rotate Vector",
	fn: () => {
		assert(compare(rotateVector([0, 0, 0], [0, 0, 1], [90, 0, 0]), [0, -1, 0]));
		// Maintains magnitude.
		assert(compare(decimals(distance(rotateVector([1, 2, 3], [5, 4, 3], [45, 90, -45]), [1, 2, 3]), 3), decimals(distance([1, 2, 3], [5, 4, 3]), 3)));
	}
});

Deno.test({
	name: "Rotate Vector 2D",
	fn: () => {
		assert(compare(rotateVector2D([0, 0], [1, 0], 90), [0, 1]));
		// Rotates around the start point.
		assert(compare(rotateVector2D([1, 1], [2, 1], 180), [0, 1]));
	}
});

Deno.test({
	name: "String Code To Number",
	fn: () => {
		// Standard FNV-1a 32-bit test vectors.
		assert(stringCodeToNumber("") === 0x811c9dc5);
		assert(stringCodeToNumber("a") === 0xe40c292c);
		assert(stringCodeToNumber("foobar") === 0xbf9cf968);
		// Always an unsigned 32-bit integer.
		const hash = stringCodeToNumber("some longer string with unicode é中");
		assert(Number.isInteger(hash) && hash >= 0 && hash < 2 ** 32);
	}
});

Deno.test({
	name: "Closest Factors",
	fn: () => {
		assert(compare(closestFactors(0), [1, 0]));
		assert(compare(closestFactors(1), [1, 1]));
		assert(compare(closestFactors(4), [2, 2]));
		assert(compare(closestFactors(12), [3, 4]));
		assert(compare(closestFactors(-4), [-2, 2]));
	}
});

Deno.test({
	name: "Waveforms",
	fn: () => {
		assert(waveform.sine(0.25) === 1);
		assert(waveform.saw(0) === -1);
		// sawInverse now starts at 1.
		assert(waveform.sawInverse(0) === 1);
		assert(waveform.triangle(0.5) === 1);
		assert(waveform.square(0.25) === -1);
		assert(waveform.square(0.75) === 1);

		// Negative inputs used to leave the -1 to 1 range.
		assert(waveform.saw(-0.25) === waveform.saw(0.75));
		assert(waveform.sawInverse(-0.25) === waveform.sawInverse(0.75));
		assert(waveform.square(-0.25) === waveform.square(0.75));
		assert(waveform.triangle(-0.25) === waveform.triangle(0.75));
		assert(waveform.ease(-0.25, "easeLinear") === waveform.ease(0.75, "easeLinear"));
		// Tiny negative inputs can't round up to a full period.
		assert(waveform.saw(-1e-20) === -1);
	}
});

Deno.test({
	name: "HSV And RGB",
	fn: () => {
		assert(compare(hsv2rgb([0, 1, 1, 1]), [1, 0, 0, 1]));
		assert(compare(hsv2rgb([0, 0, 1, 1]), [1, 1, 1, 1]));
		assert(compare(hsv2rgb([1 / 3, 1, 1, 1]), [0, 1, 0, 1]));
		assert(compare(hsv2rgb([0, 1, 0, 1]), [0, 0, 0, 1]));

		assert(compare(rgb2hsv([1, 0, 0, 1]), [0, 1, 1, 1]));
		assert(compare(rgb2hsv([1, 1, 1, 1]), [0, 0, 1, 1]));
		assert(compare(rgb2hsv([0, 1, 0, 1]), [1 / 3, 1, 1, 1]));
		assert(compare(rgb2hsv([0, 0, 0, 1]), [0, 0, 0, 1]));
	}
});

Deno.test({
	name: "Byte HSV And RGB",
	fn: () => {
		assert(compare(byteHsvToRgb(new Uint8Array([0, 255, 255, 255])), new Uint8Array([255, 0, 0, 255])));
		assert(compare(byteHsvToRgb(new Uint8Array([0, 0, 255, 255])), new Uint8Array([255, 255, 255, 255])));
		assert(compare(byteHsvToRgb(new Uint8Array([255 / 3, 255, 255, 255])), new Uint8Array([0, 255, 0, 255])));
		assert(compare(byteHsvToRgb(new Uint8Array([0, 255, 0, 255])), new Uint8Array([0, 0, 0, 255])));

		assert(compare(byteRgbToHsv(new Uint8Array([255, 0, 0, 255])), new Uint8Array([0, 255, 255, 255])));
		assert(compare(byteRgbToHsv(new Uint8Array([255, 255, 255, 255])), new Uint8Array([0, 0, 255, 255])));
		assert(compare(byteRgbToHsv(new Uint8Array([0, 255, 0, 255])), new Uint8Array([255 / 3, 255, 255, 255])));
		assert(compare(byteRgbToHsv(new Uint8Array([0, 0, 0, 255])), new Uint8Array([0, 0, 0, 255])));

		// Truncation used to turn some greys into the byte below.
		for (let v = 0; v < 256; v++) {
			assert(compare(byteHsvToRgb(new Uint8Array([0, 0, v, 255])), new Uint8Array([v, v, v, 255])));
			assert(compare(byteRgbToHsv(new Uint8Array([v, v, v, 255])), new Uint8Array([0, 0, v, 255])));
		}
	}
});
