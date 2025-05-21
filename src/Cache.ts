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
	/**
	 * Ensure that some data exists in the cache, and return the data.
	 * @param name The entry to check for.
	 * @param backup A function that returns the data if the entry does not exist. This will only be run if it is needed.
	 */
	ensure<T>(name: string, backup: () => T): T {
		if (!this.entries.includes(name)) {
			this.write(name, backup());
		}
		return this.read(name);
	}
}
