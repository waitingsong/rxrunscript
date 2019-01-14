import { ChildProcess } from 'child_process'
import { fromEvent, Observable } from 'rxjs'
import { shareReplay, take, takeUntil } from 'rxjs/operators'


export function bindStdoutData(
  stdout: ChildProcess['stdout'],
  takeUntilNotifier$: Observable<any>,
): Observable<Buffer> {

  const take$ = takeUntilNotifier$.pipe(take(1), shareReplay())
  const data$ = fromEvent<Buffer>(stdout, 'data').pipe(
    // tap(buf => console.info('stdout:', buf.toString())),
    takeUntil(take$),
  )

  return data$
}
