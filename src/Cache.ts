// deno-lint-ignore-file no-explicit-any
import { ensureFile } from "./Misc.ts";

export class Cache {
	private ensureFile() {
		try {
			ensureFile(this.fileName);
		} catch (e) {
			console.error("Error ensure cache file, check your read and write permissions...");
			console.error(e);
		}
	}
	private readFile(): Record<string, any> {
		this.ensureFile();
		try {
			return JSON.parse(Deno.readTextFileSync(this.fileName));
		} catch (e) {
			console.error("Error reading cache, check your read permissions...");
			console.error(e);
		}
		return {};
	}
	/**
	 * Access and modify a cache file.
	 * @param fileName The name of the cache file (Default - cache.json).
	 */
	constructor(public readonly fileName = "cache.json") {}
	/**
	 * Read the value at a name in the cache.
	 * @param name The name to read, returns undefined if this name doesn't exist in the cache.
	 */
	read(name: string): any {
		const cache = this.readFile();
		return cache[name];
	}
	/**
	 * Write an entry into the cache. If the data param is undefined, it will delete the entry with the given name.
	 * @param name The name of the entry to overwrite.
	 * @param data The data to overwrite with.
	 */
	write(name: string, data?: any) {
		const cache = this.readFile();
		if (typeof data == "undefined") {
			delete cache[name];
		} else {
			cache[name] = data;
		}
		try {
			Deno.writeTextFileSync(this.fileName, JSON.stringify(cache));
		} catch (e) {
			console.error("Error writing cache file, check your write permissions...");
			console.error(e);
		}
	}
	/**
	 * Clear all entries in the cache.
	 */
	clear() {
		try {
			Deno.removeSync(this.fileName);
		} catch (e) {
			console.error("Error clearing cache, check your write permissions...");
			console.error(e);
		}
	}
	/**
	 * Return an array of the adressable entries in the cache.
	 */
	get entries(): string[] {
		return Object.getOwnPropertyNames(this.readFile());
	}
}

/**
 * Ensures that some data exists in the cache, and only runs the backup if thee data is not already cached.
 * @param name The name of the entry in the cache.
 * @param backup A function that returns the backup data. This will only be run if the cache entry doesn't exist.
 */
export function ensureCached<T>(name: string, backup: () => T, cacheFileName = "cache.json"): T {
	const cache = new Cache(cacheFileName);
	if (!cache.entries.includes(name)) {
		cache.write(name, backup());
	}
	return cache.read(name) as T;
}
