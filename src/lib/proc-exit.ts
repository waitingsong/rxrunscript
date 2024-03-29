import { ChildProcess } from 'node:child_process'

import { fromEvent, Observable } from 'rxjs'
import { take } from 'rxjs/operators'

import { ProcCloseOrExitCodeSignal } from './types.js'


export function bindProcExit(
  proc: ChildProcess,
): Observable<ProcCloseOrExitCodeSignal> {

  const stream$ = fromEvent(proc, 'exit').pipe(
    // tap(val => console.log('bindProcExit data:', val)),
    take(1),
  )
  return stream$ as Observable<ProcCloseOrExitCodeSignal>
}
