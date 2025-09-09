import { LinkedList } from "./LinkedList.ts";

/**
 * LIFO linear data structure.
 */
export class Stack<T> {
	private list: LinkedList<T>;
	/**
	 * Create a new Stack from an array.
	 * @param arr The array to initialise the stack from.
	 */
	constructor(arr: ArrayLike<T>) {
		const rev = Array.from(arr).reverse();
		this.list = new LinkedList(rev);
	}
	/**
	 * Add an item to the top of the stack.
	 * @param item The item to add.
	 */
	push(item: T) {
		this.list.add(item);
	}
	/**
	 * Remove an item from the top of the stack.
	 * @returns The removed item.
	 */
	pop(): T | null {
		return this.list.remove(0);
	}
	/**
	 * Get the value of the item at the top of the stack.
	 */
	get top(): T | null {
		return this.list.get(0);
	}
	/**
	 * Get the stack as an array.
	 */
	toArray(): T[] {
		return this.list.toArray().reverse();
	}
}
