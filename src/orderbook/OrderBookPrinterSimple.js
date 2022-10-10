import readline from 'node:readline'
import OrderBookPrinter from './OrderBookPrinter.js'

// Source: https://gist.github.com/timneutkens/f2933558b8739bbf09104fb27c5c9664
// console.clear() does not work in docker
function clearScreen() {
  const blank = '\n'.repeat(process.stdout.rows)
  console.log(blank)
  readline.cursorTo(process.stdout, 0, 0)
  readline.clearScreenDown(process.stdout)
}

export default class OrderBookPrinterSimple extends OrderBookPrinter {
  print({ bids, asks }) {
    clearScreen()
    console.log(
      asks
        .reverse()
        .map(([price, quantity]) => [price.toFixed(2), quantity.toFixed(5)])
        .map(([price, quantity]) => `\x1b[31m${price}\x1b[0m  ${quantity}`)
        .join('\n') +
        '\n' +
        bids
          .map(([price, quantity]) => [price.toFixed(2), quantity.toFixed(5)])
          .map(([price, quantity]) => `\x1b[32m${price}\x1b[0m  ${quantity}`)
          .join('\n')
    )
  }
}
