import type { DoublyLinkedItem, SinglyLinkedItem } from "../Types.ts";

/**
 * A linear data structure where nodes are connected only to the next one via a reference.
 */
export class LinkedList<T> {
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
	 * @param index The zero-based index to insert the value at. (Default - 0)
	 */
	add(value: T, index = 0) {
		if (this._length === 0) {
			this._head = { value, next: null };
			this._length = 1;
			return;
		}
		if (index < 0) index += this.length;
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
		if (index < 0 || index >= this.length) return null;

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
	 * Get the value at a zero-based index.
	 * @param index The index to get the value of.
	 * @returns null if index out-of-bounds.
	 */
	get(index = 0): T | null {
		if (!this._head) {
			return null;
		}
		if (index >= this.length) index = this.length - 1;
		if (index < 0) index += this._length;
		if (index < 0) index = 0;
		let node = this._head;
		for (let i = 0; i < index; i++) {
			if (!node.next) {
				return null;
			}
			node = node.next;
		}
		return node.value;
	}

	/**
	 * Set a value at a zero-based index. Does nothing if index is out of bounds.
	 * @param value The value to set.
	 * @param index The index to overwrite.
	 */
	set(value: T, index = 0) {
		if (!this._head) {
			return;
		}
		if (index >= this.length) index = this.length - 1;
		if (index < 0) index += this._length;
		if (index < 0) index = 0;
		let node = this._head;
		for (let i = 0; i < index; i++) {
			if (!node.next) {
				return;
			}
			node = node.next;
		}
		node.value = value;
	}

	/**
	 * The total number of nodes in the list.
	 */
	get length(): number {
		return this._length;
	}

	/**
	 * Get the list as an array.
	 */
	toArray(): T[] {
		const arr = new Array(this.length);
		let node = this._head;
		for (let i = 0; i < arr.length && node; i++) {
			arr[i] = node.value;
			node = node.next;
		}
		return arr;
	}
}

/**
 * A linear data structure where nodes are connected to their neighbours by a reference.
 * Slightly faster to access and modify than a {@link LinkedList Singly-linked list}, but uses more memory.
 */
export class LinkedListDouble<T> {
	private _length = 0;
	private _start: DoublyLinkedItem<T> | null = null;
	private _end: DoublyLinkedItem<T> | null = null;
	/**
	 * Initialise a doubly-linked list from an array of values.
	 * @param arr The array to initialise the list with.
	 */
	constructor(arr: ArrayLike<T>) {
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
		const insertNode: DoublyLinkedItem<T> = { value, next: null, prev: null };
		if (this._length === 0) {
			this._start = insertNode;
			this._end = insertNode;
			this._length = 1;
			return;
		}
		if (index < 0) index += this.length;
		if (index < 0) index = 0;

		if (index === 0) {
			insertNode.next = this._start;
			this._start!.prev = insertNode;
			this._start = insertNode;
		} else if (index >= this.length) {
			insertNode.prev = this._end;
			this._end!.next = insertNode;
			this._end = insertNode;
		} else if (index > this.length / 2) {
			// If we are inserting more than halfway throught, traverse backwards.
			let next = this._end!;
			for (let i = this.length - 1; i > index && next.prev; i--) {
				next = next.prev;
			}
			// Stop 1 element ahead of index. Good luck trying to read this part.
			insertNode.prev = next.prev;
			next.prev = insertNode;
			if (insertNode.prev) {
				insertNode.prev.next = insertNode;
			}
			insertNode.next = next;
		} else {
			let prev = this._start!;
			for (let i = 0; i < index - 1 && prev.next; i++) {
				prev = prev.next;
			}
			insertNode.next = prev.next;
			prev.next = insertNode;
			if (insertNode.next) {
				insertNode.next.prev = insertNode;
			}
			insertNode.prev = prev;
		}

		this._length++;
	}

	/**
	 * Remove a node from the list from a zero-based index.
	 * @param index The zero-based index to remove from the list.
	 * @returns The removed value.
	 */
	remove(index: number): T | null {
		if (!this._start || !this._end) return null;
		if (index < 0 || index >= this.length) return null;

		if (this.length === 1 && index === 0) {
			const ret = this._start;
			this._start = null;
			this._end = null;
			this._length--;
			return ret.value;
		}

		if (index === 0) {
			const ret = this._start;
			this._start = this._start.next;
			this._start!.prev = null;
			this._length--;
			return ret.value;
		}

		if (index === this.length - 1) {
			const ret = this._end;
			this._end = this._end.prev;
			this._end!.next = null;
			this._length--;
			return ret.value;
		}

		if (index > this.length / 2) {
			let next = this._end;
			for (let i = this.length - 1; i > index && next.prev; i--) {
				next = next.prev;
			}
			if (!next.prev) return null;

			const ret = next.prev;
			next.prev = ret.prev;
			if (next.prev) {
				next.prev.next = next;
			}
			this._length--;
			return ret.value;
		}

		let prev = this._start;
		for (let i = 0; i < index - 1 && prev.next; i++) {
			prev = prev.next;
		}
		if (!prev.next) return null;

		const ret = prev.next;
		prev.next = ret.next;
		if (prev.next) {
			prev.next.prev = prev;
		}
		this._length--;
		return ret.value;
	}

	/**
	 * Get the value at a zero-based index. Index may be negative to get from the end of the list.
	 * @param index The index to get the value of.
	 * @returns null if index out-of-bounds.
	 */
	get(index = 0): T | null {
		if (!this._start || !this._end) {
			return null;
		}
		if (index >= this.length) index = this.length - 1;
		if (index < 0) index += this._length;
		if (index < 0) index = 0;

		if (index > this.length / 2) {
			let node = this._end;
			for (let i = this.length - 1; i > index; i--) {
				if (!node.prev) {
					return null;
				}
				node = node.prev;
			}
			return node.value;
		}

		let node = this._start;
		for (let i = 0; i < index; i++) {
			if (!node.next) {
				return null;
			}
			node = node.next;
		}
		return node.value;
	}

	/**
	 * Set a value at a zero-based index, index may be negative to set from the end of the list. Index will be clamped if out-of-bounds.
	 * @param value The value to set.
	 * @param index The index to overwrite.
	 */
	set(value: T, index = 0) {
		if (!this._start || !this._end) {
			return;
		}
		if (index >= this.length) index = this.length - 1;
		if (index < 0) index += this._length;
		if (index < 0) index = 0;

		if (index > this.length / 2) {
			let node = this._end;
			for (let i = this.length - 1; i > index; i--) {
				if (!node.prev) {
					return;
				}
				node = node.prev;
			}
			node.value = value;
		} else {
			let node = this._start;
			for (let i = 0; i < index; i++) {
				if (!node.next) {
					return;
				}
				node = node.next;
			}
			node.value = value;
		}
	}
	get length(): number {
		return this._length;
	}

	/**
	 * Get the list as an array.
	 */
	toArray(): T[] {
		const arr = new Array(this.length);
		let node = this._start;
		for (let i = 0; i < arr.length && node; i++) {
			arr[i] = node.value;
			node = node.next;
		}
		return arr;
	}
}
