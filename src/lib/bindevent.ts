import { ChildProcess } from 'child_process'

import { map, merge, of, race, EMPTY, Observable } from 'rxjs'
import {
  defaultIfEmpty,
  finalize,
  mergeMap,
  shareReplay,
  tap,
} from 'rxjs/operators'

import { bindProcClose } from './proc-close'
import { bindProcError } from './proc-error'
import { bindProcExit } from './proc-exit'
import { bindStderrData } from './stderr'
import { bindStdinData } from './stdin'
import { bindStdoutData } from './stdout'
import {
  ExitCodeSignal,
  MsgPrefixOpts,
  OutputRow,
  ProcCloseOrExitCodeSignal,
  RxSpawnOpts,
} from './types'


export function bindEvent(
  proc: ChildProcess,
  stderrMaxBufferSize: number,
  msgPrefixOpts: MsgPrefixOpts,
  script: string, // for throw error
  inputStream: RxSpawnOpts['inputStream'],
): Observable<OutputRow> {

  const { stderrPrefix } = msgPrefixOpts

  const close$ = bindProcClose(proc)
  const exit$ = bindProcExit(proc)
  const closeOrExit$ = race(close$, exit$).pipe(
    map<ProcCloseOrExitCodeSignal, ExitCodeSignal>((data) => {
      const [exitCode, exitSignal] = data
      if (typeof exitCode === 'number') {
        return { exitCode, exitSignal }
      }
      return { exitCode: 0, exitSignal }
    }),
    // tap((codeSignal) => {
    //   console.log('close or exit event', codeSignal)
    // }),
    shareReplay(1),
  )

  const stdout$ = bindStdoutData(proc.stdout, closeOrExit$)
  const error$ = bindProcError(proc, closeOrExit$)

  const skipUntilNotifier$ = closeOrExit$.pipe(
    mergeMap(({ exitCode }) => {
      return exitCode === 0 ? EMPTY : of(void 0)
    }),
  )

  const stderr$ = bindStderrData(
    proc.stderr,
    closeOrExit$,
    skipUntilNotifier$,
    stderrMaxBufferSize,
  ).pipe(
    tap((row) => {
      const msg = row.data.toString()
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
    closeOrExit$,
  ).pipe(
    map((row) => {
      if (typeof row.exitCode === 'undefined') {
        return row as OutputRow
      }
      const row2: OutputRow = {
        ...row,
        data: Buffer.from(''),
      }
      return row2
    }),
    finalize(() => {
      // sub process may not stop
      // link: https://nodejs.org/api/child_process.html#child_process_subprocess_kill_signal
      proc.killed || proc.kill()
    }),
    defaultIfEmpty({
      exitCode: 0,
      exitSignal: null,
      data: Buffer.from(''),
    } as OutputRow),
    // tap(data => console.log(data)),
  )

  return ret$
}
