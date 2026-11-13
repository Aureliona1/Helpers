import { lerp, mapRange } from "./math/interpolation.ts";
import { clamp, decimals } from "./math/math.ts";
import { ArrOp } from "./object/array.ts";
import { clogString, progressString, resetLineString, rgb } from "./string.ts";

/**
 * Build the progress line logged after an iteration completes.
 * @param completed The number of iterations completed so far.
 * @param rep The total number of iterations.
 * @param startTime When the repeat started (ms).
 * @param source The source of the log.
 */
function progressUpdate(completed: number, rep: number, startTime: number, source?: string): string {
	const elapsed = Date.now() - startTime;
	const remaining = Math.round((elapsed * (rep - completed)) / completed);
	return resetLineString + progressString(elapsed, remaining, decimals((completed * 100) / rep, 0), source);
}

/**
 * Repeat code a certain number of times, logging the progress for each iteration.
 * @param rep The number of times to repeat.
 * @param c The code to execute on each iteration.
 * @param logTimeout The number of ms to wait between logging the progress (Default - 50).
 * @param source The name of the task that is being repeated (optional).
 */
export function progressRepeatSync(rep: number, c: (i: number) => void, logTimeout = 50, source?: string) {
	const startTime = Date.now();
	let lastLogAt = startTime;
	console.log(progressString(0, NaN, 0, source));
	for (let i = 0; i < rep; i++) {
		c(i);
		if (Date.now() - lastLogAt > logTimeout) {
			lastLogAt = Date.now();
			console.log(progressUpdate(i + 1, rep, startTime, source));
		}
	}
	console.log(resetLineString + progressString(Date.now() - startTime, 0, 100, source));
}

/**
 * Repeat code a certain number of times, logging the progress for each iteration. The code can be async and it will be awaited in order.
 * @param rep The number of times to repeat.
 * @param c The code to execute on each iteration.
 * @param logTimeout The number of ms to wait between logging the progress (Default - 50).
 * @param source The name of the task that is being repeated (optional).
 */
export async function progressRepeat(rep: number, c: (i: number) => Promise<void>, logTimeout = 50, source?: string) {
	const startTime = Date.now();
	let lastLogAt = startTime;
	console.log(progressString(0, NaN, 0, source));
	for (let i = 0; i < rep; i++) {
		await c(i);
		if (Date.now() - lastLogAt > logTimeout) {
			lastLogAt = Date.now();
			console.log(progressUpdate(i + 1, rep, startTime, source));
		}
	}
	console.log(resetLineString + progressString(Date.now() - startTime, 0, 100, source));
}

/**
 * User input validation using regex.
 * @param msg The input message to display (auto-adds a space at the end).
 * @param pattern The regex pattern to compare against.
 *
 * **IMPORTANT:** make sure to use `^` and `$` at the start and the end to validate the entire input.
 * @param errorMsg The message to display if the user input is invalid.
 * @param defaultValue The value to return if the user doesn't enter anything (Default - "").
 * @returns string - User input.
 * @throws If there is no interactive input (e.g., stdin isn't a terminal) and the default value doesn't match the pattern.
 */
export function regexInput(msg: string, pattern: RegExp, errorMsg = "Invalid input, please try again...", defaultValue = ""): string {
	// Global and sticky patterns keep a position between tests, so always test from the start.
	const matches = (input: string) => {
		pattern.lastIndex = 0;
		return pattern.test(input);
	};
	for (let i = 0; ; i++) {
		if (i !== 0) {
			console.log(errorMsg);
		}
		const answer = prompt(msg, defaultValue || undefined);
		if (answer === null) {
			// No interactive input, so asking again would loop forever.
			if (matches(defaultValue)) return defaultValue;
			throw new Error(`No input available for "${msg}", and the default value doesn't match the pattern.`);
		}
		const input = answer === "" ? defaultValue : answer;
		if (matches(input)) return input;
	}
}

/**
 * Interpret an array of arguments and return them as an object.
 * @param args The arguments to parse.
 * @param expectedOptions The expected options format. For any boolean options, set them to false here, they can then be defined with flags. Any arguments not defined here will be ignored. This object is not modified.
 */
export function interpretArgs<T extends Record<string, string | boolean>>(args: string[] = [], expectedOptions: T): T {
	const options: Record<string, string | boolean> = { ...expectedOptions };
	args.forEach((x, i, a) => {
		if (Object.hasOwn(options, x)) {
			// Check for boolean param, therefore this can be treated as a single arg
			if (typeof options[x] == "boolean") {
				options[x] = true;
			} else if (/^-/.test(x) && a[i + 1]) {
				// Treat as param arg (e.g., "-dir", "C:\users")
				options[x] = a[i + 1];
			}
		}
	});
	return options as T;
}

/**
 * Repeat code a certain number of times, pausing execution in order to reach a specified fps.
 * @param rep The count.
 * @param fps The ideal fps.
 * @param c The code to execute.
 */
export function fpsRepeat(rep: number, fps: number, c: (i: number) => void) {
	for (let i = 0; i < rep; i++) {
		const timeStart = Date.now();
		c(i);
		const dur = Date.now() - timeStart;
		sleepSync(1000 / fps - dur);
	}
}

/**
 * Log a message to the console with prepended information about the source, type, and timestamp of the log.
 * @param msg The message to log.
 * @param error The type of message (Default - Log).
 * @param source The source of the log, this may be the function that the log was called in, or the process/application.
 */
// deno-lint-ignore no-explicit-any
export function clog(msg: any, error: "Log" | "Warning" | "Error" = "Log", source = "main") {
	switch (error) {
		case "Log":
			console.log(clogString(error, source), msg);
			break;
		case "Warning":
			console.warn(clogString(error, source), msg);
			break;
		case "Error":
			console.error(clogString(error, source), msg);
	}
}

/**
 * Graph samples from a list of values in the console.
 * @param values The values to graph.
 * @param sampleCount The number of samples from the values to take.
 * @param sampleMethod The method for sampling from the values (Default - Interpolate).
 */
export function graphValues(values: number[], sampleCount: number = Deno.consoleSize().rows, sampleMethod: "Nearest" | "Floor" | "Interpolate" = "Interpolate"): void {
	const max = new ArrOp(values).max;
	const width = Deno.consoleSize().columns;
	const sample = (position: number): number => {
		switch (sampleMethod) {
			case "Nearest":
				return values[clamp(Math.round(position), 0, values.length - 1)];
			case "Floor":
				return values[Math.floor(position)];
			case "Interpolate": {
				const upperI = clamp(Math.ceil(position), 0, values.length - 1);
				const lowerI = Math.floor(position);
				return lerp(values[lowerI], values[upperI], mapRange(position, [lowerI, upperI], [0, 1]));
			}
		}
	};
	for (let i = 0; i < sampleCount; i++) {
		const position = (i / sampleCount) * values.length;
		// Negative values can't be drawn as a bar, so they show as empty.
		const length = Math.max(0, (sample(position) * width) / max) || 0;
		console.log(rgb(255, 255, 255, true) + " ".repeat(length) + "\x1b[0m");
	}
}

/**
 * Block the main thread for a set time.
 * @param milliseconds The time (ms) to wait.
 */
export function sleepSync(milliseconds: number) {
	const date = Date.now();
	let currentDate;
	if (milliseconds >= 0) {
		do {
			currentDate = Date.now();
		} while (currentDate - date < milliseconds);
	}
}

/**
 * Pause execution for a set time, must be used with await.
 * @param milliseconds The time (ms) to wait.
 */
export async function sleep(milliseconds: number): Promise<void> {
	return await new Promise(r => setTimeout(r, milliseconds));
}
