import { clog, compare, fpsRepeat, graphValues, interpretArgs, progressRepeat, progressRepeatSync, regexInput, sleep, sleepSync } from "@aurellis/helpers";
import { assert } from "./assert.ts";
import { captureConsole, stripAnsi, withPrompt } from "./utils.ts";

Deno.test("Sleep Sync", () => {
	const start = performance.now();
	sleepSync(100);
	const elapsed = performance.now() - start;
	// Busy-waits, so it can't finish early.
	assert(elapsed >= 99 && elapsed < 150, `slept for ${elapsed}ms`);

	// Zero and negative delays return straight away.
	const quick = performance.now();
	sleepSync(0);
	sleepSync(-50);
	assert(performance.now() - quick < 10);
});

Deno.test("Sleep Async", async () => {
	const start = performance.now();
	await sleep(100);
	const elapsed = performance.now() - start;
	// Timers can fire slightly early, and late on a busy machine.
	assert(elapsed >= 95 && elapsed < 300, `slept for ${elapsed}ms`);
});

Deno.test("FPS Repeat", () => {
	const calls: number[] = [];
	const start = performance.now();
	fpsRepeat(5, 50, i => {
		calls.push(i);
	});
	const elapsed = performance.now() - start;
	assert(compare(calls, [0, 1, 2, 3, 4]));
	// 5 frames at 50 fps is 100ms.
	assert(elapsed >= 95 && elapsed < 200, `took ${elapsed}ms`);
});

Deno.test("Clog", async () => {
	const { output } = await captureConsole(() => {
		clog("hello", "Log", "tester");
		clog("careful", "Warning", "tester");
		clog("broken", "Error", "tester");
		clog("default");
	});
	assert(output.log.length === 2);
	assert(output.warn.length === 1);
	assert(output.error.length === 1);

	assert(output.log[0][1] === "hello");
	assert(stripAnsi(String(output.log[0][0])).includes("[tester]"));
	assert(stripAnsi(String(output.log[1][0])).includes("[main]"));
	assert(output.warn[0][1] === "careful");
	assert(stripAnsi(String(output.warn[0][0])).includes("WARNING:"));
	assert(output.error[0][1] === "broken");
	assert(stripAnsi(String(output.error[0][0])).includes("ERROR:"));
});

Deno.test("Interpret Args", () => {
	const defaults = { "-dir": "", "-verbose": false, "-count": "1" };
	assert(
		compare(interpretArgs(["-dir", "C:\\x", "-verbose", "-unknown", "5"], { ...defaults }), {
			"-dir": "C:\\x",
			"-verbose": true,
			"-count": "1"
		})
	);
	// A string option with no value keeps its default.
	assert(interpretArgs(["-dir"], { ...defaults })["-dir"] === "");
	// No args returns the defaults.
	assert(compare(interpretArgs(undefined, { ...defaults }), defaults));
});

Deno.test("Interpret Args - defaults are not mutated", () => {
	const defaults = { "-verbose": false };
	interpretArgs(["-verbose"], defaults);
	// Reusing the defaults object used to carry values between calls.
	assert(defaults["-verbose"] === false);
	assert(interpretArgs([], defaults)["-verbose"] === false);
});

Deno.test("Regex Input", async () => {
	await withPrompt(["bad", "123"], async asked => {
		const { result, output } = await captureConsole(() => regexInput("Number?", /^\d+$/, "Try again"));
		assert(result === "123");
		assert(compare(asked, ["Number?", "Number?"]));
		// The error message is shown once, for the one invalid answer.
		assert(output.log.length === 1);
		assert(output.log[0][0] === "Try again");
	});

	// No input (e.g., closed stdin) falls back to the default.
	await withPrompt([null], () => {
		assert(regexInput("Number?", /^\d+$/, "Try again", "42") === "42");
	});
});

Deno.test("Regex Input - always asks", async () => {
	// A pattern that matches "" used to return "" without prompting at all.
	await withPrompt(["7"], asked => {
		assert(regexInput("Digits?", /^\d*$/) === "7");
		assert(asked.length === 1);
	});
});

Deno.test("Progress Repeat Sync", async () => {
	const calls: number[] = [];
	const { output } = await captureConsole(() =>
		progressRepeatSync(
			10,
			i => {
				calls.push(i);
			},
			50,
			"task"
		)
	);
	assert(compare(calls, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]));
	const lines = output.log.map(args => stripAnsi(String(args[0])));
	assert(lines[0].includes("] 0% complete"));
	assert(lines[lines.length - 1].includes("100% complete"));
	assert(lines.every(line => line.includes("[task]")));
});

Deno.test("Progress Repeat Async", async () => {
	const calls: number[] = [];
	let running = false;
	let overlapped = false;
	const { output } = await captureConsole(() =>
		progressRepeat(5, async i => {
			// Each iteration is awaited before the next one starts.
			if (running) overlapped = true;
			running = true;
			await sleep(1);
			calls.push(i);
			running = false;
		})
	);
	assert(compare(calls, [0, 1, 2, 3, 4]));
	assert(!overlapped);
	assert(stripAnsi(String(output.log[output.log.length - 1][0])).includes("100% complete"));
});

Deno.test("Progress Repeat - logs at most once per timeout", async () => {
	const logTimeout = 50;

	const syncStart = Date.now();
	const sync = await captureConsole(() => progressRepeatSync(100, () => sleepSync(2), logTimeout));
	const syncElapsed = Date.now() - syncStart;
	// One progress line per timeout, plus the first and last lines.
	assert(sync.output.log.length <= Math.ceil(syncElapsed / logTimeout) + 2, `${sync.output.log.length} lines in ${syncElapsed}ms`);

	const asyncStart = Date.now();
	const asyncRun = await captureConsole(() => progressRepeat(30, () => sleep(5), logTimeout));
	const asyncElapsed = Date.now() - asyncStart;
	assert(asyncRun.output.log.length <= Math.ceil(asyncElapsed / logTimeout) + 2, `${asyncRun.output.log.length} lines in ${asyncElapsed}ms`);
});

/** graphValues needs a real terminal for its width. */
const consoleWidth = (() => {
	try {
		return Deno.consoleSize().columns;
	} catch {
		return 0;
	}
})();

Deno.test({
	name: "Graph Values",
	ignore: consoleWidth === 0,
	fn: async () => {
		// Each sample is one line, whatever the sampling method.
		for (const method of ["Nearest", "Floor", "Interpolate"] as const) {
			const { output } = await captureConsole(() => graphValues([0, 10, 20], 4, method));
			assert(output.log.length === 4, `${method} logged ${output.log.length} lines`);
		}

		// The second of 4 samples over [0, 10, 20] sits 75% of the way from 0 to 10.
		const { output } = await captureConsole(() => graphValues([0, 10, 20], 4, "Interpolate"));
		const widths = output.log.map(args => stripAnsi(String(args[0])).length);
		assert(widths[1] === Math.floor((7.5 * consoleWidth) / 20), `bar was ${widths[1]} wide`);
	}
});
