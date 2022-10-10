import readline from 'readline'

// Source: https://blog.openreplay.com/forever-functional-waiting-with-promises
export function until(fn, ms = 1000) {
  if (fn()) {
    return Promise.resolve(true)
  } else {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (fn()) {
          clearInterval(interval)
          resolve(true)
        }
      }, ms)
    })
  }
}

// Source: https://gist.github.com/timneutkens/f2933558b8739bbf09104fb27c5c9664
// console.clear() does not work in docker
export function clearScreen() {
  const blank = '\n'.repeat(process.stdout.rows)
  console.log(blank)
  readline.cursorTo(process.stdout, 0, 0)
  readline.clearScreenDown(process.stdout)
}
