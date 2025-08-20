// deno-lint-ignore-file no-explicit-any
import { clog } from "./Console.ts";
import { compare, ensureFile, ensureFileSync } from "./Misc.ts";

/**
 * Access and modify a cache file.
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
		const cache = await this.readFile();
		return cache[entry];
	}
	/**
	 * Read the value at a name in the cache.
	 * @param entry The name to read, returns undefined if this name doesn't exist in the cache.
	 */
	readSync<T>(entry: string): T {
		const cache = this.readFileSync();
		return cache[entry];
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
	 * @param name The name of the entry to overwrite.
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
	 * Clear all entries in the cache.
	 */
	async clear() {
		try {
			await Deno.remove(this.fileName);
		} catch (e) {
			clog("Error clearing cache, check your write permissions...", "Error", "Cache");
			clog(e, "Error", "Cache");
		}
	}
	/**
	 * Clear all entries in the cache.
	 */
	clearSync() {
		try {
			Deno.removeSync(this.fileName);
		} catch (e) {
			clog("Error clearing cache, check your write permissions...", "Error", "Cache");
			clog(e, "Error", "Cache");
		}
	}
	/**
	 * Return an array of the adressable entries in the cache.
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
 * The signature can represent the parameters that were passed into a function that does a lot of work, but may have the same parameters multiple times.
 *
 * ```ts
 * const addCache = new MemoryCache();
 * function slowAdd(a: number, b: number): number {
 * 	return addCache.ensure("result", [a, b], () => {
 * 		// Actual function implementation here.
 * 		sleepSync(10000);
 * 		return a + b;
 * 	},
 * 		// If the same arguments, or their reverse, are passed in.
 * 		(old, new) => compare(old, new) || compare(old.reverse(), new)
 * 	);
 * }
 * ```
 */
export class MemoryCache {
	private _store: Record<string, { signature: any; data: any }> = {};

	/**
	 * Read the cached data for an entry name, ignoring signature.
	 * @param entry The entry to read.
	 */
	readData<T>(entry = ""): T {
		if (!(entry in this._store)) {
			clog(`${entry} does not exist in the cache, undefined will be returned...`, "Warning", "Memory Cache");
		}
		return this._store[entry].data as T;
	}

	/**
	 * Read the cached signature for an entry name, ignoring the data.
	 * @param entry The entry to read.
	 */
	readSignature<T>(entry = ""): T {
		if (!(entry in this._store)) {
			clog(`${entry} does not exist in the cache, undefined will be returned...`, "Warning", "Memory Cache");
		}
		return this._store[entry].signature as T;
	}

	/**
	 * Write a new entry, or update an existing one with the same name.
	 * @param entry The name of the entry to write.
	 * @param signature The signature of the entry.
	 * @param data The data to cache.
	 */
	write(entry = "", signature: any, data: any) {
		this._store[entry] = { signature, data };
	}

	/**
	 * Delete an entry from the cache.
	 * @param entry The entry to delete.
	 */
	delete(entry = "") {
		delete this._store[entry];
	}

	/**
	 * Get a list of the named entries in the cache.
	 */
	get entries(): string[] {
		return Object.keys(this._store);
	}

	/**
	 * Get a list of the named entries and their signatures in the cache.
	 */
	get signatures(): [string, any][] {
		return Object.entries(this._store).map(x => [x[0], x[1].signature]);
	}

	/**
	 * Clear the cache.
	 */
	clear() {
		this._store = {};
	}

	/**
	 * Get the cached data of an item if the signatures match, or add the item to the cache if it is invalid.
	 * @param entry The name of the item.
	 * @param signature The signature to match on the cached item, or to update to if invalid.
	 * @param generator A function that generates the item's data if the signatures don't match.
	 * @param compareFunc A custom function to use to compare the old signature with the new one.
	 */
	ensure<T, S>(entry = "", signature: S, generator: () => T, compareFunc: (cachedSignature: S, newSignature: S) => boolean = (a, b) => compare(a, b)): T {
		if (entry in this._store) {
			if (compareFunc(this.readSignature<S>(entry), signature)) {
				return this.readData<T>(entry);
			}
		}
		const data = generator();
		this.write(entry, signature, data);
		return data;
	}
}
