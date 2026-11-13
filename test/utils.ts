/**
 * Shared helpers for the test suite. Not a test file itself.
 */

/** Console output captured while a function runs, one array of arguments per call. */
export type CapturedConsole = {
	log: unknown[][];
	warn: unknown[][];
	error: unknown[][];
};

/**
 * Run a function with console.log, console.warn and console.error captured instead of printed.
 * @param fn The function to run, can be async.
 */
export async function captureConsole<T>(fn: () => T | Promise<T>): Promise<{ result: T; output: CapturedConsole }> {
	const output: CapturedConsole = { log: [], warn: [], error: [] };
	const original = { log: console.log, warn: console.warn, error: console.error };
	console.log = (...args: unknown[]) => void output.log.push(args);
	console.warn = (...args: unknown[]) => void output.warn.push(args);
	console.error = (...args: unknown[]) => void output.error.push(args);
	try {
		const result = await fn();
		return { result, output };
	} finally {
		console.log = original.log;
		console.warn = original.warn;
		console.error = original.error;
	}
}

/**
 * Run a function with `prompt` answering from a fixed list.
 * Throws if prompt is called more times than there are answers, so a looping prompt fails instead of hanging.
 * @param answers The values prompt returns, in order.
 * @param fn The function to run. Receives the list of messages prompt was called with.
 */
export async function withPrompt<T>(answers: (string | null)[], fn: (asked: (string | undefined)[]) => T | Promise<T>): Promise<T> {
	const original = globalThis.prompt;
	const asked: (string | undefined)[] = [];
	const queue = [...answers];
	globalThis.prompt = (message?: string) => {
		asked.push(message);
		if (queue.length === 0) {
			throw new Error("prompt was called more times than expected");
		}
		return queue.shift()!;
	};
	try {
		return await fn(asked);
	} finally {
		globalThis.prompt = original;
	}
}

/**
 * Run a function with a fresh temporary directory, which is deleted afterwards.
 * The path uses forward slashes on every platform.
 * @param fn The function to run.
 */
export async function withTempDir(fn: (dir: string) => void | Promise<void>): Promise<void> {
	const dir = (await Deno.makeTempDir({ prefix: "helpers_test_" })).replaceAll("\\", "/");
	try {
		await fn(dir);
	} finally {
		await Deno.remove(dir, { recursive: true });
	}
}

/**
 * Remove ANSI escape codes from a string.
 */
export const stripAnsi = (s: string): string => s.replace(/\x1b\[[0-9;]*[A-Za-z]/g, "");
