import { decimals } from "./math/math.ts";
import type { BinaryByteSizeUnit, ClogSettings, DecByteSizeUnit } from "./type.ts";

/**
 * Get the hours, minutes, seconds, ms from a total ms value.
 * @param time The time in ms.
 */
export function msToTimeString(time: number): string {
	time = Math.round(time);
	let ms = 0,
		s = 0,
		m = 0,
		h = 0;
	if (time > 3600000) {
		h = Math.floor(time / 3600000);
		time -= 3600000 * h;
	}
	if (time > 60000) {
		m = Math.floor(time / 60000);
		time -= 60000 * m;
	}
	if (time > 1000) {
		s = Math.floor(time / 1000);
		time -= 1000 * s;
	}
	if (time) {
		ms = time;
		time -= ms;
	}
	return `${h ? h + "h:" : ""}${m ? m + "m:" : ""}${s ? s + "s:" : ""}${ms.toString().padStart(3, "0")}ms`;
}

/**
 * Generate a string that formats a count of bytes into a human readable unit.
 * @param bytes The number of bytes.
 * @param unit The unit to format the byte count to. This can also be set to an auto setting which with find teh largest byte from the binary or decimal unit sets that result in an output >= 1. (Default - "Auto Decimal Unit")
 */
export function bytesToString(bytes: number, unit: BinaryByteSizeUnit | DecByteSizeUnit | "Auto Binary Unit" | "Auto Decimal Unit" = "Auto Decimal Unit"): string {
	const binaryUnits: Record<BinaryByteSizeUnit, number> = {
		KiB: 1024,
		MiB: 1024 * 1024,
		GiB: 1024 * 1024 * 1024
	};
	const decUnits: Record<DecByteSizeUnit, number> = {
		KB: 1000,
		MB: 1000 * 1000,
		GB: 1000 * 1000 * 1000
	};
	if (!(unit in binaryUnits) && !(unit in decUnits)) {
		const orderedMappings = Object.entries(unit === "Auto Binary Unit" ? binaryUnits : decUnits).sort((a, b) => b[1] - a[1]);
		let index = 0;
		while (index < orderedMappings.length - 1 && bytes < orderedMappings[index][1]) index++;
		unit = orderedMappings[index][0] as BinaryByteSizeUnit | DecByteSizeUnit;
	}
	return `${rgb(255, 255, 0)}${decimals(bytes / Object.assign(decUnits, binaryUnits)[unit as BinaryByteSizeUnit | DecByteSizeUnit], 3)}${unit}\x1b[0m`;
}

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

/**
 * Generate the string that is prepended to every message logged with {@link clog}.
 * @param errorLevel The error level of the log message.
 * @param source The source of the log message.
 */
export function clogString(errorLevel: "Log" | "Warning" | "Error" = "Log", source = "main"): string {
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
 * Generates an RGB code to color all following text in the console. Reset this with \x1b[0m.
 * @param red The red value (0 - 255).
 * @param green The green value (0 - 255).
 * @param blue The blue value (0 - 255).
 * @param bg Whether to affect the foreground color or the background (Default - false).
 */
export const rgb = (r: number, g: number, b: number, bg = false): string => "\x1b[" + (bg ? 48 : 38) + ";2;" + (Math.round(r) % 256) + ";" + (Math.round(g) % 256) + ";" + (Math.round(b) % 256) + "m";

/**
 * A string containing the ANSI escape code to clear the previous line in the console.
 */
export const resetLineString = "\x1b[1A\x1b[0K";

let progressStringLogCount = 0;
/**
 * The string to be logged in both versions of progressRepeat.
 * @param elapsed The total elapsed ms.
 * @param remaining The total remaining ms.
 * @param percent The current percent.
 * @param source The source of the log.
 */
export function progressString(elapsed: number, remaining: number, percent: number, source?: string): string {
	const el = msToTimeString(elapsed);
	const rem = msToTimeString(remaining);
	return `${clogString("Log", source)} [Elapsed: ${rgb(100, 150, 255) + el}\x1b[0m | est. remaining: ${rgb(100, 150, 255) + rem}\x1b[0m ] ${percent}% complete${".".repeat(progressStringLogCount % 4)}`;
}
