import OrderBook from './orderbook/OrderBook.js'

try {
  const DEFAULT_TIMEOUT = 10_000 // in ms
  const DEFAULT_SNAPSHOT_DEPTH = 5
  const timeout = Number.parseInt(process.env['TIMEOUT'] ?? DEFAULT_TIMEOUT, 10) || DEFAULT_TIMEOUT
  const depth = Number.parseInt(process.env['DEPTH'] ?? DEFAULT_SNAPSHOT_DEPTH, 10) || DEFAULT_SNAPSHOT_DEPTH
  const orderBook = new OrderBook()
  await orderBook.build()
  orderBook.print(depth)
  setInterval(() => orderBook.print(depth), timeout)
} catch (e) {
  console.error(e)
  process.exit(1)
}

process.on('SIGINT', () => {
  process.exit()
})
