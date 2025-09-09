/** Easing variations of standard easings, this type is only a helper for {@link Easing} */
export type EaseBase<T extends string> = `easeIn${T}` | `easeOut${T}` | `easeInOut${T}`;
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

/**
 * A fixed-byte array of signed integers.
 */
export type IntTypedArray = Int8Array | Int16Array | Int32Array;

/**
 * A fixed-byte array of unsigned integers.
 */
export type UintTypedArray = Uint8Array | Uint16Array | Uint32Array;

/**
 * A fixed-byte array of floating point numbers.
 */
export type FloatTypedArray = Float16Array | Float32Array | Float64Array;

/**
 * A fixed-byte typed array.
 */
export type TypedArray = UintTypedArray | IntTypedArray | FloatTypedArray;

/**
 * A type representing any array type that contains numbers.
 */
export type NumberArray = TypedArray | Array<number>;

/**
 * An ArrayLike with writable indices.
 */
export type WritableArrayLike<T> = {
	readonly length: number;
	[n: number]: T;
};

/**
 * Settings format for the clog function.
 */
export type ClogSettings = {
	timeFormat: "System Time" | "This Script Run";
	logSymbol: string;
	warnSymbol: string;
	errorSymbol: string;
};

/**
 * A list item for a singly-linked list.
 */
export type SinglyLinkedItem<T> = {
	value: T;
	next: SinglyLinkedItem<T> | null;
};

/**
 * A list item for a doubly-linked list.
 */
export type DoublyLinkedItem<T> = {
	value: T;
	next: DoublyLinkedItem<T> | null;
	prev: DoublyLinkedItem<T> | null;
};
