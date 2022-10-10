import https from 'node:https'
import createRBTree from '../data-structures/RBTree.js'

class OrderBookSnapshot {
  ENDPOINT = 'https://api.binance.com/api/v3/depth'
  REQUEST_TIMEOUT = 10_000 // in ms
  DEPTH = 5000
  DEFAULT_SYMBOL = 'BTCUSDT'

  constructor({ symbol, endpoint, depth } = {}) {
    symbol = symbol ?? this.DEFAULT_SYMBOL
    endpoint = endpoint ?? this.ENDPOINT
    depth = depth ?? this.DEPTH
    this.url = `${endpoint}?symbol=${symbol}&limit=${depth}`
  }

  parseSnapshot(json) {
    const { lastUpdateId, bids, asks } = json
    let snapshot = {
      lastUpdateId,
      bids: createRBTree((a, b) => b - a),
      asks: createRBTree((a, b) => a - b)
    }

    bids.forEach((x) => {
      x[0] -= 0 // str to num faster than parseFloat
      x[1] -= 0 // str to num faster than parseFloat
      snapshot.bids = snapshot.bids.insert(x[0], [x[0], x[1]])
    })

    asks.forEach((x) => {
      x[0] -= 0 // str to num faster than parseFloat
      x[1] -= 0 // str to num faster than parseFloat
      snapshot.asks = snapshot.asks.insert(x[0], [x[0], x[1]])
    })

    return snapshot
  }

  get() {
    return new Promise((resolve, reject) => {
      try {
        https
          .get(this.url, { timeout: this.REQUEST_TIMEOUT }, (res) => {
            const { statusCode } = res
            const contentType = res.headers['content-type']
            if (statusCode !== 200) {
              return reject(new Error(`Request failed non-200: httpCode=${statusCode}`))
            } else if (!/^application\/json/.test(contentType)) {
              return reject(new Error(`Invalid contentType=${contentType}`))
            }

            res.setEncoding('utf8')

            let data = []
            res.on('data', (chunk) => data.push(chunk))
            res.on('end', () => {
              let json
              try {
                json = JSON.parse(data.join(''))
              } catch (e) {
                return reject(new Error('Could not parse snapshot data: Invalid json'))
              }
              resolve(this.parseSnapshot(json))
            })
          })
          .on('timeout', () => {
            reject(new Error(`Fetching snapshot timed out after ${this.REQUEST_TIMEOUT / 1000} seconds`))
          })
          .on('error', (e) => {
            reject(e)
          })
      } catch (e) {
        reject(e)
      }
    })
  }
}

export default OrderBookSnapshot
