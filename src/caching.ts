// deno-lint-ignore-file no-explicit-any

import { ensureFile, ensureFileSync } from "./filesystem.ts";
import { compare } from "./object/object.ts";
import { clog } from "./process.ts";

/**
 * Access and modify a cache file.
 * Every read goes to the file, so changes made through other Cache instances (or other processes) are always seen.
 */
export class Cache {
	/**
	 * Create an empty cache if absent.
	 */
	private async ensureFile() {
		try {
			await ensureFile(this.fileName, "{}");
		} catch (e) {
			clog("Error ensuring cache file, check your read and write permissions...", "Error", "Cache");
			clog(e, "Error", "Cache");
		}
	}
	/**
	 * Create an empty cache if absent.
	 */
	private ensureFileSync() {
		try {
			ensureFileSync(this.fileName, "{}");
		} catch (e) {
			clog("Error ensuring cache file, check your read and write permissions...", "Error", "Cache");
			clog(e, "Error", "Cache");
		}
	}
	/**
	 * Read and parse the contents of the cache file.
	 */
	private async readFile(): Promise<Record<string, any>> {
		await this.ensureFile();
		let raw = "{}";
		try {
			raw = await Deno.readTextFile(this.fileName);
		} catch (e) {
			clog("Error reading cache, check your read permissions...", "Error", "Cache");
			clog(e, "Error", "Cache");
		}
		try {
			return JSON.parse(raw);
		} catch (e) {
			clog("Error parsing cache contents, consider clearing the cache and trying again...", "Error", "Cache");
			clog(e, "Error", "Cache");
		}
		return {};
	}
	/**
	 * Read and parse the contents of the cache file.
	 */
	private readFileSync(): Record<string, any> {
		this.ensureFileSync();
		let raw = "{}";
		try {
			raw = Deno.readTextFileSync(this.fileName);
		} catch (e) {
			clog("Error reading cache, check your read permissions...", "Error", "Cache");
			clog(e, "Error", "Cache");
		}
		try {
			return JSON.parse(raw);
		} catch (e) {
			clog("Error parsing cache contents, consider clearing the cache and trying again...", "Error", "Cache");
			clog(e, "Error", "Cache");
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
	 * @param entry The name to read, returns undefined if this name doesn't exist in the cache.
	 */
	async read<T>(entry: string): Promise<T> {
		return (await this.readFile())[entry];
	}
	/**
	 * Read the value at a name in the cache.
	 * @param entry The name to read, returns undefined if this name doesn't exist in the cache.
	 */
	readSync<T>(entry: string): T {
		return this.readFileSync()[entry];
	}
	/**
	 * Write an entry into the cache. If the data param is undefined, it will delete the entry with the given name.
	 * @param name The name of the entry to overwrite.
	 * @param data The data to overwrite with.
	 */
	async write(name: string, data?: any) {
		const cache = await this.readFile();
		if (typeof data == "undefined") {
			delete cache[name];
		} else {
			cache[name] = data;
		}
		try {
			await Deno.writeTextFile(this.fileName, JSON.stringify(cache));
		} catch (e) {
			clog("Error writing cache file, check your write permissions...", "Error", "Cache");
			clog(e, "Error", "Cache");
		}
	}
	/**
	 * Write an entry into the cache. If the data param is undefined, it will delete the entry with the given name.
	 * @param entry The name of the entry to overwrite.
	 * @param data The data to overwrite with.
	 */
	writeSync(entry: string, data?: any) {
		const cache = this.readFileSync();
		if (typeof data == "undefined") {
			delete cache[entry];
		} else {
			cache[entry] = data;
		}
		try {
			Deno.writeTextFileSync(this.fileName, JSON.stringify(cache));
		} catch (e) {
			clog("Error writing cache file, check your write permissions...", "Error", "Cache");
			clog(e, "Error", "Cache");
		}
	}
	/**
	 * Clear all entries in the cache. Clearing a cache that has no file yet does nothing.
	 */
	async clear() {
		try {
			await Deno.remove(this.fileName);
		} catch (e) {
			if (e instanceof Deno.errors.NotFound) return;
			clog("Error clearing cache, check your write permissions...", "Error", "Cache");
			clog(e, "Error", "Cache");
		}
	}
	/**
	 * Clear all entries in the cache. Clearing a cache that has no file yet does nothing.
	 */
	clearSync() {
		try {
			Deno.removeSync(this.fileName);
		} catch (e) {
			if (e instanceof Deno.errors.NotFound) return;
			clog("Error clearing cache, check your write permissions...", "Error", "Cache");
			clog(e, "Error", "Cache");
		}
	}
	/**
	 * Return an array of the addressable entries in the cache.
	 */
	async entriesAsync(): Promise<string[]> {
		return Object.getOwnPropertyNames(await this.readFile());
	}
	/**
	 * Get an array of the entry keys in the cache.
	 */
	get entries(): string[] {
		return Object.getOwnPropertyNames(this.readFileSync());
	}
	/**
	 * Ensure that some data exists in the cache, and return the data.
	 * @param entry The entry to check for.
	 * @param generator A function that returns the data if the entry does not exist. This will only be run if it is needed.
	 */
	async ensure<T>(entry: string, generator: () => T): Promise<T> {
		if (!(await this.entriesAsync()).includes(entry)) {
			await this.write(entry, generator());
		}
		return await this.read(entry);
	}
	/**
	 * Ensure that some data exists in the cache, and return the data.
	 * @param entry The entry to check for.
	 * @param generator A function that returns the data if the entry does not exist. This will only be run if it is needed.
	 */
	ensureSync<T>(entry: string, generator: () => T): T {
		if (!this.entries.includes(entry)) {
			this.writeSync(entry, generator());
		}
		return this.readSync(entry);
	}
}

/**
 * Access and modify an in-memory cache to store frequently used data. Data is defined by a name and a signature that identifies the state of the data.
 * @example
 * The signature can represent the arguments that were passed into a function that does a lot of work, but may have the same arguments multiple times.
 *
 * ```ts
 * const addCache = new MemoryCache();
 * function slowAdd(a: number, b: number): number {
 * 	return addCache.ensure(
 * 		"result",
 * 		[a, b],
 * 		() => {
 * 			// Actual function implementation here.
 * 			sleepSync(10000);
 * 			return a + b;
 * 		},
 * 		// If the same arguments, or their reverse, are passed in.
 * 		(cached, next) => compare(cached, next) || compare(cached.toReversed(), next)
 * 	);
 * }
 * ```
 */
export class MemoryCache {
	private _store: Map<string, { signature: any; data: any }> = new Map();

	/**
	 * Read the cached data for an entry name, ignoring signature.
	 * @param entry The entry to read. Logs a warning and returns undefined if it doesn't exist.
	 */
	readData<T>(entry = ""): T {
		const item = this._store.get(entry);
		if (item === undefined) {
			clog(`${entry} does not exist in the cache, undefined will be returned...`, "Warning", "Memory Cache");
			return undefined as T;
		}
		return item.data as T;
	}

	/**
	 * Read the cached signature for an entry name, ignoring the data.
	 * @param entry The entry to read. Logs a warning and returns undefined if it doesn't exist.
	 */
	readSignature<T>(entry = ""): T {
		const item = this._store.get(entry);
		if (item === undefined) {
			clog(`${entry} does not exist in the cache, undefined will be returned...`, "Warning", "Memory Cache");
			return undefined as T;
		}
		return item.signature as T;
	}

	/**
	 * Write a new entry, or update an existing one with the same name.
	 * @param entry The name of the entry to write.
	 * @param signature The signature of the entry.
	 * @param data The data to cache.
	 */
	write(entry = "", signature: any, data: any) {
		this._store.set(entry, { signature, data });
	}

	/**
	 * Delete an entry from the cache.
	 * @param entry The entry to delete.
	 */
	delete(entry = "") {
		this._store.delete(entry);
	}

	/**
	 * Get a list of the named entries in the cache.
	 */
	get entries(): string[] {
		return [...this._store.keys()];
	}

	/**
	 * Get a list of the named entries and their signatures in the cache.
	 */
	get signatures(): [string, any][] {
		return [...this._store].map(([name, item]) => [name, item.signature]);
	}

	/**
	 * Clear the cache.
	 */
	clear() {
		this._store.clear();
	}

	/**
	 * Get the cached data of an item if the signatures match, or add the item to the cache if it is invalid.
	 * @param entry The name of the item.
	 * @param signature The signature to match on the cached item, or to update to if invalid.
	 * @param generator A function that generates the item's data if the signatures don't match.
	 * @param compareFunc A custom function to use to compare the old signature with the new one.
	 */
	ensure<T, S>(entry = "", signature: S, generator: () => T, compareFunc: (cachedSignature: S, newSignature: S) => boolean = (a, b) => compare(a, b)): T {
		const cached = this._store.get(entry);
		if (cached !== undefined && compareFunc(cached.signature, signature)) {
			return cached.data;
		}
		const data = generator();
		this.write(entry, signature, data);
		return data;
	}
}
