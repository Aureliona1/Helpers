import { compare, deepCopy, TwoWayMap } from "@aurellis/helpers";
import { assert } from "./assert.ts";

/** Compare values of different types without fighting the type checker. */
const eq = (a: unknown, b: unknown): boolean => compare(a, b);

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
		assert(obj !== deepCopy(obj));
		// Nested references are different.
		assert(obj.bar !== deepCopy(obj).bar);
	}
});

Deno.test({
	name: "Deep Copy Built-ins",
	fn: () => {
		// Dates, RegExps, Maps and Sets used to become broken shells.
		const date = new Date(1000);
		const dateCopy = deepCopy(date);
		assert(dateCopy instanceof Date);
		assert(dateCopy !== date);
		assert(dateCopy.getTime() === 1000);

		const regex = /ab+c/gi;
		const regexCopy = deepCopy(regex);
		assert(regexCopy !== regex);
		assert(regexCopy.source === "ab+c");
		assert(regexCopy.flags === "gi");

		// Map keys are kept by reference so lookups still work, values are copied.
		const key = { id: 1 };
		const map = new Map([[key, { v: 1 }]]);
		const mapCopy = deepCopy(map);
		assert(mapCopy instanceof Map);
		assert(mapCopy.get(key)?.v === 1);
		assert(mapCopy.get(key) !== map.get(key));

		const set = new Set([{ a: 1 }]);
		const setCopy = deepCopy(set);
		assert(setCopy instanceof Set);
		assert(compare(setCopy, set));
		assert([...setCopy][0] !== [...set][0]);

		const typed = new Uint8Array([1, 2, 3]);
		const typedCopy = deepCopy(typed);
		typedCopy[0] = 9;
		assert(typed[0] === 1);

		// Built-ins that can't be rebuilt are shared.
		const weak = new WeakMap();
		assert(deepCopy({ weak }).weak === weak);
	}
});

Deno.test({
	name: "Deep Copy DataView",
	fn: () => {
		// Only the bytes the view covers are copied, not the whole buffer.
		const view = new DataView(new ArrayBuffer(8), 2, 4);
		view.setUint8(0, 7);
		const copy = deepCopy(view);
		assert(copy.byteLength === 4);
		assert(copy.buffer.byteLength === 4);
		assert(copy.getUint8(0) === 7);
	}
});

Deno.test({
	name: "Deep Copy Class Instances, Symbols And Cycles",
	fn: () => {
		class Point {
			constructor(
				public x: number,
				public y: number
			) {}
			length(): number {
				return Math.hypot(this.x, this.y);
			}
		}
		const point = deepCopy(new Point(3, 4));
		assert(point instanceof Point);
		assert(point.length() === 5);

		const sym = Symbol("s");
		assert(deepCopy({ [sym]: 1 })[sym] === 1);

		// Cyclic references used to overflow the stack.
		const cyclic: { name: string; self?: unknown } = { name: "c" };
		cyclic.self = cyclic;
		const cyclicCopy = deepCopy(cyclic);
		assert(cyclicCopy !== cyclic);
		assert(cyclicCopy.self === cyclicCopy);
	}
});

Deno.test({
	name: "Compare Primitives And Arrays",
	fn: () => {
		assert(compare("a", "a"));
		assert(!compare(1, 2));
		assert(compare([], []));
		assert(!compare([], [1, 2]));
	}
});

Deno.test({
	name: "Compare Objects",
	fn: () => {
		assert(compare({}, {}));
		assert(!compare({}, { a: 1 }));
		const a: Record<string, number> = {};
		assert(compare(a, {}));
		a["hi"] = 1;
		assert(!compare(a, {}));
		assert(compare(a, { hi: 1 }));
		// Key order doesn't matter.
		assert(compare({ a: 1, b: 2 }, { b: 2, a: 1 }));
		// Keys must actually exist on both sides.
		assert(!eq({ a: undefined }, { b: undefined }));
		// null used to throw.
		assert(!eq({}, null));
		assert(!eq(null, {}));
		assert(eq(null, null));
	}
});

Deno.test({
	name: "Compare Special Values",
	fn: () => {
		assert(compare(NaN, NaN));
		assert(compare([NaN], [NaN]));
		assert(compare(new Date(5), new Date(5)));
		assert(!compare(new Date(5), new Date(6)));
		// Array-likes compare element by element, whatever their type.
		assert(eq([1, 2], new Uint8Array([1, 2])));
		assert(!eq([1], { 0: 1 }));
	}
});

Deno.test({
	name: "Compare Maps",
	fn: () => {
		assert(compare(new Map([[1, { a: 1 }]]), new Map([[1, { a: 1 }]])));
		assert(!compare(new Map([[1, { a: 1 }]]), new Map([[1, { a: 2 }]])));
		// A missing key isn't the same as an undefined value.
		assert(!compare(new Map([["a", undefined]]), new Map([["b", undefined]])));
	}
});

Deno.test({
	name: "Compare Sets",
	fn: () => {
		assert(compare(new Set([1, 2]), new Set([2, 1])));
		// Used to only check that the second Set was a subset of the first.
		assert(!compare(new Set([1, 2]), new Set([1])));
		assert(!compare(new Set([1]), new Set([1, 2])));
		// Objects are compared deeply, and each item can only match once.
		assert(eq(new Set([{ a: 1 }]), new Set([{ a: 1 }])));
		assert(!eq(new Set([{}, {}]), new Set([{}, { a: 1 }])));
	}
});

Deno.test({
	name: "Compare Mixed Types",
	fn: () => {
		// These used to fall through to the plain-object comparison and match.
		assert(!eq(new Map(), {}));
		assert(!eq(new Map([[1, 2]]), {}));
		assert(!eq(new Set(), {}));
		assert(!eq(new Date(0), {}));
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

Deno.test({
	name: "Two-Way Map Inputs",
	fn: () => {
		// Maps and entry arrays keep number keys as numbers.
		const fromMap = new TwoWayMap(
			new Map([
				[1, "a"],
				[2, "b"]
			])
		);
		assert(fromMap.revGet("b") === 2);
		const fromEntries = new TwoWayMap<number, string>([[1, "x"]]);
		assert(fromEntries.revGet("x") === 1);
		// Record keys are always strings at runtime.
		const fromRecord = new TwoWayMap({ 1: "a" });
		assert(typeof (fromRecord.revGet("a") as unknown) === "string");
	}
});

Deno.test({
	name: "Two-Way Map Edge Cases",
	fn: () => {
		// Symbol keys used to be dropped.
		const sym = Symbol("k");
		const withSymbol = new TwoWayMap({ [sym]: 1 });
		assert(withSymbol.get(sym) === 1);
		assert(withSymbol.revGet(1) === sym);
		// Duplicate values return the last key.
		assert(new TwoWayMap({ a: 1, b: 1 }).revGet(1) === "b");
		// The map is a copy of the input record.
		const rec = { a: 1 };
		const copied = new TwoWayMap(rec);
		rec.a = 2;
		assert(copied.get("a") === 1);
	}
});
