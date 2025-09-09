import type { SinglyLinkedItem } from "../Types.ts";

/**
 * A linear data structure where nodes are connected only to the next one via a reference.
 */
export class LinkedList<T> implements Iterable<T> {
	private _length = 0;
	private _head: SinglyLinkedItem<T> | null = null;

	/**
	 * Initialise a linear data structure where nodes are connected only to the next one via a reference.
	 */
	constructor(arr: ArrayLike<T> = []) {
		for (let i = arr.length; i; i--) {
			this.add(arr[i - 1]);
		}
	}

	/**
	 * Add a value to the list at a set index. If the index exceeds the length of the list, value will be appended to the end.
	 * @param value The value to add to the list.
	 * @param index The zero-based index to insert the value at.
	 */
	add(value: T, index = 0) {
		if (this._length === 0) {
			this._head = { value, next: null };
			this._length = 1;
			return;
		}
		if (index < 0) index = this._length + index;
		if (index < 0) index = 0;

		const insertNode: SinglyLinkedItem<T> = { value, next: null };
		if (index === 0) {
			insertNode.next = this._head;
			this._head = insertNode;
		} else {
			let prev = this._head!;
			for (let i = 0; i < index - 1 && prev.next; i++) {
				prev = prev.next;
			}
			insertNode.next = prev.next;
			prev.next = insertNode;
		}

		this._length++;
	}

	/**
	 * Remove a node from the list from a zero-based index.
	 * @param index The zero-based index to remove from the list.
	 * @returns The removed value.
	 */
	remove(index: number): T | null {
		if (!this._head) return null;
		if (index < 0) index = this._length + index;
		if (index < 0) return null;

		if (index === 0) {
			const ret = this._head;
			this._head = this._head.next;
			this._length--;
			return ret.value;
		}

		let prev = this._head;
		for (let i = 0; i < index - 1 && prev.next; i++) {
			prev = prev.next;
		}
		if (!prev.next) return null;

		const ret = prev.next;
		prev.next = ret.next;
		this._length--;
		return ret.value;
	}

	/**
	 * The first value in the list.
	 */
	get head(): T | null {
		return this._head ? this._head.value : null;
	}
	set head(value: T) {
		if (this._head) {
			this._head.value = value;
		} else {
			this._length = 1;
			this._head = {
				value,
				next: null
			};
		}
	}

	/**
	 * The total number of nodes in the list.
	 */
	get length(): number {
		return this._length;
	}

	/**
	 * Generic iterator.
	 */
	[Symbol.iterator](): Iterator<T> {
		let current = this._head;
		return {
			next(): IteratorResult<T> {
				if (current) {
					const value = current.value;
					current = current.next;
					return { value, done: false };
				}
				return { value: undefined as T, done: true };
			}
		};
	}
}
