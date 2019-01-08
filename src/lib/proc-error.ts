import { ChildProcess } from 'child_process'
import { fromEvent, Observable } from 'rxjs'
import { take, takeUntil, tap } from 'rxjs/operators'


export function bindProcError(
  proc: ChildProcess,
  closingNotifier$: Observable<any>,
): Observable<never> {

  const stream$ = <Observable<never>> fromEvent<Error>(proc, 'error').pipe(
    take(1),
    tap(err => {
      throw err
    }),
    takeUntil(closingNotifier$),
  )
  return stream$
}
