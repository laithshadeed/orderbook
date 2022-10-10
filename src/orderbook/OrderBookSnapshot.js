import https from 'node:https'

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
              resolve(json)
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
