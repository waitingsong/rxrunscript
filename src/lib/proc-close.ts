import { ChildProcess } from 'child_process'
import { fromEvent, Observable } from 'rxjs'
import { mapTo, take } from 'rxjs/operators'


export function bindProcClose(
  proc: ChildProcess,
): Observable<null> {

  const stream$ = <Observable<never>> fromEvent<Error>(proc, 'close').pipe(
    mapTo(null),
    take(1),
  )
  return stream$
}
