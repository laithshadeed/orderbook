import OrderBookDiffs from './OrderBookDiffs.js'
import OrderBookSnapshot from './OrderBookSnapshot.js'
import OrderBookSide from './OrderBookSide.js'
import OrderBookPrinterSimple from './OrderBookPrinterSimple.js'

class OrderBook {
  DEFAULT_PRINT_DEPTH = 5

  constructor({ diffs, snapshot, bids, asks, printer } = {}) {
    this.diffs = diffs || new OrderBookDiffs()
    this.snapshot = snapshot || new OrderBookSnapshot()
    this.bids = bids || new OrderBookSide({ sort: OrderBookSide.DECR })
    this.asks = asks || new OrderBookSide({ sort: OrderBookSide.INCR })
    this.printer = printer || new OrderBookPrinterSimple()
    this.isWaitingForFirstUpdate = true
    this.isFetchingSnapshot = false
    this.isSnapshotFetched = false
    this.lastUpdateId = 0
  }

  // We need to wait for the buffered updates before start fetching the snapshot as per the docs
  // https://github.com/binance/binance-spot-api-docs/blob/master/web-socket-streams.md#how-to-manage-a-local-order-book-correctly
  build() {
    return new Promise((resolve) => {
      this.diffs.bus.on('update', async () => {
        if (this.isSnapshotFetched) {
          this.update()
        } else if (!this.isFetchingSnapshot && !this.isSnapshotFetched) {
          this.isFetchingSnapshot = true
          console.log('Waiting to fetch the snapshot...')
          let { lastUpdateId, bids, asks } = await this.snapshot.get()
          this.lastUpdateId = lastUpdateId
          this.bids.init(bids)
          this.asks.init(asks)
          this.isFetchingSnapshot = false
          this.isSnapshotFetched = true
          this.update()
          resolve()
        }
      })
    })
  }

  // Docs: https://github.com/binance/binance-spot-api-docs/blob/master/web-socket-streams.md#how-to-manage-a-local-order-book-correctly
  update() {
    for (let { firstUpdateId, lastUpdateId, bids, asks } of this.diffs) {
      if (this.isWaitingForFirstUpdate) {
        if (lastUpdateId >= this.lastUpdateId + 1 && firstUpdateId <= this.lastUpdateId + 1) {
          this.isWaitingForFirstUpdate = false
          this.lastUpdateId = lastUpdateId
          this.bids.update(bids)
          this.asks.update(asks)
        }
      } else if (firstUpdateId === this.lastUpdateId + 1) {
        this.lastUpdateId = lastUpdateId
        this.bids.update(bids)
        this.asks.update(asks)
      }
    }
  }

  print(depth = this.DEFAULT_PRINT_DEPTH) {
    this.printer.print({ asks: this.asks.top(depth), bids: this.bids.top(depth) })
  }
}

export default OrderBook
