import { compare, FetchQueue } from "@aurellis/helpers";
import { assert } from "./assert.ts";

async function withTestServer(handler: (req: Request) => Response | Promise<Response>, test: (url: string) => Promise<void>) {
	const server = Deno.serve({ port: 0, hostname: "127.0.0.1" }, handler);

	try {
		const addr = server.addr;
		if (addr.transport !== "tcp") {
			throw new Error("Expected TCP server");
		}

		const url = `http://127.0.0.1:${addr.port}`;
		await test(url);
	} finally {
		await server.shutdown();
	}
}

Deno.test("FetchQueue - fetches a response", async () => {
	await withTestServer(
		() => new Response("hello world"),
		async url => {
			const queue = new FetchQueue(1);

			const response = await queue.fetch(url);

			assert(compare(response.status, 200));
			assert(compare(response.ok, true));
			assert(compare(await response.text(), "hello world"));
			assert(compare(queue.activeRequestCount, 0));
		}
	);
});

Deno.test("FetchQueue - exposes response metadata", async () => {
	await withTestServer(
		() =>
			new Response("test", {
				status: 201,
				headers: {
					"Content-Type": "text/plain",
					"X-Test": "hello"
				}
			}),
		async url => {
			const queue = new FetchQueue(1);

			const response = await queue.fetch(url);

			assert(compare(response.status, 201));
			assert(compare(response.statusText, "Created"));
			assert(compare(response.ok, true));
			assert(compare(response.redirected, false));
			assert(compare(response.headers.get("Content-Type"), "text/plain"));
			assert(compare(response.headers.get("X-Test"), "hello"));
			assert(compare(response.url, url + "/"));
		}
	);
});

Deno.test("FetchQueue - buffers response body by default", async () => {
	await withTestServer(
		() => new Response(JSON.stringify({ value: 123 })),
		async url => {
			const queue = new FetchQueue(1);

			const response = await queue.fetch(url);

			// The request itself has already completed and released
			// the queue before the body is consumed.
			assert(compare(queue.activeRequestCount, 0));

			assert(compare(await response.text(), '{"value":123}'));
			assert(compare(queue.activeRequestCount, 0));
		}
	);
});

Deno.test("FetchQueue - buffered body supports multiple reads", async () => {
	await withTestServer(
		() => new Response("hello"),
		async url => {
			const queue = new FetchQueue(1);

			const response = await queue.fetch(url);

			assert(compare(await response.text(), "hello"));
			assert(compare(await response.text(), "hello"));
			assert(compare(await response.blob().then(b => b.text()), "hello"));
		}
	);
});

Deno.test("FetchQueue - buffered JSON body", async () => {
	await withTestServer(
		() =>
			new Response(
				JSON.stringify({
					message: "hello",
					value: 42
				}),
				{
					headers: {
						"Content-Type": "application/json"
					}
				}
			),
		async url => {
			const queue = new FetchQueue(1);

			const response = await queue.fetch(url);
			const json = await response.json();

			assert(
				compare(json, {
					message: "hello",
					value: 42
				})
			);

			// Because the body is buffered, it can be consumed again.
			assert(
				compare(
					await response.text(),
					JSON.stringify({
						message: "hello",
						value: 42
					})
				)
			);
		}
	);
});

Deno.test("FetchQueue - bytes returns response body", async () => {
	await withTestServer(
		() => new Response(new Uint8Array([1, 2, 3, 4])),
		async url => {
			const queue = new FetchQueue(1);

			const response = await queue.fetch(url);

			assert(compare(Array.from(await response.bytes()), [1, 2, 3, 4]));
		}
	);
});

Deno.test("FetchQueue - arrayBuffer returns response body", async () => {
	await withTestServer(
		() => new Response("hello"),
		async url => {
			const queue = new FetchQueue(1);

			const response = await queue.fetch(url);
			const buffer = await response.arrayBuffer();

			assert(compare(new TextDecoder().decode(buffer), "hello"));
		}
	);
});

Deno.test("FetchQueue - non-buffered response body is read through queue", async () => {
	await withTestServer(
		() => new Response("hello"),
		async url => {
			const queue = new FetchQueue(1, 0, false);

			const response = await queue.fetch(url);

			// The request has completed, so the slot is free.
			assert(compare(queue.activeRequestCount, 0));

			assert(compare(await response.text(), "hello"));
			assert(compare(queue.activeRequestCount, 0));
		}
	);
});

Deno.test("FetchQueue - limits concurrent requests", async () => {
	let active = 0;
	let maximumActive = 0;

	await withTestServer(
		async () => {
			active++;
			maximumActive = Math.max(maximumActive, active);

			await new Promise(resolve => setTimeout(resolve, 50));

			active--;

			return new Response("ok");
		},
		async url => {
			const queue = new FetchQueue(2);

			await Promise.all(Array.from({ length: 10 }, () => queue.fetch(url)));

			assert(compare(maximumActive, 2));
			assert(compare(queue.activeRequestCount, 0));
		}
	);
});

Deno.test("FetchQueue - queued requests execute after a slot is released", async () => {
	let active = 0;
	let maximumActive = 0;

	await withTestServer(
		async () => {
			active++;
			maximumActive = Math.max(maximumActive, active);

			await new Promise(resolve => setTimeout(resolve, 30));

			active--;

			return new Response("ok");
		},
		async url => {
			const queue = new FetchQueue(1);

			const requests = Array.from({ length: 5 }, () => queue.fetch(url));

			await Promise.all(requests);

			assert(compare(maximumActive, 1));
			assert(compare(queue.activeRequestCount, 0));
		}
	);
});

Deno.test("FetchQueue - priority is respected", async () => {
	const order: number[] = [];

	const queue = new FetchQueue(1);

	// Occupy the only slot.
	const initialRelease = await queue.waitTurn();

	const low = queue.waitTurn(10);
	const high = queue.waitTurn(1);
	const medium = queue.waitTurn(5);

	const lowTask = low.then(release => {
		order.push(10);
		release();
	});

	const highTask = high.then(release => {
		order.push(1);
		release();
	});

	const mediumTask = medium.then(release => {
		order.push(5);
		release();
	});

	// Allow the first queued request to acquire the slot.
	initialRelease();

	await Promise.all([lowTask, highTask, mediumTask]);

	assert(compare(order, [1, 5, 10]));
});

Deno.test("FetchQueue - activeRequestCount tracks acquired requests", async () => {
	const queue = new FetchQueue(2);

	const release1 = await queue.waitTurn();
	assert(compare(queue.activeRequestCount, 1));

	const release2 = await queue.waitTurn();
	assert(compare(queue.activeRequestCount, 2));

	release1();
	assert(compare(queue.activeRequestCount, 1));

	release2();
	assert(compare(queue.activeRequestCount, 0));
});

Deno.test("FetchQueue - releases queue slot when fetch fails", async () => {
	const queue = new FetchQueue(1);

	let success = true;
	try {
		await queue.fetch("http://127.0.0.1:1/this-does-not-exist");
	} catch {
		success = false;
	}
	assert(!success);
	assert(compare(queue.activeRequestCount, 0));
});

Deno.test("FetchQueue - HTTP errors still release queue slot", async () => {
	await withTestServer(
		() => new Response("not found", { status: 404 }),
		async url => {
			const queue = new FetchQueue(1);

			const response = await queue.fetch(url);

			assert(compare(response.ok, false));
			assert(compare(response.status, 404));
			assert(compare(await response.text(), "not found"));
			assert(compare(queue.activeRequestCount, 0));
		}
	);
});

Deno.test("QueuedResponse - non-buffered body methods consume through queue", async () => {
	await withTestServer(
		() => new Response(JSON.stringify({ test: true })),
		async url => {
			const queue = new FetchQueue(1, 0, false);

			const response = await queue.fetch(url);

			assert(compare(queue.activeRequestCount, 0));

			const json = await response.json();

			assert(compare(json, { test: true }));
			assert(compare(queue.activeRequestCount, 0));
		}
	);
});

Deno.test("FetchQueue - request delay separates request starts", async () => {
	const requestTimes: number[] = [];

	await withTestServer(
		() => {
			requestTimes.push(Date.now());
			return new Response("ok");
		},
		async url => {
			const queue = new FetchQueue(1, 50);

			await queue.fetch(url);
			await queue.fetch(url);
			await queue.fetch(url);

			assert(requestTimes.length === 3);

			const firstGap = requestTimes[1] - requestTimes[0];
			const secondGap = requestTimes[2] - requestTimes[1];

			assert(firstGap >= 45);
			assert(secondGap >= 45);
		}
	);
});
