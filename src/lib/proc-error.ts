import { ChildProcess } from 'child_process'

import { fromEvent, Observable } from 'rxjs'
import { take, takeUntil } from 'rxjs/operators'


export function bindProcError(
  proc: ChildProcess,
  closingNotifier$: Observable<unknown>,
): Observable<never> {

  const stream$ = fromEvent(proc, 'error').pipe(
    take(1),
    // tap(err => {
    //   throw err
    // }),
    takeUntil(closingNotifier$),
  )
  return stream$ as Observable<never>
}

