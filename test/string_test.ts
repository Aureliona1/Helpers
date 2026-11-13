import { bytesToString, clogSettingsUpdate, clogString, msToTimeString, progressString, resetLineString, rgb } from "@aurellis/helpers";
import { assert } from "./assert.ts";
import { stripAnsi } from "./utils.ts";

Deno.test("ms To Time String", () => {
	assert(msToTimeString(0) === "000ms");
	assert(msToTimeString(5) === "005ms");
	assert(msToTimeString(999) === "999ms");
	assert(msToTimeString(1500) === "1s:500ms");
	assert(msToTimeString(61_500) === "1m:1s:500ms");
	assert(msToTimeString(3_723_004) === "1h:2m:3s:004ms");
	// Rounds to the nearest ms.
	assert(msToTimeString(1.6) === "002ms");
});

Deno.test("ms To Time String - exact unit boundaries", () => {
	// Exactly one of a unit used to stay in the unit below (e.g. "1000ms").
	assert(msToTimeString(1000) === "1s:000ms");
	assert(msToTimeString(60_000) === "1m:000ms");
	assert(msToTimeString(3_600_000) === "1h:000ms");
});

Deno.test("Bytes To String", () => {
	const plain = (...args: Parameters<typeof bytesToString>) => stripAnsi(bytesToString(...args));
	// Auto decimal by default.
	assert(plain(1500) === "1.5KB");
	assert(plain(2_500_000) === "2.5MB");
	assert(plain(2_500_000_000) === "2.5GB");
	// Values below the smallest unit still use it.
	assert(plain(500) === "0.5KB");
	// Auto binary.
	assert(plain(1536, "Auto Binary Unit") === "1.5KiB");
	assert(plain(3 * 1024 * 1024, "Auto Binary Unit") === "3MiB");
	// Fixed units, rounded to 3 decimals.
	assert(plain(1_048_576, "MiB") === "1MiB");
	assert(plain(1_000_000, "KB") === "1000KB");
	assert(plain(1_234_567, "MB") === "1.235MB");
	// The number is coloured and the colour is reset.
	const raw = bytesToString(1500);
	assert(raw.startsWith(rgb(255, 255, 0)));
	assert(raw.endsWith("\x1b[0m"));
});

Deno.test("Bytes To String - negative values", () => {
	// Auto units should be picked by size, not sign.
	assert(stripAnsi(bytesToString(-2_500_000_000)) === "-2.5GB");
});

Deno.test("RGB", () => {
	assert(rgb(255, 0, 0) === "\x1b[38;2;255;0;0m");
	assert(rgb(0, 128, 255, true) === "\x1b[48;2;0;128;255m");
	// Rounds to whole numbers.
	assert(rgb(1.4, 1.6, 0) === "\x1b[38;2;1;2;0m");
	assert(resetLineString === "\x1b[1A\x1b[0K");
});

Deno.test("RGB - out of range values are clamped", () => {
	// 256 used to wrap to 0, and negatives produced an invalid escape code.
	assert(rgb(300, -5, 256) === "\x1b[38;2;255;0;255m");
});

Deno.test("Clog String", () => {
	const log = stripAnsi(clogString());
	assert(log.includes("[*]"));
	assert(log.includes("[main]"));
	assert(/\[\d\d:\d\d:\d\d\]/.test(log));

	const warning = stripAnsi(clogString("Warning", "src"));
	assert(warning.includes("[!]"));
	assert(warning.includes("[src]"));
	assert(warning.includes("WARNING:"));

	const error = stripAnsi(clogString("Error", "src"));
	assert(error.includes("[!]"));
	assert(error.includes("ERROR:"));
});

Deno.test("Clog Settings", () => {
	try {
		clogSettingsUpdate({ timeFormat: "This Script Run", logSymbol: "#", warnSymbol: "?", errorSymbol: "X" });
		const log = stripAnsi(clogString());
		assert(log.includes("[#]"));
		// Time since the script started, e.g. [1s:234ms].
		assert(/\[(\d+[hms]:)*\d{3}ms\]/.test(log));
		assert(stripAnsi(clogString("Warning")).includes("[?]"));
		assert(stripAnsi(clogString("Error")).includes("[X]"));

		// Partial updates keep the other settings.
		clogSettingsUpdate({ logSymbol: "+" });
		assert(stripAnsi(clogString("Error")).includes("[X]"));
	} finally {
		// clog settings are global, so put the defaults back for the other tests.
		clogSettingsUpdate({ timeFormat: "System Time", logSymbol: "*", warnSymbol: "!", errorSymbol: "!" });
	}
});

Deno.test("Progress String", () => {
	const line = stripAnsi(progressString(1500, 2000, 50, "task"));
	assert(line.includes("[task]"));
	assert(line.includes("Elapsed: 1s:500ms"));
	assert(line.includes("est. remaining: 2s:000ms"));
	assert(line.includes("50% complete"));
});
