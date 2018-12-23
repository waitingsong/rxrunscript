import { spawn, SpawnOptions } from 'child_process'
import { Observable, Observer } from 'rxjs'

import { join } from '../shared/index'

import { initialMsgPrefixOpts, initialSpawnOpts } from './config'
import { handleClose, handleErr, handleStderr } from './event'
import { HandleCloseOpts, HandleStderrOpt } from './model'


 /**
  * Run script
  * @param script {string}
  * @param options {SpawnOptions}
  * @param maxStderrBuffer {number} Default -1
  *   - program may output running info via stderr and running result via stdout
  *   - -1: ignore and no error() emitted
  *   - 0: emit error() immediately, emit complete() and kill sub process
  *   - positive: emit error() during stderr buffer full
  */
export function run(
  script: string,
  options?: SpawnOptions,
  maxStderrBuffer: number = -1,
): Observable<Buffer> {

  const {
    scriptNorm,
    sh,
    shFlag,
    spawnOpts,
    stderrBufLimit,
  } = processOpts(script, options, maxStderrBuffer)

  const msgInfo = `"${sh} ${shFlag} ${script}"`

  const run$: Observable<Buffer> = Observable.create((obv: Observer<Buffer | string>) => {
    const proc = spawn(sh, [shFlag, scriptNorm], spawnOpts)
    const { errPrefix, stderrPrefix } = initialMsgPrefixOpts
    let stderrArr = <Buffer[]> []
    let hasNext = false

    /* istanbul ignore else */
    if (proc.stdout) {
      proc.stdout.on('data', buf => {
        hasNext || (hasNext = true)
        obv.next(typeof buf === 'string' ? Buffer.from(buf) : buf)
      })
    }
    /* istanbul ignore else */
    if (proc.stderr) {
      proc.stderr.on('data', buf => {
        const handleStderrOpts: HandleStderrOpt = {
          stderrBufLimit,
          proc,
          stderrArr,
          msgInfo,
          stderrPrefix,
        }
        const ret = handleStderr(obv, buf, handleStderrOpts)
        stderrArr = ret.stderrs
      })
    }

    proc.on('error', err => {
      handleErr(obv, err, { errPrefix, msgInfo })
    })

    proc.on('close', code => {
      const opts: HandleCloseOpts = {
        code,
        hasNext,
        msgInfo,
        stderrArr,
        stderrPrefix,
      }
      handleClose(obv, opts)
    })

    return () => proc.kill()  // for unsubscribe()
  })

  return run$
}


function processOpts(
  script: string,
  options?: SpawnOptions,
  maxStderrBuffer: number = -1,
) {

  const spawnOpts = options ? { ...initialSpawnOpts, ...options } : initialSpawnOpts
  let sh = 'sh'
  let shFlag = '-c'

  script = script.replace(/\\/g, '/').trimLeft()

  /* istanbul ignore else */
  if (process.platform === 'win32') {
    /* istanbul ignore next */
    sh = process.env.comspec || 'cmd'
    shFlag = '/d /s /c'
    spawnOpts.windowsVerbatimArguments = true

    /* istanbul ignore else */
    if (script.slice(0, 2) === './' || script.slice(0, 3) === '../') {
      const arr = script.split(' ')

      arr[0] = join(<string> spawnOpts.cwd, arr[0])
      script = arr.join(' ')
    }
  }

  const stderrBufLimit = typeof maxStderrBuffer === 'number' && maxStderrBuffer >= -1
    ? +maxStderrBuffer
    : -1

  return {
    sh,
    shFlag,
    scriptNorm: script,
    spawnOpts,
    stderrBufLimit,
  }
}
