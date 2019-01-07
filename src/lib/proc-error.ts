import { ChildProcess } from 'child_process'
import { fromEvent, Observable } from 'rxjs'
import { tap } from 'rxjs/operators'


export function bindProcError(
  proc: ChildProcess,
): Observable<never> {

  const stream$ = <Observable<never>> fromEvent<Error>(proc, 'error').pipe(
    tap(err => {
      throw err
    }),
  )
  return stream$
}
