import OrderBookDiffs from './OrderBookDiffs.js'
import OrderBookSnapshot from './OrderBookSnapshot.js'
import { until, clearScreen } from '../utils.js'

/**
 * TODO:
 * - Create OrderSide class and moving processing logic (tree manipulation) there
 * - [stretch] Move printing logic into different class & maybe inject it via constructor for testing
 * - [stretch] allow injecting OrderBookDiffs & OrderBookSnapshot object via constructor for testing
 */

class OrderBook {
  BUFFER_SIZE = 3
  BUFFER_TIMEOUT = 100

  constructor() {
    this.book = { lastUpdateId: 0, bids: [], asks: [] }
    this.diffs = new OrderBookDiffs()
    this.snapshot = new OrderBookSnapshot()
    this.isWaitingFirstDiff = true
  }

  async bufferDiffs() {
    await until(() => this.diffs.size() > this.BUFFER_SIZE, this.BUFFER_TIMEOUT)
  }

  async build() {
    console.log('Waiting initial diffs buffer...')
    await this.bufferDiffs()
    console.log('Waiting to fetch the snapshot...')
    this.book = await this.snapshot.get()
    this.diffs.bus.on('process-diffs', () => this.processDiffs())
    return this
  }

  // Docs: https://github.com/binance/binance-spot-api-docs/blob/master/web-socket-streams.md#how-to-manage-a-local-order-book-correctly
  processDiffs() {
    for (let { firstUpdateId, lastUpdateId, bids, asks } of this.diffs) {
      if (this.isWaitingFirstDiff) {
        if (lastUpdateId >= this.book.lastUpdateId + 1 && firstUpdateId <= this.book.lastUpdateId + 1) {
          this.isWaitingFirstDiff = false
          this.book.lastUpdateId = lastUpdateId
          this.process({ side: 'bids', items: bids })
          this.process({ side: 'asks', items: asks })
        }
      } else if (firstUpdateId === this.book.lastUpdateId + 1) {
        this.book.lastUpdateId = lastUpdateId
        this.process({ side: 'bids', items: bids })
        this.process({ side: 'asks', items: asks })
      }
    }
  }

  // Insipred by:
  // - https://github.com/fasenderos/hft-limit-order-book/blob/a0fba7342ac36d2dd03df07be5127f3fc59f9476/src/orderside.ts#L40
  // - https://steemit.com/utopian-io/@steempytutorials/part-2-manage-local-steem-orderbook-via-websocket-stream-from-exchange
  // - https://web.archive.org/web/20110219163448/http://howtohft.wordpress.com/2011/02/15/how-to-build-a-fast-limit-order-book/
  process({ side, items }) {
    for (let [price, quantity] of items) {
      if (this.book[side].get(price)) {
        if (quantity === 0) {
          this.book[side] = this.book[side].remove(price)
        } else {
          this.book[side].get(price).value = [price, quantity]
        }
      } else if (quantity === 0) {
        continue
      } else {
        this.book[side] = this.book[side].insert(price, [price, quantity])
      }
    }
  }

  print(depth) {
    clearScreen()
    console.log(
      this.book.asks.values
        .slice(0, depth)
        .reverse()
        .map(([price, quantity]) => [price.toFixed(2), quantity.toFixed(5)])
        .map(([price, quantity]) => `\x1b[31m${price}\x1b[0m  ${quantity}`)
        .join('\n') +
        '\n' +
        this.book.bids.values
          .slice(0, depth)
          .map(([price, quantity]) => [price.toFixed(2), quantity.toFixed(5)])
          .map(([price, quantity]) => `\x1b[32m${price}\x1b[0m  ${quantity}`)
          .join('\n')
    )
  }
}

export default OrderBook
