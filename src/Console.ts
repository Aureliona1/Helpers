import { ArrOp } from "./Arrays.ts";
import { sleepSync } from "./Misc.ts";
import { clamp, decimals, lerp, mapRange, msToTimeString } from "./Numbers.ts";
import type { ClogSettings } from "./Types.ts";

/**
 * A string containing the ANSI escape code to clear the previous line in the console.
 */
export const resetLineString = "\x1b[1A\x1b[0K";

let progressStringLogCount = 0;
/**
 * The string to be logged in both versions of progressRepeat.
 * @param elapsed The total elapsed time string.
 * @param remaining The total remaining time string
 * @param percent The current percent.
 * @param source The source of the log.
 */
function progressString(elapsed: number, remaining: number, percent: number, source?: string): string {
	const el = msToTimeString(elapsed);
	const rem = msToTimeString(remaining);
	return `${clogString("Log", source)} [Elapsed: ${rgb(100, 150, 255) + el}\x1b[0m | est. remaining: ${rgb(100, 150, 255) + rem}\x1b[0m ] ${percent}% complete${".".repeat(progressStringLogCount % 4)}`;
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
		if (Date.now() - lastLogAt > logTimeout && i > 0) {
			lastLogAt = startTime;
			const elapsed = Date.now() - startTime;
			console.log(resetLineString + progressString(elapsed, Math.round((rep * elapsed) / i - elapsed), decimals((i * 100) / rep, 0), source));
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
		if (Date.now() - lastLogAt > logTimeout && i > 0) {
			lastLogAt = startTime;

			const elapsed = Date.now() - startTime;
			console.log(resetLineString + progressString(elapsed, Math.round((rep * elapsed) / i - elapsed), decimals((i * 100) / rep, 0), source));
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
 */
export function regexInput(msg: string, pattern: RegExp, errorMsg = "Invalid input, please try again...", defaultValue = ""): string {
	let input = "";
	for (let i = 0; !pattern.test(input); i++) {
		if (i !== 0) {
			console.log(errorMsg);
		}
		input = prompt(msg) ?? defaultValue;
	}
	return input;
}

/**
 * Interpret an array of arguments and return them as an object.
 * @param args The arguments to parse.
 * @param expectedOptions The expected options format. For any boolean options, set them to false here, they can then be defined with flags. Any arguments not defined here will be ignored.
 */
export function interpretArgs<T extends Record<string, string | boolean>>(args: string[] = [], expectedOptions: T): T {
	args.forEach((x, i, a) => {
		if (expectedOptions[x] != undefined) {
			// Check for boolean param, therefore this can be treated as a single arg
			if (typeof expectedOptions[x] == "boolean") {
				(expectedOptions[x] as boolean) = true;
			} else if (/^-/.test(x) && a[i + 1]) {
				// Treat as param arg (e.g., "-dir", "C:\users")
				(expectedOptions[x] as string) = a[i + 1];
			}
		}
	});
	return expectedOptions;
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
 * Generates an RGB code to color all following text in the console. Reset this with \x1b[0m.
 * @param red The red value (0 - 255).
 * @param green The green value (0 - 255).
 * @param blue The blue value (0 - 255).
 * @param bg Whether to affect the foreground color or the background (Default - false).
 */
export const rgb = (r: number, g: number, b: number, bg = false): string => "\x1b[" + (bg ? 48 : 38) + ";2;" + (Math.round(r) % 256) + ";" + (Math.round(g) % 256) + ";" + (Math.round(b) % 256) + "m";

const scriptStartTime = Date.now();
let globalClogSettings: ClogSettings = {
	timeFormat: "System Time",
	logSymbol: "*",
	warnSymbol: "!",
	errorSymbol: "!"
};

/**
 * Update the settings that {@link clog} uses for logging.
 * @param newSettings A partial clog settings object that indicates the properties to update.
 */
export function clogSettingsUpdate(newSettings: Partial<ClogSettings>) {
	globalClogSettings = { ...globalClogSettings, ...newSettings };
}

function clogString(errorLevel: "Log" | "Warning" | "Error" = "Log", source = "main"): string {
	const time = () => {
		switch (globalClogSettings.timeFormat) {
			case "System Time":
				return new Date().toTimeString().substring(0, 8);
			case "This Script Run":
				return msToTimeString(Date.now() - scriptStartTime);
		}
	};
	if (errorLevel == "Warning") {
		return `${rgb(255, 255, 0)}[${globalClogSettings.warnSymbol}] \x1b[90m[${time()}] \x1b[90m[${source}] ${rgb(255, 255, 0)}WARNING:\x1b[0m`;
	} else if (errorLevel == "Error") {
		return `${rgb(255, 0, 0)}[${globalClogSettings.errorSymbol}] \x1b[90m[${time()}] \x1b[90m[${source}] ${rgb(255, 0, 0)}ERROR:\x1b[0m`;
	} else {
		return `\x1b[34m[${globalClogSettings.logSymbol}] \x1b[90m[${time()}] \x1b[90m[${source}]\x1b[0m`;
	}
}

/**
 * Log a message to the console with prepended information about the source, type, and timestamp of the log.
 * @param msg The message to log.
 * @param error The type of message (Default - Log).
 * @param source The source of the log, this may be the function that the log was called in, or the process/application.
 */
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
	for (let i = 0; i < sampleCount; i++) {
		const position = (i / sampleCount) * values.length;
		switch (sampleMethod) {
			case "Nearest": {
				console.log(rgb(255, 255, 255, true) + " ".repeat((values[clamp(Math.round(position), 0, values.length - 1)] * width) / max) + "\x1b[0m");
			}
			case "Floor": {
				console.log(rgb(255, 255, 255, true) + " ".repeat((values[Math.floor(position)] * width) / max) + "\x1b[0m");
			}
			case "Interpolate": {
				const upperI = clamp(Math.ceil(position), 0, values.length - 1);
				const lowerI = Math.floor(position);
				console.log(rgb(255, 255, 255, true) + " ".repeat((lerp(values[upperI], values[lowerI], mapRange(position, [lowerI, upperI], [0, 1])) * width) / max) + "\x1b[0m");
			}
		}
	}
}
