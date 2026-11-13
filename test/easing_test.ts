import { compare, type Easing, easings } from "@aurellis/helpers";
import { assert } from "./assert.ts";

const families = ["Quad", "Cubic", "Quart", "Quint", "Sine", "Expo", "Circ", "Elastic", "Back", "Bounce"] as const;
type Family = (typeof families)[number];

const variants = (family: Family): Easing[] => [`easeIn${family}`, `easeOut${family}`, `easeInOut${family}`];
const allEasings: Easing[] = ["easeLinear", "easeStep", ...families.flatMap(variants)];

/** Sample points from 0 to 1 inclusive, without float build-up. */
const samples = (count: number) => Array.from({ length: count + 1 }, (_, i) => i / count);

const approx = (a: number, b: number, tolerance = 1e-9) => Math.abs(a - b) <= tolerance;

Deno.test("Easings - every Easing name has a function and vice versa", () => {
	assert(allEasings.every(name => typeof easings[name] === "function"));
	const methods = Object.getOwnPropertyNames(easings).filter(name => typeof (easings as unknown as Record<string, unknown>)[name] === "function");
	assert(compare(new Set<string>(methods), new Set<string>(allEasings)));
});

Deno.test("Easings - start at 0 and end at 1", () => {
	for (const name of allEasings) {
		assert(approx(easings[name](0), 0), `${name}(0) = ${easings[name](0)}`);
		assert(approx(easings[name](1), 1), `${name}(1) = ${easings[name](1)}`);
	}
});

Deno.test("Easings - in is the mirror of out", () => {
	for (const family of families) {
		const easeIn = easings[`easeIn${family}`];
		const easeOut = easings[`easeOut${family}`];
		for (const x of samples(100)) {
			assert(approx(easeIn(x), 1 - easeOut(1 - x)), `${family} at ${x}`);
		}
	}
});

Deno.test("Easings - in-out is symmetric and passes through the middle", () => {
	for (const family of families) {
		const easeInOut = easings[`easeInOut${family}`];
		assert(approx(easeInOut(0.5), 0.5), `easeInOut${family}(0.5) = ${easeInOut(0.5)}`);
		for (const x of samples(100)) {
			assert(approx(easeInOut(x), 1 - easeInOut(1 - x)), `easeInOut${family} at ${x}`);
		}
	}
});

Deno.test("Easings - non-overshooting easings never go backwards", () => {
	const monotonic: Family[] = ["Quad", "Cubic", "Quart", "Quint", "Sine", "Expo", "Circ"];
	for (const name of ["easeLinear", "easeStep", ...monotonic.flatMap(variants)] as Easing[]) {
		const values = samples(1000).map(easings[name]);
		assert(
			values.every((v, i) => i === 0 || v >= values[i - 1] - 1e-12),
			`${name} decreases`
		);
	}
});

Deno.test("Easings - back and elastic overshoot", () => {
	assert(easings.easeInBack(0.2) < 0);
	assert(easings.easeOutBack(0.8) > 1);
	assert(samples(100).some(x => easings.easeInElastic(x) < 0));
	assert(samples(100).some(x => easings.easeOutElastic(x) > 1));
});

Deno.test("Easings - known values", () => {
	assert(easings.easeLinear(0.3) === 0.3);
	assert(easings.easeStep(0.99) === 0);
	assert(easings.easeInQuad(0.5) === 0.25);
	assert(easings.easeOutQuad(0.5) === 0.75);
	assert(easings.easeOutCubic(0.5) === 0.875);
	assert(easings.easeInOutQuad(0.25) === 0.125);
	assert(approx(easings.easeInOutSine(0.25), (1 - Math.cos(Math.PI / 4)) / 2));
	assert(approx(easings.easeInExpo(0.5), 1 / 32));
	assert(approx(easings.easeOutBounce(0.5), 0.765625));
});
