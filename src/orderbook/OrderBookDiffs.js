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

  constructor({ symbol, updateSpeed, endpoint } = {}) {
    symbol = symbol ?? this.DEFAULT_SYMBOL
    updateSpeed = updateSpeed ?? this.UPDATE_SPEED
    endpoint = endpoint ?? this.ENDPOINT

    this.bus = new EventEmitter()
    this.symbol = symbol

    // Note the size of the diffs is very small
    // < 100; making using queue unnecessary optmization; however I used it because it is an interview!
    // Instead, plain JS array is good enough
    this.diffs = new Queue()

    this.ws = new WS(`${endpoint}/${symbol}@depth@${updateSpeed}ms`)
    this.ws.on('message', (m) => this.addDiff(m))
    this.ws.on('error', (e) => {
      throw e
    })
  }

  addDiff(msg) {
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
      bids: bids.map((x) => [x[0] - 0, x[1] - 0]), // parsing strings to number
      asks: asks.map((x) => [x[0] - 0, x[1] - 0]) // parsing strings to number
    })

    this.bus.emit('process-diffs')
  }

  size() {
    return this.diffs.length
  }

  *[Symbol.iterator]() {
    while (this.diffs.length) {
      yield this.diffs.dequeue()
    }
  }
}

export default OrderBookDiffs
