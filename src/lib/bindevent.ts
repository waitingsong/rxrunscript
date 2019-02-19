import { ChildProcess } from 'child_process'
import { merge, of, race, EMPTY, Observable } from 'rxjs'
import {
  defaultIfEmpty,
  finalize,
  mergeMap,
  shareReplay,
  tap,
 } from 'rxjs/operators'

import { MsgPrefixOpts, RxSpawnOpts } from './model'
import { bindProcClose } from './proc-close'
import { bindProcError } from './proc-error'
import { bindProcExit } from './proc-exit'
import { bindStderrData } from './stderr'
import { bindStdinData } from './stdin'
import { bindStdoutData } from './stdout'


export function bindEvent(
  proc: ChildProcess,
  stderrMaxBufferSize: number,
  msgPrefixOpts: MsgPrefixOpts,
  script: string, // for throw error
  inputStream: RxSpawnOpts['inputStream'],
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

  const skipUntilNotifier$ = closeOrExit$.pipe(
    mergeMap(([code]) => {
      return code === 0 || code === null ? EMPTY : of(void 0)
    }),
  )

  const stderr$ = bindStderrData(
    proc.stderr,
    closeOrExit$,
    skipUntilNotifier$,
    stderrMaxBufferSize,
  ).pipe(
    tap(buf => {
      const msg = buf.toString()
      throw new Error(`${stderrPrefix} ${script}\n${msg}`)
    }),
  )

  const stdin$: Observable<never> = inputStream && typeof inputStream.subscribe === 'function'
    ? bindStdinData(proc.stdin, inputStream)
    : EMPTY

  const ret$ = merge(
    stdout$,
    stderr$,
    stdin$,
    error$,
  ).pipe(
    finalize(() => {
      // sub process may not stop
      // link: https://nodejs.org/api/child_process.html#child_process_subprocess_kill_signal
      proc.killed || proc.kill()
    }),
    defaultIfEmpty(Buffer.from('')),
    // tap(data => console.log(data)),
  )

  return ret$
}
