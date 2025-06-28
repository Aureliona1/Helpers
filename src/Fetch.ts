export class FetchQueue {
	private active = 0;
	private queue: Record<number, (() => void)[]> = {};
	private lastReleaseTime = 0;

	/**
	 * A utility class that handles a total max limit of the number of requests that can be run at a time.
	 * @param maxRequests The maximum number of concurrent requests to allow.
	 * @param requestTimeoutMS The time in ms between allowing each request to begin, this allows requests to be staggered more.
	 * @param bufferBody Whether to install request the body of a response once reciving the headers. This means that, down the line, the body methods resolve instantly.
	 */
	constructor(readonly maxRequests: number, readonly requestTimeoutMS = 0, public bufferBody = true) {}

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
	 * @param priority A number that signifies th priority of this request. 0 is the highest priority and will be executed first.
	 */
	waitTurn(priority = 5): Promise<() => void> {
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
					if (this.queue[priority] == undefined) {
						this.queue[priority] = [tryAcquire];
					} else {
						this.queue[priority].push(tryAcquire);
					}
				}
			};

			tryAcquire();
		});
	}

	private next() {
		const key = Math.min(...Object.keys(this.queue).map(x => Number(x)));
		const q = this.queue[key];
		if (q) {
			const next = q.shift();
			if (!q.length) {
				delete this.queue[key];
			}
			if (next) next();
		}
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
		const free = await this.waitTurn(5);
		try {
			const res = await fetch(input, init);
			if (this.bufferBody) {
				return new QueuedResponse(res, this, await res.blob());
			} else {
				return new QueuedResponse(res, this);
			}
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
	 * @param res The raw fetch response.
	 * @param queue The source queue. All methods on this class will be run through the queue.
	 */
	constructor(private res: Response, private queue: FetchQueue, private bodyBlob?: Blob) {
		this.headers = res.headers;
		this.ok = res.ok;
		this.redirected = res.redirected;
		this.status = res.status;
		this.statusText = res.statusText;
		this.type = res.type;
		this.url = res.url;
	}

	/**
	 * Get response body as an ArrayBuffer.
	 * This will be added to the fetch queue if bufferBody is set to false in the source fetch queue.
	 */
	async arrayBuffer(): Promise<ArrayBuffer> {
		if (this.bodyBlob) {
			return await this.bodyBlob.arrayBuffer();
		}
		const free = await this.queue.waitTurn(4);
		try {
			return await this.res.arrayBuffer();
		} finally {
			free();
		}
	}

	/**
	 * Get response body as a Blob.
	 * This will be added to the fetch queue if bufferBody is set to false in the source fetch queue.
	 */
	async blob(): Promise<Blob> {
		if (this.bodyBlob) {
			return this.bodyBlob;
		}
		const free = await this.queue.waitTurn(4);
		try {
			return await this.res.blob();
		} finally {
			free();
		}
	}

	/**
	 * Get response body as a Uint8Array.
	 * This will be added to the fetch queue if bufferBody is set to false in the source fetch queue.
	 */
	async bytes(): Promise<Uint8Array> {
		if (this.bodyBlob) {
			return await this.bodyBlob.bytes();
		}
		const free = await this.queue.waitTurn(4);
		try {
			return await this.res.bytes();
		} finally {
			free();
		}
	}

	/**
	 * Get response body as FormData.
	 * This will be added to the fetch queue with a high priority, this may result in stream failures if the queue is under heavy load.
	 */
	async formData(): Promise<FormData> {
		const free = await this.queue.waitTurn(3);
		try {
			return await this.res.formData();
		} finally {
			free();
		}
	}

	/**
	 * Get response body as parsed JSON.
	 * This will be added to the fetch queue if bufferBody is set to false in the source fetch queue.
	 */
	// deno-lint-ignore no-explicit-any
	async json(): Promise<any> {
		if (this.bodyBlob) {
			return JSON.parse(await this.bodyBlob.text());
		}
		const free = await this.queue.waitTurn(3);
		try {
			return await this.res.json();
		} finally {
			free();
		}
	}

	/**
	 * Get response body as decoded text.
	 * This will be added to the fetch queue if bufferBody is set to false in the source fetch queue.
	 */
	async text(): Promise<string> {
		if (this.bodyBlob) {
			return await this.bodyBlob.text();
		}
		const free = await this.queue.waitTurn(4);
		try {
			return await this.res.text();
		} finally {
			free();
		}
	}
}
