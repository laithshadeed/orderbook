import LinkedList from './LinkedList.js'

export default class Queue {
  constructor() {
    this.linkedlist = new LinkedList()
    this.size = 0
  }

  enqueue(x) {
    this.size += 1
    this.linkedlist.append(x)
  }

  dequeue() {
    this.size -= 1
    const removedHead = this.linkedlist.deleteHead()
    return removedHead?.val ?? null
  }

  get length() {
    return this.size
  }
}
