import * as helpers from "@aurellis/helpers";
import { assert } from "./assert.ts";

/** Every runtime value the package should export from mod.ts. */
const expected = [
	// caching.ts
	"Cache",
	"MemoryCache",
	// filesystem.ts
	"pathAccessible",
	"pathAccessibleSync",
	"ensureDir",
	"ensureDirSync",
	"ensureFile",
	"ensureFileSync",
	// math/easing.ts
	"easings",
	// math/interpolation.ts
	"mapRange",
	"lerp",
	"midPoint",
	// math/math.ts
	"decimals",
	"stringCodeToNumber",
	"random",
	"clamp",
	"clampLoop",
	"distance",
	"distance2",
	"rotateVector",
	"rotateVector2D",
	"waveform",
	"hsv2rgb",
	"rgb2hsv",
	"byteHsvToRgb",
	"byteRgbToHsv",
	"closestFactors",
	// network.ts
	"FetchQueue",
	"QueuedResponse",
	// object/array.ts
	"arrRem",
	"arrFromFunction",
	"RandomArray",
	"ArrOp",
	"concatTypedArrays",
	"toArray",
	// object/object.ts
	"deepCopy",
	"compare",
	"TwoWayMap",
	// process.ts
	"progressRepeatSync",
	"progressRepeat",
	"regexInput",
	"interpretArgs",
	"fpsRepeat",
	"clog",
	"graphValues",
	"sleepSync",
	"sleep",
	// string.ts
	"msToTimeString",
	"bytesToString",
	"clogSettingsUpdate",
	"clogString",
	"rgb",
	"resetLineString",
	"progressString"
];

Deno.test("Exports - everything public is exported", () => {
	for (const name of expected) {
		assert(name in helpers, `${name} is not exported from mod.ts`);
	}
});

Deno.test("Exports - nothing unexpected is exported", () => {
	for (const name of Object.keys(helpers)) {
		assert(expected.includes(name), `${name} is exported but not listed in this test`);
	}
	// Internal helpers stay private.
	assert(!("mapNumbers" in helpers));
	assert(!("roundTo" in helpers));
});
