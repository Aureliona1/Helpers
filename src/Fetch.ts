export class FetchQueue {
	private active = 0;
	private queue: (() => void)[] = [];
	private lastReleaseTime = 0;

	/**
	 * A utility class that handles a total max limit of the number of requests that can be run at a time.
	 * @param maxRequests The maximum number of concurrent requests to allow.
	 * @param requestTimeoutMS The time in ms between allowing each request to begin, this allows requests to be staggered more.
	 */
	constructor(readonly maxRequests: number, readonly requestTimeoutMS = 0) {}

	private async waitForDelay() {
		if (this.requestTimeoutMS <= 0) return;

		const now = Date.now();
		const elapsed = now - this.lastReleaseTime;
		if (elapsed < this.requestTimeoutMS) {
			await new Promise(res => setTimeout(res, this.requestTimeoutMS - elapsed));
		}
	}

	/**
	 * Add a new job to the queue, resolves when the job is accepted.
	 */
	waitTurn(): Promise<() => void> {
		return new Promise(res => {
			const unlock = () => {
				this.active--;
				this.lastReleaseTime = Date.now();
				this.next();
			};

			const tryAcquire = async () => {
				if (this.active < this.maxRequests) {
					await this.waitForDelay();
					this.active++;
					res(unlock);
				} else {
					this.queue.push(tryAcquire);
				}
			};

			tryAcquire();
		});
	}

	private next() {
		const next = this.queue.shift();
		if (next) next();
	}

	/**
	 * Get the current number of active requests.
	 */
	get activeRequestCount() {
		return this.active;
	}

	/**
	 * Interface with the fetch API. The interface is identical to running `fetch()`.
	 * @param input The request info or URL for the fetch request.
	 * @param init Additional request initial properties.
	 */
	async fetch(input: RequestInfo | URL, init?: RequestInit & { client?: Deno.HttpClient }) {
		const free = await this.waitTurn();
		try {
			const raw = await fetch(input, init);
			return new QueuedResponse(raw, this);
		} finally {
			free();
		}
	}
}

export class QueuedResponse {
	/**
	 * Get response headers.
	 */
	readonly headers: Headers;
	/**
	 * Get response success.
	 */
	readonly ok: boolean;
	/**
	 * Check if response was redirected.
	 */
	readonly redirected: boolean;
	/**
	 * Get response HTTP status.
	 */
	readonly status: number;
	/**
	 * Get human-readable HTTP status text.
	 */
	readonly statusText: string;
	/**
	 * Get response type string.
	 */
	readonly type: ResponseType;
	/**
	 * Get response URL.
	 */
	readonly url: string;
	/**
	 * A queued response from a FetchQueue. This will be automatically returned from a queued fetch request. It should not be declared separately from a FetchQueue.
	 * @param raw The raw fetch response.
	 * @param queue The source queue. All methods on this class will be run through the queue.
	 */
	constructor(private raw: Response, private queue: FetchQueue) {
		this.headers = raw.headers;
		this.ok = raw.ok;
		this.redirected = raw.redirected;
		this.status = raw.status;
		this.statusText = raw.statusText;
		this.type = raw.type;
		this.url = raw.url;
	}

	/**
	 * Get response body as an ArrayBuffer.
	 * This will be added to the fetch queue.
	 */
	async arrayBuffer(): Promise<ArrayBuffer> {
		const free = await this.queue.waitTurn();
		try {
			return await this.raw.arrayBuffer();
		} finally {
			free();
		}
	}

	/**
	 * Get response body as a Blob.
	 * This will be added to the fetch queue.
	 */
	async blob(): Promise<Blob> {
		const free = await this.queue.waitTurn();
		try {
			return await this.raw.blob();
		} finally {
			free();
		}
	}

	/**
	 * Get response body as a Uint8Array.
	 * This will be added to the fetch queue.
	 */
	async bytes(): Promise<Uint8Array> {
		const free = await this.queue.waitTurn();
		try {
			return await this.raw.bytes();
		} finally {
			free();
		}
	}

	/**
	 * Get response body as FormData.
	 * This will be added to the fetch queue.
	 */
	async formData(): Promise<FormData> {
		const free = await this.queue.waitTurn();
		try {
			return await this.raw.formData();
		} finally {
			free();
		}
	}

	/**
	 * Get response body as parsed JSON.
	 * This will be added to the fetch queue.
	 */
	// deno-lint-ignore no-explicit-any
	async json(): Promise<any> {
		const free = await this.queue.waitTurn();
		try {
			return await this.raw.json();
		} finally {
			free();
		}
	}

	/**
	 * Get response body as decoded text.
	 * This will be added to the fetch queue.
	 */
	async text(): Promise<string> {
		const free = await this.queue.waitTurn();
		try {
			return await this.raw.text();
		} finally {
			free();
		}
	}
}
