import { Observer } from 'rxjs'

import { HandleCloseOpts, HandleErrOpts, HandleStderrOpt } from './model'


export function handleStderr(
  obv: Observer<Buffer | string>,
  buf: Buffer,
  options: HandleStderrOpt,
) {

  const {
    msgInfo,
    proc,
    stderrBufLimit,
    stderrPrefix,
  } = options

  const ret = {
    stderrs: [...options.stderrArr],
  }

  if (obv.closed) {
    return ret
  }
  else {
    if (stderrBufLimit < 0) {  // ignore all
      return ret
    }
    else if (stderrBufLimit === 0) { // emit error() immediately
      const errMsg = typeof buf === 'string' ? buf : buf.toString()
      proc.kill()
      obv.error(new Error(`${stderrPrefix} ${msgInfo}\n${errMsg}`))
    }
    else if (ret.stderrs.length <= stderrBufLimit) { // continue append
      ret.stderrs.push(typeof buf === 'string' ? Buffer.from(buf) : buf)
    }
    else {
      proc.kill()
      const errMsg = Buffer.concat(ret.stderrs).toString()
      ret.stderrs.length = 0
      obv.error(new Error(`${stderrPrefix} ${msgInfo}\n${errMsg}`))
    }
  }

  return ret
}


export function handleErr(
  obv: Observer<Buffer | string>,
  err: Error,
  options: HandleErrOpts,
): void {
  const {
    errPrefix,
    msgInfo,
  } = options

  obv.error(new Error(`${errPrefix} ${msgInfo}\n` + (err && err.message ? err.message : '')))
  obv.complete()
}

export function handleClose(
  obv: Observer<Buffer | string>,
  options: HandleCloseOpts,
): void {

  const {
    code,
    hasNext,
    stderrArr,
    stderrPrefix,
    msgInfo,
  } = options

  if (obv.closed) {
    return
  }
  else if (code === 0) {
    hasNext || obv.next(Buffer.from(''))
    obv.complete()
  }
  else {
    const errMsg = (stderrArr.length > 0)
      ? Buffer.concat(stderrArr).toString()
      : 'No error message output'

    obv.error(new Error(`${stderrPrefix} code ${code}: ${msgInfo}\n${errMsg}`))
  }

}
