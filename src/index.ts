import { spawn, ChildProcess, SpawnOptions } from 'child_process'
import { Observable, Observer } from 'rxjs'

import { join } from './shared/index'


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
    const stderrArr = <Buffer[]> []
    const stderrBufLimit = typeof maxStderrBuffer === 'number' && maxStderrBuffer >= -1
      ? +maxStderrBuffer
      : -1
    let isNext = false
    let isCompleted = false

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
        const handleStderrOpts: HandleStderrOpt = {
          stderrBufLimit,
          isCompleted,
          obv,
          proc,
          script,
          sh,
          shFlag,
          stderrArr,
        }
        isCompleted = handleStderr(buf, handleStderrOpts)
      })
    }

    proc.on('error', err => {
      obv.error(err)
      obv.complete()
    })

    proc.on('close', code => {
      if (isCompleted) {
        return
      }
      else if (code === 0) {
        isNext || obv.next(Buffer.from(''))
        obv.complete()
      }
      else {
        const errMsg = (stderrArr.length > 0)
          ? Buffer.concat(stderrArr).toString()
          : 'No error message output'

        obv.error(new Error(`Run script with error code ${code}: "${sh} ${shFlag} ${script}"\n${errMsg}`))
        obv.complete()
      }
    })

    return () => proc.kill()  // for unsubscribe()
  })

  return run$
}


function handleStderr(buf: Buffer, options: HandleStderrOpt): boolean {
  const {
    stderrBufLimit,
    stderrArr,
    proc,
    obv,
    sh,
    shFlag,
    script,
  } = options
  let { isCompleted } = options

  /* istanbul ignore else */
  if (isCompleted) {
    return isCompleted
  }
  /* istanbul ignore else */
  if (obv.closed) {
    process.exit()
    return true
  }

  if (stderrBufLimit < 0) {  // ignore all
    return isCompleted
  }
  else if (stderrBufLimit === 0) { // emit error() immediately
    const errMsg = typeof buf === 'string' ? buf : buf.toString()
    stderrArr.length = 0
    proc.kill()
    obv.error(new Error(`Run script with error: "${sh} ${shFlag} ${script}"\n${errMsg}`))
    obv.complete()
    isCompleted = true
  }
  else if (stderrArr.length <= stderrBufLimit) { // continue append
    stderrArr.push(typeof buf === 'string' ? Buffer.from(buf) : buf)
  }
  else {
    proc.kill()
    const errMsg = Buffer.concat(stderrArr).toString()
    stderrArr.length = 0
    obv.error(new Error(`Run script with error: "${sh} ${shFlag} ${script}"\n${errMsg}`))
    obv.complete()
    isCompleted = true
  }

  return isCompleted
}


export interface HandleStderrOpt {
  stderrBufLimit: number
  stderrArr: Buffer[]
  proc: ChildProcess
  obv: Observer<Buffer | string>
  isCompleted: boolean
  sh: string
  shFlag: string
  script: string,
}
