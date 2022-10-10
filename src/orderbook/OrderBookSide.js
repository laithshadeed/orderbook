import createRBTree from '../data-structures/RBTree.js'

/**
 * TODO:
 * 1. [stretch] Experiment with Skip List instead Red-black Tree
 * 2. [stretch] Experiment with combining the Ordered Set with Hash Table to improve lookup time to O(1)
 * 3. [stretch] Write Red-black tree from scratch instead of using 3rd party code
 */

class OrderBookSide {
  static INCR = 'increasing'
  static DECR = 'decreasing'
  constructor({ sort }) {
    this.cmp = sort === OrderBookSide.INCR ? this.increasingComprator : this.decreasingComprator
    this.tree = createRBTree(this.cmp)
  }

  init(list) {
    for (let [price, quantity] of list) {
      price -= 0 // str to num faster than Number.parseFloat
      quantity -= 0 //  str to num faster than Number.parseFloat
      this.tree = this.tree.insert(price, [price, quantity])
    }
  }

  // Insipred by:
  // - https://github.com/fasenderos/hft-limit-order-book/blob/a0fba7342ac36d2dd03df07be5127f3fc59f9476/src/orderside.ts#L40
  // - https://steemit.com/utopian-io/@steempytutorials/part-2-manage-local-steem-orderbook-via-websocket-stream-from-exchange
  // - https://web.archive.org/web/20110219163448/http://howtohft.wordpress.com/2011/02/15/how-to-build-a-fast-limit-order-book/
  update(list) {
    for (let [price, quantity] of list) {
      price -= 0 // str to num faster than Number.parseFloat
      quantity -= 0 //  str to num faster than Number.parseFloat
      if (this.tree.get(price)) {
        if (quantity === 0) {
          this.tree = this.tree.remove(price)
        } else {
          this.tree.get(price).value = [price, quantity]
        }
      } else if (quantity === 0) {
        continue
      } else {
        this.tree = this.tree.insert(price, [price, quantity])
      }
    }
  }

  top(len) {
    return this.tree.values.slice(0, len)
  }

  increasingComprator(a, b) {
    return a - b
  }

  decreasingComprator(a, b) {
    return b - a
  }
}

export default OrderBookSide
