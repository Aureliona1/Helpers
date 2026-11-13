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

			// The request has finished and released its slot before the body is read.
			assert(compare(queue.activeRequestCount, 0));
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

Deno.test("FetchQueue - buffered body can be read multiple times", async () => {
	const body = { message: "hello", value: 42 };

	await withTestServer(
		() => new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } }),
		async url => {
			const queue = new FetchQueue(1);

			const response = await queue.fetch(url);

			assert(compare(await response.json(), body));
			assert(compare(await response.text(), JSON.stringify(body)));
			assert(compare(await response.text(), JSON.stringify(body)));
			assert(compare(await response.blob().then(b => b.text()), JSON.stringify(body)));
		}
	);
});

Deno.test("FetchQueue - binary body methods", async () => {
	await withTestServer(
		() => new Response(new Uint8Array([1, 2, 3, 4])),
		async url => {
			const queue = new FetchQueue(1);

			const response = await queue.fetch(url);

			assert(compare(Array.from(await response.bytes()), [1, 2, 3, 4]));
			assert(compare(Array.from(new Uint8Array(await response.arrayBuffer())), [1, 2, 3, 4]));
		}
	);
});

Deno.test("FetchQueue - non-buffered body is read through the queue", async () => {
	await withTestServer(
		() => new Response(JSON.stringify({ test: true })),
		async url => {
			const queue = new FetchQueue(1, 0, false);

			// An unbuffered body can only be consumed once, so use one response per body method.
			const textResponse = await queue.fetch(url);
			assert(compare(queue.activeRequestCount, 0));
			assert(compare(await textResponse.text(), JSON.stringify({ test: true })));
			assert(compare(queue.activeRequestCount, 0));

			const jsonResponse = await queue.fetch(url);
			assert(compare(await jsonResponse.json(), { test: true }));
			assert(compare(queue.activeRequestCount, 0));
		}
	);
});

Deno.test("FetchQueue - limits concurrent requests", async () => {
	for (const limit of [1, 2]) {
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
				const queue = new FetchQueue(limit);

				// Queued requests only start once a slot is released.
				await Promise.all(Array.from({ length: 6 }, () => queue.fetch(url)));

				assert(compare(maximumActive, limit));
				assert(compare(queue.activeRequestCount, 0));
			}
		);
	}
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

Deno.test("FetchQueue - same-priority requests run in order", async () => {
	const queue = new FetchQueue(1);
	const order: number[] = [];

	const first = await queue.waitTurn();
	const tasks = [1, 2, 3].map(n =>
		queue.waitTurn(5).then(release => {
			order.push(n);
			release();
		})
	);
	first();
	await Promise.all(tasks);

	assert(compare(order, [1, 2, 3]));
});

Deno.test("FetchQueue - releasing twice only frees one slot", async () => {
	const queue = new FetchQueue(1);

	const release = await queue.waitTurn();
	release();
	release();
	assert(compare(queue.activeRequestCount, 0));

	// The limit must still hold afterwards.
	const held = await queue.waitTurn();
	let secondAcquired = false;
	const second = queue.waitTurn().then(r => {
		secondAcquired = true;
		return r;
	});
	await new Promise(resolve => setTimeout(resolve, 10));
	assert(!secondAcquired);

	held();
	(await second)();
});

Deno.test("FetchQueue - aborted requests release their slot", async () => {
	await withTestServer(
		async () => {
			await new Promise(resolve => setTimeout(resolve, 200));
			return new Response("late");
		},
		async url => {
			const queue = new FetchQueue(1);
			const controller = new AbortController();
			const pending = queue.fetch(url, { signal: controller.signal });
			setTimeout(() => controller.abort(), 20);

			let aborted = false;
			try {
				await pending;
			} catch {
				aborted = true;
			}
			assert(aborted);
			assert(compare(queue.activeRequestCount, 0));
		}
	);
});

Deno.test("QueuedResponse - buffered body stream is readable", async () => {
	await withTestServer(
		() => new Response("hello"),
		async url => {
			const response = await new FetchQueue(1).fetch(url);
			assert(response.body !== null);
			assert(compare(await new Response(response.body).text(), "hello"));
		}
	);
});

Deno.test("QueuedResponse - form data", async () => {
	const handler = () => new Response("a=1&b=2", { headers: { "Content-Type": "application/x-www-form-urlencoded" } });

	await withTestServer(handler, async url => {
		const unbuffered = await new FetchQueue(1, 0, false).fetch(url);
		const form = await unbuffered.formData();
		assert(compare(form.get("a"), "1"));
		assert(compare(form.get("b"), "2"));
	});

	await withTestServer(handler, async url => {
		// The buffered body has already been read, so formData has to use the buffer too.
		const buffered = await new FetchQueue(1).fetch(url);
		const form = await buffered.formData();
		assert(compare(form.get("a"), "1"));
		assert(compare(form.get("b"), "2"));
	});
});
