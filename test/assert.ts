export class AssertionError extends Error {
	/** Constructs a new instance.
	 *
	 * @param message The error message.
	 * @param options Additional options. This argument is still unstable. It may change in the future release.
	 */
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = "AssertionError";
	}
}

export function assert(expr: unknown, msg = ""): asserts expr {
	if (!expr) {
		throw new AssertionError(msg);
	}
}
