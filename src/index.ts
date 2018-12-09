import { spawn, SpawnOptions } from 'child_process'
import { Observable, Observer } from 'rxjs'

import { join } from './shared/index'


export default function(script: string, options?: SpawnOptions, maxErrorBufferCount?: number): Observable<Buffer> {
  const initialOpts: SpawnOptions = {
    cwd: process.cwd(),
    env: { ...process.env },
    stdio: 'pipe',
  }
  const opts = options ? { ...initialOpts, ...options } : initialOpts
  let sh = 'sh'
  let shFlag = '-c'

  script = script.replace(/\\/g, '/').trimLeft()

  /* istanbul ignore else */
  if (process.platform === 'win32') {
    /* istanbul ignore next */
    sh = process.env.comspec || 'cmd'
    shFlag = '/d /s /c'
    opts.windowsVerbatimArguments = true

    /* istanbul ignore else */
    if (script.slice(0, 2) === './' || script.slice(0, 3) === '../') {
      const arr = script.split(' ')

      arr[0] = join(<string> opts.cwd, arr[0])
      script = arr.join(' ')
    }
  }

  const run$: Observable<Buffer> = Observable.create((obv: Observer<Buffer | string>) => {
    const proc = spawn(sh, [shFlag, script], opts)
    const stderr = <Buffer[]> []
    const errBufLimit = typeof maxErrorBufferCount === 'number' && maxErrorBufferCount > 0
      ? maxErrorBufferCount
      : 0
    let isNext = false

    /* istanbul ignore else */
    if (proc.stdout) {
      proc.stdout.on('data', buf => {
        isNext || (isNext = true)
        obv.next(typeof buf === 'string' ? Buffer.from(buf) : buf)
      })
    }
    /* istanbul ignore else */
    if (proc.stderr) {
      proc.stderr.on('data', buf => {
        if (stderr.length <= errBufLimit) {
          stderr.push(typeof buf === 'string' ? Buffer.from(buf) : buf)
        }
        else {
          const errMsg = Buffer.concat(stderr).toString()

          obv.error(new Error(`Run script with error: "${sh} ${shFlag} ${script}"\n${errMsg}`))
          proc.kill()
        }
      })
    }

    proc.on('error', err => obv.error(err))

    proc.on('close', code => {
      let errMsg = ''

      if (stderr.length > 0) {
        errMsg = Buffer.concat(stderr).toString()
      }

      if (code !== 0 || errMsg) {
        obv.error(new Error(`Run script with error code ${code}: "${sh} ${shFlag} ${script}"\n${errMsg}`))
      }
      else {
        isNext || obv.next(Buffer.from(''))
        obv.complete()
      }
    })

    return () => proc.kill()  // for unsubscribe()
  })

  return run$
}
