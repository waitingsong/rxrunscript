import { ChildProcess } from 'child_process'
import { fromEvent, Observable } from 'rxjs'
import { take } from 'rxjs/operators'

import { ProcCloseOrExitCodeSignal } from './model'


export function bindProcClose(
  proc: ChildProcess,
): Observable<ProcCloseOrExitCodeSignal> {

  const stream$ = fromEvent<ProcCloseOrExitCodeSignal>(proc, 'close').pipe(
    // tap(val => console.log('bindProcClsoe data:', val)),
    take(1),
  )
  return stream$
}
