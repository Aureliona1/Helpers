import { clog } from "./Console.ts";

/**
 * Check whether a file or directory path can be accessed.
 *
 * This ensures:
 *
 * - The path exists
 * - The path has read permissions
 * - The directory tree to the path has read permissions
 * - `Deno.read` variants will work on this path.
 * @param path The path to the path to check.
 */
export function pathAccessibleSync(path: string): boolean {
	try {
		const fd = Deno.openSync(path);
		fd.close();
		return true;
	} catch {
		return false;
	}
}

/**
 * Check whether a file or directory path can be accessed.
 *
 * This ensures:
 *
 * - The path exists
 * - The path has read permissions
 * - The directory tree to the path has read permissions
 * - `Deno.read` variants will work on this path.
 * @param path The path to the path to check.
 */
export async function pathAccessible(path: string): Promise<boolean> {
	try {
		const fd = await Deno.open(path);
		fd.close();
		return true;
	} catch {
		return false;
	}
}

/**
 * Ensures that a dir exists.
 */
export function ensureDirSync(...paths: string[]) {
	for (const raw of paths) {
		const path = raw.replaceAll("\\", "/");
		try {
			Deno.mkdirSync(path, { recursive: true });
		} catch (e) {
			if (!(e instanceof Deno.errors.AlreadyExists)) {
				clog(e, "Error", "ensureDir");
			}
		}
	}
}

/**
 * Ensures that a dir exists.
 */
export async function ensureDir(...paths: string[]) {
	for (const raw of paths) {
		const path = raw.replaceAll("\\", "/");
		try {
			await Deno.mkdir(path, { recursive: true });
		} catch (e) {
			if (!(e instanceof Deno.errors.AlreadyExists)) {
				clog(e, "Error", "ensureDir");
			}
		}
	}
}

/**
 * Ensure that a file exists, the path to the file can be many directories deep and these directories will be created if needed.
 * @param path The path to the file to ensure.
 * @param contents The contents to place in the file if it needs to be created.
 */
export function ensureFileSync(path: string, contents: string | Uint8Array = new Uint8Array()) {
	path = path.replaceAll("\\", "/");
	const dir = path.substring(0, path.lastIndexOf("/"));
	if (dir) {
		ensureDirSync(dir);
	}
	try {
		Deno.writeFileSync(path, typeof contents === "string" ? new TextEncoder().encode(contents) : contents, { createNew: true });
	} catch (e) {
		if (!(e instanceof Deno.errors.AlreadyExists)) {
			clog(e, "Error", "ensureFile");
		}
	}
}

/**
 * Ensure that a file exists, the path to the file can be many directories deep and these directories will be created if needed.
 * @param path The path to the file to ensure.
 * @param contents The contents to place in the file if it needs to be created.
 */
export async function ensureFile(path: string, contents: string | Uint8Array = new Uint8Array()) {
	path = path.replaceAll("\\", "/");
	const dir = path.substring(0, path.lastIndexOf("/"));
	if (dir) {
		await ensureDir(dir);
	}
	try {
		await Deno.writeFile(path, typeof contents === "string" ? new TextEncoder().encode(contents) : contents, { createNew: true });
	} catch (e) {
		if (!(e instanceof Deno.errors.AlreadyExists)) {
			clog(e, "Error", "ensureFile");
		}
	}
}
