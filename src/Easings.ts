/**
 * A collection of easing functions, ported from https://eaasings.net
 */
export class easings {
	/**
	 * Quadratic easing in.
	 */
	static easeInQuad(x: number): number {
		return Math.pow(x, 2);
	}

	/**
	 * Quadratic easing out.
	 */
	static easeOutQuad(x: number): number {
		return 1 - (1 - x) * (1 - x);
	}

	/**
	 * Quadratic easing in and out.
	 */
	static easeInOutQuad(x: number): number {
		return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
	}

	/**
	 * Cubic easing in.
	 */
	static easeInCubic(x: number): number {
		return x * x * x;
	}

	/**
	 * Cubic easing out.
	 */
	static easeOutCubic(x: number): number {
		return 1 - Math.pow(1 - x, 3);
	}

	/**
	 * Cubic easing in and out.
	 */
	static easeInOutCubic(x: number): number {
		return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
	}

	/**
	 * Quartic easing in.
	 */
	static easeInQuart(x: number): number {
		return x * x * x * x;
	}

	/**
	 * Quartic easing out.
	 */
	static easeOutQuart(x: number): number {
		return 1 - Math.pow(1 - x, 4);
	}

	/**
	 * Quartic easing in and out.
	 */
	static easeInOutQuart(x: number): number {
		return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
	}

	/**
	 * Quintic easing in.
	 */
	static easeInQuint(x: number): number {
		return x * x * x * x * x;
	}

	/**
	 * Quintic easing out.
	 */
	static easeOutQuint(x: number): number {
		return 1 - Math.pow(1 - x, 5);
	}

	/**
	 * Quintic easing in and out.
	 */
	static easeInOutQuint(x: number): number {
		return x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2;
	}

	/**
	 * Sine easing in.
	 */
	static easeInSine(x: number): number {
		return 1 - Math.cos((x * Math.PI) / 2);
	}

	/**
	 * Sine easing out.
	 */
	static easeOutSine(x: number): number {
		return Math.sin((x * Math.PI) / 2);
	}

	/**
	 * Sine easing in and out.
	 */
	static easeInOutSine(x: number): number {
		return -(Math.cos(Math.PI * x) - 1) / 2;
	}

	/**
	 * Exponential easing in.
	 */
	static easeInExpo(x: number): number {
		return x === 0 ? 0 : Math.pow(2, 10 * x - 10);
	}

	/**
	 * Exponential easing out.
	 */
	static easeOutExpo(x: number): number {
		return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
	}

	/**
	 * Exponential easing in and out.
	 */
	static easeInOutExpo(x: number): number {
		return x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2;
	}

	/**
	 * Circular easing in.
	 */
	static easeInCirc(x: number): number {
		return 1 - Math.sqrt(1 - Math.pow(x, 2));
	}

	/**
	 * Circular easing out.
	 */
	static easeOutCirc(x: number): number {
		return Math.sqrt(1 - Math.pow(x - 1, 2));
	}

	/**
	 * Circular easing in and out.
	 */
	static easeInOutCirc(x: number): number {
		return x < 0.5 ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2 : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2;
	}

	/**
	 * Elastic easing in.
	 */
	static easeInElastic(x: number): number {
		const c4 = (2 * Math.PI) / 3;
		return x === 0 ? 0 : x === 1 ? 1 : -Math.pow(2, 10 * x - 10) * Math.sin((x * 10 - 10.75) * c4);
	}

	/**
	 * Elastic easing out.
	 */
	static easeOutElastic(x: number): number {
		const c4 = (2 * Math.PI) / 3;
		return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
	}

	/**
	 * Elastic easing in and out.
	 */
	static easeInOutElastic(x: number): number {
		const c5 = (2 * Math.PI) / 4.5;
		return x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? -(Math.pow(2, 20 * x - 10) * Math.sin((20 * x - 11.125) * c5)) / 2 : (Math.pow(2, -20 * x + 10) * Math.sin((20 * x - 11.125) * c5)) / 2 + 1;
	}

	/**
	 * Back easing in.
	 */
	static easeInBack(x: number): number {
		const c1 = 1.70158;
		const c3 = c1 + 1;

		return c3 * x * x * x - c1 * x * x;
	}

	/**
	 * Back easing out.
	 */
	static easeOutBack(x: number): number {
		const c1 = 1.70158;
		const c3 = c1 + 1;

		return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
	}

	/**
	 * Back easing in and out.
	 */
	static easeInOutBack(x: number): number {
		const c1 = 1.70158;
		const c2 = c1 * 1.525;

		return x < 0.5 ? (Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2 : (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
	}

	/**
	 * Bounce easing in.
	 */
	static easeInBounce(x: number): number {
		return 1 - easings.easeOutBounce(1 - x);
	}

	/**
	 * Bounce easing out.
	 */
	static easeOutBounce(x: number): number {
		const n1 = 7.5625;
		const d1 = 2.75;

		if (x < 1 / d1) {
			return n1 * x * x;
		} else if (x < 2 / d1) {
			return n1 * (x -= 1.5 / d1) * x + 0.75;
		} else if (x < 2.5 / d1) {
			return n1 * (x -= 2.25 / d1) * x + 0.9375;
		} else {
			return n1 * (x -= 2.625 / d1) * x + 0.984375;
		}
	}

	/**
	 * Bounce easing in and out.
	 */
	static easeInOutBounce(x: number): number {
		return x < 0.5 ? (1 - easings.easeOutBounce(1 - 2 * x)) / 2 : (1 + easings.easeOutBounce(2 * x - 1)) / 2;
	}

	/**
	 * Linear easing.
	 */
	static easeLinear(x: number): number {
		return x;
	}

	/**
	 * Step static.
	 */
	static easeStep(x: number): number {
		return Math.floor(x);
	}
}
