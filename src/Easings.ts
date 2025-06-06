// Ported from https://easings.net/
/**
 * Quadratic easing in.
 */
export function easeInQuad(x: number): number {
	return Math.pow(x, 2);
}

/**
 * Quadratic easing out.
 */
export function easeOutQuad(x: number): number {
	return 1 - (1 - x) * (1 - x);
}

/**
 * Quadratic easing in and out.
 */
export function easeInOutQuad(x: number): number {
	return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

/**
 * Cubic easing in.
 */
export function easeInCubic(x: number): number {
	return x * x * x;
}

/**
 * Cubic easing out.
 */
export function easeOutCubic(x: number): number {
	return 1 - Math.pow(1 - x, 3);
}

/**
 * Cubic easing in and out.
 */
export function easeInOutCubic(x: number): number {
	return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/**
 * Quartic easing in.
 */
export function easeInQuart(x: number): number {
	return x * x * x * x;
}

/**
 * Quartic easing out.
 */
export function easeOutQuart(x: number): number {
	return 1 - Math.pow(1 - x, 4);
}

/**
 * Quartic easing in and out.
 */
export function easeInOutQuart(x: number): number {
	return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
}

/**
 * Quintic easing in.
 */
export function easeInQuint(x: number): number {
	return x * x * x * x * x;
}

/**
 * Quintic easing out.
 */
export function easeOutQuint(x: number): number {
	return 1 - Math.pow(1 - x, 5);
}

/**
 * Quintic easing in and out.
 */
export function easeInOutQuint(x: number): number {
	return x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2;
}

/**
 * Sine easing in.
 */
export function easeInSine(x: number): number {
	return 1 - Math.cos((x * Math.PI) / 2);
}

/**
 * Sine easing out.
 */
export function easeOutSine(x: number): number {
	return Math.sin((x * Math.PI) / 2);
}

/**
 * Sine easing in and out.
 */
export function easeInOutSine(x: number): number {
	return -(Math.cos(Math.PI * x) - 1) / 2;
}

/**
 * Exponential easing in.
 */
export function easeInExpo(x: number): number {
	return x === 0 ? 0 : Math.pow(2, 10 * x - 10);
}

/**
 * Exponential easing out.
 */
export function easeOutExpo(x: number): number {
	return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

/**
 * Exponential easing in and out.
 */
export function easeInOutExpo(x: number): number {
	return x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2;
}

/**
 * Circular easing in.
 */
export function easeInCirc(x: number): number {
	return 1 - Math.sqrt(1 - Math.pow(x, 2));
}

/**
 * Circular easing out.
 */
export function easeOutCirc(x: number): number {
	return Math.sqrt(1 - Math.pow(x - 1, 2));
}

/**
 * Circular easing in and out.
 */
export function easeInOutCirc(x: number): number {
	return x < 0.5 ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2 : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2;
}

/**
 * Elastic easing in.
 */
export function easeInElastic(x: number): number {
	const c4 = (2 * Math.PI) / 3;
	return x === 0 ? 0 : x === 1 ? 1 : -Math.pow(2, 10 * x - 10) * Math.sin((x * 10 - 10.75) * c4);
}

/**
 * Elastic easing out.
 */
export function easeOutElastic(x: number): number {
	const c4 = (2 * Math.PI) / 3;
	return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}

/**
 * Elastic easing in and out.
 */
export function easeInOutElastic(x: number): number {
	const c5 = (2 * Math.PI) / 4.5;
	return x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? -(Math.pow(2, 20 * x - 10) * Math.sin((20 * x - 11.125) * c5)) / 2 : (Math.pow(2, -20 * x + 10) * Math.sin((20 * x - 11.125) * c5)) / 2 + 1;
}

/**
 * Back easing in.
 */
export function easeInBack(x: number): number {
	const c1 = 1.70158;
	const c3 = c1 + 1;

	return c3 * x * x * x - c1 * x * x;
}

/**
 * Back easing out.
 */
export function easeOutBack(x: number): number {
	const c1 = 1.70158;
	const c3 = c1 + 1;

	return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

/**
 * Back easing in and out.
 */
export function easeInOutBack(x: number): number {
	const c1 = 1.70158;
	const c2 = c1 * 1.525;

	return x < 0.5 ? (Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2 : (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
}

/**
 * Bounce easing in.
 */
export function easeInBounce(x: number): number {
	return 1 - easeOutBounce(1 - x);
}

/**
 * Bounce easing out.
 */
export function easeOutBounce(x: number): number {
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
export function easeInOutBounce(x: number): number {
	return x < 0.5 ? (1 - easeOutBounce(1 - 2 * x)) / 2 : (1 + easeOutBounce(2 * x - 1)) / 2;
}

/**
 * Linear easing.
 */
export function easeLinear(x: number): number {
	return x;
}

/**
 * Step function.
 */
export function easeStep(x: number): number {
	return Math.floor(x);
}
