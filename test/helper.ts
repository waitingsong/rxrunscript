
import * as assert from 'power-assert'


export function assertOnOpensslStderr(err: Error, stderrPrefix: string) {
  const msg = err ? err.message : ''
  if (msg) {
    if (stderrPrefix.length) {
      const msg1 = msg.slice(0, stderrPrefix.length)
      const msg2 = msg.slice(stderrPrefix.length)
      assert(msg1 === stderrPrefix, msg)

      const arr = msg2.split(/\r\n|\n|\r/)
      assert(arr.length >= 1)
      const stderr = arr.length >= 1 ? arr[1] : ''
      assert(stderr === '.' || /^\.+/.test(stderr) === true, msg)
    }
    else {
      const arr = msg.split(/\r\n|\n|\r/)
      assert(arr.length >= 1)
      const stderr = arr.length > 1 ? arr[1] : ''
      assert(stderr === '.' || /^\.+/.test(stderr) === true, msg)
    }
  }
  else {
    assert(false, err.message)
  }
}
