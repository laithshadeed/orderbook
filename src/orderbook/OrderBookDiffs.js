import { WebSocket as WS } from 'ws'
import EventEmitter from 'node:events'
import Queue from '../data-structures/Queue.js'

/**
 * TODO:
 * 1. [stretch] Test 24 disconnection -> not needed for such a simple app
 * 2. [stretch] Test ping/pong frame, already covered with ws module
 * 3. [stretch] Replace ws dependency with in-house
 */

class OrderBookDiffs {
  ENDPOINT = 'wss://stream.binance.com:9443/ws'
  UPDATE_SPEED = 100
  EVENT_TYPE = 'depthUpdate'
  DEFAULT_SYMBOL = 'btcusdt'
  INITIAL_BUFFER_SIZE = 3

  constructor({ symbol, updateSpeed, endpoint, initialBufferSize } = {}) {
    symbol = symbol ?? this.DEFAULT_SYMBOL
    updateSpeed = updateSpeed ?? this.UPDATE_SPEED
    endpoint = endpoint ?? this.ENDPOINT
    this.initialBufferSize = initialBufferSize ?? this.INITIAL_BUFFER_SIZE
    this.isFirstUpdateEvent = true

    this.bus = new EventEmitter()
    this.symbol = symbol

    // Note the size of the diffs is very small
    // < 100; making using queue unnecessary optmization; however I used it for fun!
    // Instead, plain JS array is good enough
    this.diffs = new Queue()

    console.log('Waiting initial diffs buffer...')

    this.ws = new WS(`${endpoint}/${symbol}@depth@${updateSpeed}ms`)
    this.ws.on('message', (m) => this.add(m))
    this.ws.on('error', (e) => {
      throw e
    })
  }

  add(msg) {
    const { e: eventType, s: symbol, U: firstUpdateId, u: lastUpdateId, b: bids, a: asks } = JSON.parse(msg.toString())
    if (symbol.toLowerCase() !== this.symbol) {
      console.warn(`Invalid symbol ${symbol.toLowerCase()} != ${this.symbol}, dropping diff`)
      return
    }

    if (eventType !== this.EVENT_TYPE) {
      console.warn(`Invalid event type ${eventType} != ${this.EVENT_TYPE}, dropping diff`)
      return
    }

    this.diffs.enqueue({
      firstUpdateId,
      lastUpdateId,
      bids,
      asks
    })

    // Emit updates after we have at least few messages buffered as required by
    // https://github.com/binance/binance-spot-api-docs/blob/master/web-socket-streams.md#how-to-manage-a-local-order-book-correctly
    if (this.isFirstUpdateEvent) {
      if (this.diffs.length >= this.initialBufferSize) {
        this.isFirstUpdateEvent = false
        this.bus.emit('update')
      }
    } else {
      this.bus.emit('update')
    }
  }

  *[Symbol.iterator]() {
    while (this.diffs.length) {
      yield this.diffs.dequeue()
    }
  }
}

export default OrderBookDiffs
