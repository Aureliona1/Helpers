/** Easing type bases. */
type EaseBase<T extends string> = `easeIn${T}` | `easeOut${T}` | `easeInOut${T}`;
/** All easings. */
export type Easing = "easeLinear" | "easeStep" | EaseBase<"Quad"> | EaseBase<"Cubic"> | EaseBase<"Quart"> | EaseBase<"Quint"> | EaseBase<"Sine"> | EaseBase<"Expo"> | EaseBase<"Circ"> | EaseBase<"Elastic"> | EaseBase<"Back"> | EaseBase<"Bounce">;

/**
 * 3D vector
 */
export type Vec3 = [number, number, number];
/**
 * 2D vector.
 */
export type Vec2 = [number, number];
/**
 * 4D Vector.
 */
export type Vec4 = [number, number, number, number];
/**
 * 9D Vector.
 */
export type Vec9 = [number, number, number, number, number, number, number, number, number];

/**
 * Any type that can be used as a key in a record.
 */
export type RecordKey = number | string | symbol;
