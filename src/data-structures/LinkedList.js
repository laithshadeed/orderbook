class LinkedListNode {
  constructor(val, next) {
    this.val = val ?? null
    this.next = next ?? null
  }
}

export default class LinkedList {
  constructor({ head, tail } = { head: null, tail: null }) {
    this.head = head ?? null
    this.tail = tail ?? null
  }

  append(value) {
    const newNode = new LinkedListNode(value)

    if (!this.head) {
      this.head = newNode
      this.tail = newNode
      return this
    }

    this.tail.next = newNode
    this.tail = newNode
    return this
  }

  deleteHead() {
    if (!this.head) {
      return null
    }

    const deletedHead = this.head
    if (this.head.next) {
      this.head = this.head.next
    } else {
      this.head = null
      this.tail = null
    }

    return deletedHead
  }

  toArray() {
    const nodes = []
    let currentNode = this.head
    while (currentNode) {
      nodes.push(currentNode.val)
      currentNode = currentNode.next
    }

    return nodes
  }
}
