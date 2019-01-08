import { ChildProcess } from 'child_process'
import { merge, race, Observable } from 'rxjs'
import {
  finalize,
  shareReplay,
  tap,
 } from 'rxjs/operators'

import { MsgPrefixOpts } from './model'
import { bindProcClose } from './proc-close'
import { bindProcError } from './proc-error'
import { bindProcExit } from './proc-exit'
import { bindStderrData } from './stderr'
import { bindStdoutData } from './stdout'


export function bindEvent(
  proc: ChildProcess,
  stderrMaxBufferSize: number,
  msgPrefixOpts: MsgPrefixOpts,
  script: string, // for throw error
): Observable<Buffer> {

  const { stderrPrefix } = msgPrefixOpts

  const close$ = bindProcClose(proc)
  const exit$ = bindProcExit(proc)
  const closeOrExit$ = race(close$, exit$).pipe(
    // tap(codeSignal => {
    //   console.log('close or exit event', codeSignal)
    // }),
    shareReplay(1),
  )

  const stdout$ = bindStdoutData(proc.stdout, closeOrExit$)
  const error$ = bindProcError(proc, closeOrExit$)
  const stderr$ = bindStderrData(proc.stderr, stderrMaxBufferSize, closeOrExit$).pipe(
    tap(buf => {
      const msg = buf.toString()
      throw new Error(`${stderrPrefix} ${script}\n${msg}`)
    }),
  )

  const ret$ = merge(
    stdout$,
    stderr$,
    error$,
  ).pipe(
    finalize(() => {
      // sub process may not stop
      // link: https://nodejs.org/api/child_process.html#child_process_subprocess_kill_signal
      proc.killed || proc.kill()
    }),
  )

  return ret$
}
